"use client";

import React, { useEffect, useRef, useState } from "react";
import Peer, { SignalData } from "simple-peer";
import { getClientId } from "@/lib/clientId";

type Mode = "host" | "viewer";
type VisionProps = { initialRoomId?: string; initialMode?: Mode };
type RecentRoom = { roomId: string; lastSeen: string };

function genId() {
    if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
        return crypto.randomUUID();
    }
    return `${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

const LS_KEY = "vision-recent-rooms";

function loadLocalRooms(): RecentRoom[] {
    if (typeof window === "undefined") return [];
    try {
        const raw = localStorage.getItem(LS_KEY);
        const arr = raw ? (JSON.parse(raw) as RecentRoom[]) : [];
        return Array.isArray(arr) ? arr : [];
    } catch { return []; }
}

function saveLocalRoom(roomId: string) {
    if (typeof window === "undefined") return;
    const now = new Date().toISOString();
    const arr = loadLocalRooms().filter(r => r.roomId !== roomId);
    arr.unshift({ roomId, lastSeen: now });
    localStorage.setItem(LS_KEY, JSON.stringify(arr.slice(0, 30)));
}

export default function Vision({ initialRoomId, initialMode }: VisionProps) {
    const [mode, setMode] = useState<Mode>(initialMode ?? "host");
    const [roomId, setRoomId] = useState<string>(initialRoomId ?? "");
    const [status, setStatus] = useState<"idle" | "connecting" | "connected" | "error">("idle");
    const [err, setErr] = useState<string>("");

    const [mounted, setMounted] = useState(false);
    const [viewerHref, setViewerHref] = useState<string>("");

    const [recent, setRecent] = useState<RecentRoom[]>([]);

    const clientIdRef = useRef<string>("");
    const peerRef = useRef<Peer.Instance | null>(null);
    const streamRef = useRef<MediaStream | null>(null);

    const localVideoRef = useRef<HTMLVideoElement | null>(null);
    const remoteVideoRef = useRef<HTMLVideoElement | null>(null);

    useEffect(() => { setMounted(true); }, []);

    // URL -> mode/roomId (лише якщо не задали пропсами)
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
                // якщо Viewer без id — спробуємо підхопити останню
                if (mode === "viewer") {
                    const local = loadLocalRooms();
                    if (local[0]) {
                        setRoomId(local[0].roomId);
                    }
                }
            }
        }
    }, [mounted]); // eslint-disable-line

    // viewer link (тільки на клієнті)
    useEffect(() => {
        if (!mounted) return;
        try {
            const url = new URL(window.location.href);
            url.searchParams.set("mode", "viewer");
            if (roomId) url.searchParams.set("roomId", roomId);
            setViewerHref(url.toString());
        } catch { setViewerHref(""); }
    }, [mounted, roomId]);

    // підвантажити останні кімнати із сервера та змерджити з локальними
    useEffect(() => {
        if (!mounted) return;

        (async () => {
            try {
                const res = await fetch("/api/vision/rooms?limit=20", { cache: "no-store" });
                const j = await res.json().catch(() => ({}));
                const server: RecentRoom[] = Array.isArray(j?.items) ? j.items : [];
                const local = loadLocalRooms();

                const map = new Map<string, string>();
                for (const r of [...server, ...local]) {
                    const cur = map.get(r.roomId);
                    if (!cur || r.lastSeen > cur) map.set(r.roomId, r.lastSeen);
                }
                const merged: RecentRoom[] = Array.from(map.entries())
                    .map(([roomId, lastSeen]) => ({ roomId, lastSeen }))
                    .sort((a, b) => (a.lastSeen < b.lastSeen ? 1 : -1))
                    .slice(0, 30);

                setRecent(merged);

                // якщо ми viewer без roomId — підхопимо найсвіжіший
                if (mode === "viewer" && !roomId && merged[0]) {
                    setRoomId(merged[0].roomId);
                    const url = new URL(window.location.href);
                    url.searchParams.set("mode", "viewer");
                    url.searchParams.set("roomId", merged[0].roomId);
                    window.history.replaceState({}, "", url.toString());
                }
            } catch { /* тихо */ }
        })();
    }, [mounted, mode]); // eslint-disable-line

    function pushRoomToUrl(id: string) {
        if (!mounted) return;
        const url = new URL(window.location.href);
        if (id) url.searchParams.set("roomId", id); else url.searchParams.delete("roomId");
        if (!url.searchParams.get("mode")) url.searchParams.set("mode", mode);
        window.history.replaceState({}, "", url.toString());
    }

    function destroyPeer() {
        try { peerRef.current?.destroy(); } catch { }
        peerRef.current = null;
    }

    async function ensureRoomId(): Promise<string> {
        if (roomId) return roomId;
        const id = genId();
        setRoomId(id);
        pushRoomToUrl(id);
        saveLocalRoom(id);
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
        pushRoomToUrl(id);
        saveLocalRoom(id);

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

        // сигналізація
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

        function isValidSdp(obj: any, expected: "offer" | "answer"): obj is { type: "offer" | "answer"; sdp: string } {
            return obj && obj.type === expected && typeof obj.sdp === "string";
        }

        async function pollOfferOnce(peer: any, rid: string) {
            const r = await fetch(`/api/webrtc/offer?roomId=${encodeURIComponent(rid)}`, { cache: "no-store" });
            if (!r.ok) return false;
            const doc = await r.json();
            const sdp = doc?.sdp ?? doc?.offer ?? doc?.payload ?? null;
            if (isValidSdp(sdp, "offer")) { peer.signal(sdp); return true; }
            return false;
        }
        async function pollAnswerOnce(peer: any, rid: string, hostId: string) {
            const r = await fetch(`/api/webrtc/answer?roomId=${encodeURIComponent(rid)}&to=${encodeURIComponent(hostId)}`, { cache: "no-store" });
            if (!r.ok) return false;
            const doc = await r.json();
            const sdp = doc?.sdp ?? doc?.answer ?? doc?.payload ?? null;
            if (isValidSdp(sdp, "answer")) { peer.signal(sdp); return true; }
            return false;
        }

        const offerTimer: any = { current: null };
        const answerTimer: any = { current: null };

        if (!isHost) {
            offerTimer.current = window.setInterval(async () => {
                try {
                    const got = await pollOfferOnce(peer, id);
                    if (got && offerTimer.current) { clearInterval(offerTimer.current); offerTimer.current = null; }
                } catch { }
            }, 1500);
        } else {
            answerTimer.current = window.setInterval(async () => {
                try {
                    const got = await pollAnswerOnce(peer, id, clientIdRef.current);
                    if (got && answerTimer.current) { clearInterval(answerTimer.current); answerTimer.current = null; }
                } catch { }
            }, 1500);
        }

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
            const w = el.videoWidth || 640;
            const h = el.videoHeight || 360;
            canvas.width = w; canvas.height = h;
            const ctx = canvas.getContext("2d");
            if (!ctx) throw new Error("canvas ctx error");
            ctx.drawImage(el, 0, 0, w, h);
            const dataUrl = canvas.toDataURL("image/jpeg", 0.8);
            const rid = await ensureRoomId();
            const res = await fetch("/api/vision/snapshot", {
                method: "POST",
                headers: { "content-type": "application/json" },
                body: JSON.stringify({ roomId: rid, by: clientIdRef.current, imageDataUrl: dataUrl }),
            });
            if (!res.ok) {
                const j = await res.json().catch(() => ({}));
                throw new Error(j?.error || "snapshot save failed");
            }
            saveLocalRoom(rid);
            setErr("");
        } catch (e: any) {
            setErr(e.message || "snapshot error");
        }
    }

    async function copyViewerLink() {
        try {
            if (!viewerHref) throw new Error("no link");
            await navigator.clipboard.writeText(viewerHref);
            setErr(""); // ок
        } catch (e: any) {
            setErr(e.message || "clipboard error");
        }
    }

    return (
        <div className="rounded-2xl p-4 my-6 bg-slate-900 text-slate-50 shadow vision-ui">
            <div className="flex items-center gap-2 flex-wrap">
                <span className="px-2 py-1 rounded bg-slate-700 text-xs">mode: {mode}</span>
                <span className="px-2 py-1 rounded bg-slate-700 text-xs">status: {status}</span>
                {err && <span className="px-2 py-1 rounded bg-rose-600 text-xs">ERR: {err}</span>}
                <div className="ml-auto flex gap-2">
                    <button className={`px-3 py-1 rounded ${mode === "host" ? "bg-amber-500 text-black" : "bg-slate-700"}`} onClick={() => setMode("host")}>host</button>
                    <button className={`px-3 py-1 rounded ${mode === "viewer" ? "bg-emerald-400 text-black" : "bg-slate-700"}`} onClick={() => setMode("viewer")}>viewer</button>
                </div>
            </div>

            <div className="mt-3 grid gap-3 lg:grid-cols-[1fr_360px]">
                {/* Ліва колонка */}
                <div>
                    <div className="grid gap-3 sm:grid-cols-2">
                        <div className="rounded-lg bg-slate-800 p-3">
                            <div className="text-xs text-slate-400 mb-1">roomId</div>
                            <input
                                className="w-full rounded bg-slate-900 border border-slate-600 px-2 py-1"
                                value={roomId}
                                onChange={(e) => {
                                    const v = e.target.value.trim();
                                    setRoomId(v);
                                    pushRoomToUrl(v);
                                }}
                                placeholder="auto-generated"
                            />
                            <div className="text-xs text-slate-400 mt-2">viewer link</div>
                            <div className="break-all text-xs bg-slate-900 rounded p-2 border border-slate-700" suppressHydrationWarning>
                                {mounted ? (viewerHref || "—") : "—"}
                            </div>
                            <div className="mt-2">
                                <button className="px-3 py-1 rounded bg-sky-400 text-black" onClick={copyViewerLink}>📋 Copy viewer link</button>
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

                {/* Права колонка: Recent rooms */}
                <div className="rounded-lg bg-slate-800 p-3">
                    <div className="text-sm font-semibold mb-2">🗂 Recent rooms</div>
                    {recent.length === 0 && (
                        <div className="text-xs text-slate-400">Поки немає історії. Створи кімнату або зроби фото.</div>
                    )}
                    <div className="flex flex-col gap-2 max-h-[420px] overflow-auto pr-1">
                        {recent.map((r) => (
                            <button
                                key={r.roomId}
                                className={`w-full text-left px-2 py-2 rounded border ${r.roomId === roomId ? "border-emerald-400 bg-slate-700" : "border-slate-600 bg-slate-900"
                                    } hover:bg-slate-700 transition`}
                                onClick={() => {
                                    setRoomId(r.roomId);
                                    pushRoomToUrl(r.roomId);
                                    saveLocalRoom(r.roomId);
                                }}
                                title={r.lastSeen}
                            >
                                <div className="font-mono text-xs break-all">{r.roomId}</div>
                                <div className="text-[11px] text-slate-400">{r.lastSeen}</div>
                            </button>
                        ))}
                    </div>
                    {roomId && (
                        <a
                            className="inline-block mt-3 text-xs underline text-sky-300"
                            href={`/vision/${encodeURIComponent(roomId)}/snaps`}
                            target="_blank"
                        >
                            👉 Відкрити фото цієї кімнати
                        </a>
                    )}
                </div>
            </div>
        </div>
    );
}
