"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
// Якщо поставив @types/simple-peer:
import Peer, { type Instance as PeerInstance, type SignalData } from "simple-peer";
// Якщо використав локальну заглушку, рядок вище теж працюватиме.
import { getClientId } from "@/lib/clientId";

type Mode = "host" | "viewer";

function makeRoomId() {
    if (typeof crypto !== "undefined" && "randomUUID" in crypto) return crypto.randomUUID();
    return String(Date.now()) + Math.random().toString(16).slice(2);
}

export default function Vision() {
    const search = typeof window !== "undefined" ? new URLSearchParams(window.location.search) : null;
    const hasRoomParam = search?.get("room");
    const mode: Mode = hasRoomParam ? "viewer" : "host";

    const [room, setRoom] = useState<string>(() => hasRoomParam || makeRoomId());
    const [since, setSince] = useState<string>("");
    const [status, setStatus] = useState<string>("idle");
    const [err, setErr] = useState<string | null>(null);

    const [camOn, setCamOn] = useState(false);
    const localVideoRef = useRef<HTMLVideoElement | null>(null);
    const remoteVideoRef = useRef<HTMLVideoElement | null>(null);
    const peerRef = useRef<PeerInstance | null>(null);
    const streamRef = useRef<MediaStream | null>(null);
    const clientId = useMemo(() => getClientId(), []);

    async function startCamera() {
        try {
            setErr(null);

            if (!navigator.mediaDevices?.getUserMedia) {
                throw new Error("MediaDevices API недоступний у цьому браузері");
            }

            const media = await navigator.mediaDevices.getUserMedia({
                video: { facingMode: "user" },
                audio: false,
            });
            streamRef.current = media;

            if (localVideoRef.current) {
                localVideoRef.current.srcObject = media;
                await localVideoRef.current.play().catch(() => { });
            }
            setCamOn(true);

            const p: PeerInstance = new Peer({
                initiator: mode === "host",
                trickle: true,
                stream: media,
            }) as unknown as PeerInstance;

            p.on("signal", async (data: SignalData) => {
                try {
                    await fetch("/api/webrtc/signal", {
                        method: "POST",
                        headers: { "content-type": "application/json" },
                        body: JSON.stringify({ room, senderId: clientId, data }),
                    });
                    setStatus("signaling");
                } catch (e) {
                    setErr((e as Error).message);
                }
            });

            p.on("stream", (remote: MediaStream) => {
                if (remoteVideoRef.current) {
                    remoteVideoRef.current.srcObject = remote;
                    remoteVideoRef.current.play().catch(() => { });
                }
            });

            p.on("connect", () => {
                setStatus("connected");
            });

            p.on("error", (e: Error) => {
                setErr(e.message);
            });

            p.on("close", () => {
                setStatus("closed");
            });

            peerRef.current = p;
            setStatus(mode === "host" ? "waiting-viewer" : "connecting");
        } catch (e) {
            setErr((e as Error).message);
        }
    }

    // Поллінг сигналів із БД (кожні 900мс)
    useEffect(() => {
        let stop = false;

        async function pull() {
            if (!room || !peerRef.current) return;
            try {
                const url = `/api/webrtc/signal?room=${encodeURIComponent(room)}${since ? `&since=${encodeURIComponent(since)}` : ""}`;
                const r = await fetch(url, { cache: "no-store" });
                const json = await r.json();

                if (json?.ok && Array.isArray(json.items) && json.items.length) {
                    const lastTs = json.items[json.items.length - 1].ts as string;
                    setSince(lastTs);

                    json.items.forEach((m: any) => {
                        if (m.senderId === clientId) return;
                        try {
                            peerRef.current!.signal(m.data as SignalData);
                        } catch {
                            /* no-op */
                        }
                    });
                }
            } catch (e) {
                console.warn("webrtc pull error:", (e as Error).message);
            }
        }

        const id = window.setInterval(pull, 900);
        return () => {
            stop = true;
            clearInterval(id);
        };
    }, [room, since, clientId]);

    function stopAll() {
        if (peerRef.current) {
            try { peerRef.current.destroy(); } catch { }
            peerRef.current = null;
        }
        if (streamRef.current) {
            streamRef.current.getTracks().forEach(t => t.stop());
            streamRef.current = null;
        }
        setCamOn(false);
        setStatus("idle");
        setSince("");
        if (remoteVideoRef.current) remoteVideoRef.current.srcObject = null;
        if (localVideoRef.current) localVideoRef.current.srcObject = null;
    }

    const viewerLink = typeof window !== "undefined"
        ? `${window.location.origin}/vision?room=${encodeURIComponent(room)}`
        : `/vision?room=${encodeURIComponent(room)}`;

    return (
        <div className="rounded-2xl bg-white/70 backdrop-blur p-4 my-4 shadow-soft text-slate-900">
            <div className="flex items-center gap-2 mb-2">
                <span className="px-2 py-1 rounded bg-slate-900 text-white text-xs">WebRTC</span>
                <span className="px-2 py-1 rounded bg-slate-200 text-xs">{mode.toUpperCase()}</span>
                <span className="px-2 py-1 rounded bg-slate-100 text-xs">Status: {status}</span>
                {err && <span className="px-2 py-1 rounded bg-rose-600/90 text-white text-xs">ERR: {err}</span>}
            </div>

            <div className="mb-3">
                <div className="text-sm">Room:</div>
                <div className="font-mono text-sm break-all bg-white/80 rounded p-2">{room}</div>
                {mode === "host" && (
                    <div className="mt-1 text-xs">
                        Посилання для перегляду:&nbsp;
                        <a className="text-blue-600 underline break-all" href={viewerLink} target="_blank">
                            {viewerLink}
                        </a>
                    </div>
                )}
            </div>

            <div className="grid sm:grid-cols-2 gap-4">
                <div>
                    <div className="text-xs mb-1">Твоя камера</div>
                    <video ref={localVideoRef} playsInline muted className="w-full rounded-lg bg-black/60 aspect-video" />
                </div>
                <div>
                    <div className="text-xs mb-1">Віддалений потік</div>
                    <video ref={remoteVideoRef} playsInline className="w-full rounded-lg bg-black/60 aspect-video" />
                </div>
            </div>

            <div className="mt-4 flex gap-2">
                {!camOn ? (
                    <button
                        onClick={startCamera}
                        className="px-3 py-2 rounded-lg bg-emerald-600 text-white hover:bg-emerald-700 text-sm"
                    >
                        {mode === "host" ? "🎥 Start Sharing Camera" : "👁 Join Viewer"}
                    </button>
                ) : (
                    <button
                        onClick={stopAll}
                        className="px-3 py-2 rounded-lg bg-rose-600 text-white hover:bg-rose-700 text-sm"
                    >
                        ⏹ Stop
                    </button>
                )}
            </div>

            <div className="mt-3 text-xs text-slate-600">
                Порада для iOS (Safari): якщо відео не стартує, відкрий сторінку, натисни кнопку «Start», і Safari запитає дозвіл на камеру.
            </div>
        </div>
    );
}
