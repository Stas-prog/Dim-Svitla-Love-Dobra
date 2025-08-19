"use client";

import React, { useEffect, useRef, useState } from "react";
import Peer, { SignalData } from "simple-peer";
import { getClientId } from "@/lib/clientId";

type Mode = "host" | "viewer";

type VisionProps = {
    initialRoomId?: string;
    initialMode?: Mode;
};

function genId() {
    if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
        return crypto.randomUUID();
    }
    return `${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

export default function Vision({ initialRoomId, initialMode }: VisionProps) {
    // 1) базові стейти з урахуванням пропсів (щоб SSR/CSR збігались)
    const [mode, setMode] = useState<Mode>(initialMode ?? "host");
    const [roomId, setRoomId] = useState<string>(initialRoomId ?? "");
    const [status, setStatus] = useState<"idle" | "connecting" | "connected" | "error">("idle");
    const [err, setErr] = useState<string>("");

    // hydration-сейф посилання
    const [mounted, setMounted] = useState(false);
    const [viewerHref, setViewerHref] = useState<string>("");

    const clientIdRef = useRef<string>("");
    const peerRef = useRef<Peer.Instance | null>(null);
    const streamRef = useRef<MediaStream | null>(null);

    const localVideoRef = useRef<HTMLVideoElement | null>(null);
    const remoteVideoRef = useRef<HTMLVideoElement | null>(null);

    useEffect(() => { setMounted(true); }, []);

    // 2) Підхопити з URL лише те, чого нема у пропсах
    useEffect(() => {
        if (!mounted) return;

        clientIdRef.current = getClientId();

        const url = new URL(window.location.href);

        if (initialMode == null) {
            const qpMode = (url.searchParams.get("mode") as Mode) || mode;
            setMode(qpMode);
        }
        if (!initialRoomId) {
            const qpId = url.searchParams.get("roomId");
            if (qpId) {
                setRoomId(qpId);
            } else {
                const id = genId();
                setRoomId(id);
                url.searchParams.set("roomId", id);
                if (!url.searchParams.get("mode")) url.searchParams.set("mode", initialMode ?? mode);
                window.history.replaceState({}, "", url.toString());
            }
        }
    }, [mounted]); // eslint-disable-line

    // 3) Формувати viewerHref тільки на клієнті
    useEffect(() => {
        if (!mounted) return;
        try {
            const url = new URL(window.location.href);
            url.searchParams.set("mode", "viewer");
            if (roomId) url.searchParams.set("roomId", roomId);
            setViewerHref(url.toString());
        } catch {
            setViewerHref("");
        }
    }, [mounted, roomId]);

    function destroyPeer() {
        try { peerRef.current?.destroy(); } catch { }
        peerRef.current = null;
    }

    async function ensureRoomId(): Promise<string> {
        if (roomId) return roomId;
        const id = genId();
        setRoomId(id);
        if (mounted) {
            const url = new URL(window.location.href);
            url.searchParams.set("roomId", id);
            if (!url.searchParams.get("mode")) url.searchParams.set("mode", mode);
            window.history.replaceState({}, "", url.toString());
        }
        return id;
    }

    async function handleStartCamera() {
        setErr("");
        try {
            const media = await navigator.mediaDevices.getUserMedia({ video: true, audio: false });
            streamRef.current = media;
            if (localVideoRef.current) localVideoRef.current.srcObject = media;
        } catch (e: any) {
            setErr(e?.message || "getUserMedia failed");
        }
    }

    async function handleConnect() {
        setErr("");
        setStatus("connecting");

        const id = await ensureRoomId();

        destroyPeer();

        const isHost = mode === "host";
        const peer = new Peer({
            initiator: isHost,
            trickle: true,
            config: {
                iceServers: [
                    { urls: "stun:stun.l.google.com:19302" },
                    { urls: "stun:global.stun.twilio.com:3478?transport=udp" },
                ],
            },
            stream: isHost ? streamRef.current ?? undefined : undefined,
        });
        peerRef.current = peer;

        if (!isHost) {
            peer.on("stream", (remote: MediaStream) => {
                const el = remoteVideoRef.current;
                if (!el) return;
                el.srcObject = remote;
                el.play().catch(() => { });
            });
        } else {
            if (!streamRef.current) {
                try {
                    const media = await navigator.mediaDevices.getUserMedia({ video: true, audio: false });
                    streamRef.current = media;
                    if (localVideoRef.current) localVideoRef.current.srcObject = media;
                    media.getTracks().forEach((t) => peer.addTrack(t, media));
                } catch (e: any) {
                    setErr(e?.message || "getUserMedia failed");
                }
            }
        }

        peer.on("signal", async (data: SignalData) => {
            try {
                if ((data as any).type === "offer") {
                    const res = await fetch("/api/webrtc/offer", {
                        method: "POST",
                        headers: { "content-type": "application/json" },
                        body: JSON.stringify({ roomId: id, offer: data, from: clientIdRef.current }),
                    });
                    if (!res.ok) throw new Error("offer save failed");
                } else if ((data as any).type === "answer") {
                    const res = await fetch("/api/webrtc/answer", {
                        method: "POST",
                        headers: { "content-type": "application/json" },
                        body: JSON.stringify({ roomId: id, answer: data, from: clientIdRef.current }),
                    });
                    if (!res.ok) throw new Error("answer save failed");
                } else if ((data as any).candidate) {
                    const res = await fetch("/api/webrtc/candidate", {
                        method: "POST",
                        headers: { "content-type": "application/json" },
                        body: JSON.stringify({
                            roomId: id,
                            from: clientIdRef.current,
                            to: undefined,
                            ice: { type: "candidate", candidate: (data as any).candidate },
                        }),
                    });
                    if (!res.ok) throw new Error("ice save failed");
                }
            } catch (e: any) {
                console.error("signal POST error", e);
                setErr(e.message || "signal error");
            }
        });

        const poll = async () => {
            try {
                if (isHost) {
                    const ansRes = await fetch(`/api/webrtc/answer?roomId=${encodeURIComponent(id)}&to=${encodeURIComponent(clientIdRef.current)}`, { cache: "no-store" });
                    if (ansRes.ok) {
                        const ans = await ansRes.json();
                        if ((ans as any)?.type === "answer" || (ans as any)?.sdp) {
                            peer.signal(ans);
                        }
                    }
                } else {
                    const offRes = await fetch(`/api/webrtc/offer?roomId=${encodeURIComponent(id)}`, { cache: "no-store" });
                    if (offRes.ok) {
                        const off = await offRes.json();
                        if ((off as any)?.type === "offer" || (off as any)?.sdp) {
                            peer.signal(off);
                        }
                    }
                }

                const iceRes = await fetch(`/api/webrtc/candidate?roomId=${encodeURIComponent(id)}&to=${encodeURIComponent(clientIdRef.current)}`, { cache: "no-store" });
                if (iceRes.ok) {
                    const arr = await iceRes.json();
                    if (Array.isArray(arr)) {
                        arr.forEach((item) => {
                            if (item?.type === "candidate" && item.candidate) {
                                peer.signal(item);
                            }
                        });
                    }
                }
            } catch { }
        };

        const interval = window.setInterval(poll, 1500);
        peer.once("close", () => window.clearInterval(interval));
        peer.once("error", () => window.clearInterval(interval));

        peer.on("connect", () => setStatus("connected"));
        peer.on("error", (e) => { setErr(e.message || "peer error"); setStatus("error"); });
        peer.on("close", () => setStatus("idle"));
    }

    function handleStop() {
        setErr("");
        setStatus("idle");
        destroyPeer();
        try { streamRef.current?.getTracks().forEach(t => t.stop()); } catch { }
        streamRef.current = null;
    }

    async function handleSnapshot() {
        try {
            const el = mode === "host" ? localVideoRef.current : remoteVideoRef.current;
            if (!el) throw new Error("video element not ready");
            const canvas = document.createElement("canvas");
            canvas.width = el.videoWidth || 640;
            canvas.height = el.videoHeight || 360;
            const ctx = canvas.getContext("2d");
            if (!ctx) throw new Error("canvas ctx error");
            ctx.drawImage(el, 0, 0, canvas.width, canvas.height);
            const dataUrl = canvas.toDataURL("image/jpeg", 0.8);

            const res = await fetch("/api/vision/snapshot", {
                method: "POST",
                headers: { "content-type": "application/json" },
                body: JSON.stringify({
                    roomId: await ensureRoomId(),
                    by: clientIdRef.current,
                    imageBase64: dataUrl,
                }),
            });
            if (!res.ok) throw new Error("snapshot save failed");
        } catch (e: any) {
            setErr(e.message || "snapshot error");
        }
    }

    return (
        <div className="rounded-2xl p-4 my-6 bg-slate-900 text-slate-50 shadow vision-ui">
            <div className="flex items-center gap-2 flex-wrap">
                <span className="px-2 py-1 rounded bg-slate-700 text-xs">mode: {mode}</span>
                <span className="px-2 py-1 rounded bg-slate-700 text-xs">status: {status}</span>
                {err && <span className="px-2 py-1 rounded bg-rose-600 text-xs">ERR: {err}</span>}
                <div className="ml-auto flex gap-2">
                    <button
                        className={`px-3 py-1 rounded ${mode === "host" ? "bg-amber-500 text-black" : "bg-slate-700"}`}
                        onClick={() => setMode("host")}
                    >host</button>
                    <button
                        className={`px-3 py-1 rounded ${mode === "viewer" ? "bg-emerald-400 text-black" : "bg-slate-700"}`}
                        onClick={() => setMode("viewer")}
                    >viewer</button>
                </div>
            </div>

            <div className="mt-3 grid gap-3 sm:grid-cols-2">
                <div className="rounded-lg bg-slate-800 p-3">
                    <div className="text-xs text-slate-400 mb-1">roomId</div>
                    <input
                        className="w-full rounded bg-slate-900 border border-slate-600 px-2 py-1"
                        value={roomId}
                        onChange={(e) => {
                            const v = e.target.value.trim();
                            setRoomId(v);
                            if (mounted) {
                                const url = new URL(window.location.href);
                                if (v) url.searchParams.set("roomId", v); else url.searchParams.delete("roomId");
                                window.history.replaceState({}, "", url.toString());
                            }
                        }}
                        placeholder="auto-generated"
                    />
                    <div className="text-xs text-slate-400 mt-2">viewer link</div>
                    <div className="break-all text-xs bg-slate-900 rounded p-2 border border-slate-700" suppressHydrationWarning>
                        {mounted ? (viewerHref || "—") : "—"}
                    </div>
                </div>

                <div className="rounded-lg bg-slate-800 p-3 flex items-center gap-2 flex-wrap">
                    {mode === "host" && (
                        <button className="px-3 py-1 rounded bg-cyan-400 text-black" onClick={handleStartCamera}>
                            🎥 Увімкнути камеру (host)
                        </button>
                    )}
                    <button className="px-3 py-1 rounded bg-emerald-400 text-black" onClick={handleConnect}>
                        🔗 Підключити
                    </button>
                    <button className="px-3 py-1 rounded bg-amber-400 text-black" onClick={handleSnapshot}>
                        📸 Зробити фото в Mongo
                    </button>
                    <button className="px-3 py-1 rounded bg-slate-600" onClick={handleStop}>
                        ⛔️ Зупинити
                    </button>
                </div>
            </div>

            <div className="mt-4 grid gap-3 sm:grid-cols-2">
                <div className="rounded-lg bg-slate-800 p-2">
                    <div className="text-xs text-slate-400 px-2 pt-1">local</div>
                    <video ref={localVideoRef} autoPlay playsInline muted className="w-full rounded" />
                </div>
                <div className="rounded-lg bg-slate-800 p-2">
                    <div className="text-xs text-slate-400 px-2 pt-1">remote</div>
                    <video ref={remoteVideoRef} autoPlay playsInline className="w-full rounded" />
                </div>
            </div>
        </div>
    );
}
