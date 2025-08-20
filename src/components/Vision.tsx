"use client";

import React, { useEffect, useRef, useState } from "react";
import Peer, { SignalData } from "simple-peer";
import { getClientId } from "@/lib/clientId";

type Mode = "host" | "viewer";

type VisionProps = {
    initialRoomId?: string;
    initialMode?: Mode;
};

type SdpDoc = {
    roomId: string;
    from: string;
    sdp: { type: "offer" | "answer"; sdp: string };
};

function genId() {
    if (typeof crypto !== "undefined" && "randomUUID" in crypto) return crypto.randomUUID();
    return `${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

export default function Vision({ initialRoomId, initialMode }: VisionProps) {
    const [mode, setMode] = useState<Mode>(initialMode ?? "host");
    const [roomId, setRoomId] = useState<string>(initialRoomId ?? "");
    const [status, setStatus] = useState<"idle" | "connecting" | "connected" | "error">("idle");
    const [err, setErr] = useState<string>("");

    const [mounted, setMounted] = useState(false);
    const [viewerHref, setViewerHref] = useState<string>("");

    const clientIdRef = useRef<string>("");
    const peerRef = useRef<Peer.Instance | null>(null);
    const streamRef = useRef<MediaStream | null>(null);
    const hostIdRef = useRef<string>(""); // важливо для viewer -> to=hostId

    const localVideoRef = useRef<HTMLVideoElement | null>(null);
    const remoteVideoRef = useRef<HTMLVideoElement | null>(null);

    const offerTimerRef = useRef<number | null>(null);
    const answerTimerRef = useRef<number | null>(null);
    const iceTimerRef = useRef<number | null>(null);

    useEffect(() => { setMounted(true); }, []);

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

        if (offerTimerRef.current) { window.clearInterval(offerTimerRef.current); offerTimerRef.current = null; }
        if (answerTimerRef.current) { window.clearInterval(answerTimerRef.current); answerTimerRef.current = null; }
        if (iceTimerRef.current) { window.clearInterval(iceTimerRef.current); iceTimerRef.current = null; }
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
                    { urls: ["stun:stun.l.google.com:19302", "stun:global.stun.twilio.com:3478"] },
                ],
                iceTransportPolicy: "all",
            },
            stream: isHost ? (streamRef.current ?? undefined) : undefined,
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
                    // HOST -> зберегти offer (з from = hostId)
                    const res = await fetch("/api/webrtc/offer", {
                        method: "POST",
                        headers: { "content-type": "application/json" },
                        body: JSON.stringify({ roomId: id, offer: data, from: clientIdRef.current }),
                    });
                    if (!res.ok) throw new Error("offer save failed");
                } else if ((data as any).type === "answer") {
                    // VIEWER -> зберегти answer (to = hostIdRef.current)
                    const res = await fetch("/api/webrtc/answer", {
                        method: "POST",
                        headers: { "content-type": "application/json" },
                        body: JSON.stringify({
                            roomId: id,
                            answer: data,
                            from: clientIdRef.current,
                            to: hostIdRef.current || "", // може бути встановлений під час pollOffer
                        }),
                    });
                    if (!res.ok) throw new Error("answer save failed");
                } else if ((data as any).candidate) {
                    const res = await fetch("/api/webrtc/candidate", {
                        method: "POST",
                        headers: { "content-type": "application/json" },
                        body: JSON.stringify({
                            roomId: id,
                            from: clientIdRef.current,
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

        function isValidSdp(obj: any, expected: "offer" | "answer"): obj is { type: "offer" | "answer"; sdp: string } {
            return obj && obj.type === expected && typeof obj.sdp === "string";
        }

        // --- viewer: poll OFFER (повний документ, щоб взяти hostId=from)
        async function pollOfferOnce(peerInst: Peer.Instance, room: string) {
            const r = await fetch(`/api/webrtc/offer?roomId=${encodeURIComponent(room)}`, { cache: "no-store" });
            if (!r.ok) return false;
            const doc = (await r.json()) as Partial<SdpDoc> | null;
            if (doc && doc.sdp && isValidSdp(doc.sdp, "offer")) {
                if (doc.from) hostIdRef.current = doc.from; // ЗАПАМ'ЯТАТИ hostId
                if (peerRef.current === peerInst) peerInst.signal(doc.sdp);
                return true;
            }
            return false;
        }

        // --- host: poll ANSWER (цільово to=hostId)
        async function pollAnswerOnce(peerInst: Peer.Instance, room: string, hostId: string) {
            if (!hostId) return false;
            const r = await fetch(
                `/api/webrtc/answer?roomId=${encodeURIComponent(room)}&to=${encodeURIComponent(hostId)}`,
                { cache: "no-store" }
            );
            if (!r.ok) return false;
            const doc = await r.json();
            const sdp = doc?.sdp ?? null;
            if (isValidSdp(sdp, "answer")) {
                if (peerRef.current === peerInst) peerInst.signal(sdp);
                return true;
            }
            return false;
        }

        // --- ICE: підтягувати «всі, крім моїх»
        async function pollIceOnce(peerInst: Peer.Instance, room: string, meId: string) {
            const r = await fetch(
                `/api/webrtc/candidate?roomId=${encodeURIComponent(room)}&from=${encodeURIComponent(meId)}`,
                { cache: "no-store" }
            );
            if (!r.ok) return;
            const arr = await r.json();
            if (Array.isArray(arr)) {
                for (const item of arr) {
                    if (item?.type === "candidate" && item.candidate) {
                        if (peerRef.current === peerInst) peerInst.signal(item);
                    }
                }
            }
        }

        // Запускаємо пулінг
        if (!isHost) {
            offerTimerRef.current = window.setInterval(async () => {
                try {
                    const got = await pollOfferOnce(peer, id);
                    if (got && offerTimerRef.current) {
                        clearInterval(offerTimerRef.current);
                        offerTimerRef.current = null;
                    }
                } catch { }
            }, 1200) as any;
        } else {
            answerTimerRef.current = window.setInterval(async () => {
                try {
                    const got = await pollAnswerOnce(peer, id, clientIdRef.current);
                    if (got && answerTimerRef.current) {
                        clearInterval(answerTimerRef.current);
                        answerTimerRef.current = null;
                    }
                } catch { }
            }, 1200) as any;
        }

        iceTimerRef.current = window.setInterval(async () => {
            try {
                await pollIceOnce(peer, id, clientIdRef.current);
            } catch { }
        }, 900) as any;

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

            // готуємо полотно
            const canvas = document.createElement("canvas");
            const w = el.videoWidth || 640;
            const h = el.videoHeight || 360;
            canvas.width = w;
            canvas.height = h;

            const ctx = canvas.getContext("2d");
            if (!ctx) throw new Error("canvas ctx error");

            ctx.drawImage(el, 0, 0, w, h);

            // JPEG 0.8 — оптимально
            const dataUrl = canvas.toDataURL("image/jpeg", 0.8);

            const res = await fetch("/api/vision/snapshot", {
                method: "POST",
                headers: { "content-type": "application/json" },
                body: JSON.stringify({
                    roomId: await ensureRoomId(),
                    by: clientIdRef.current,
                    imageDataUrl: dataUrl, // <— ключ, який читає API
                }),
            });

            if (!res.ok) {
                const j = await res.json().catch(() => ({}));
                throw new Error(j?.error || "snapshot save failed");
            }
            // необов'язково: підсвітимо статус
            setErr("");
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
