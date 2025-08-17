"use client";

import React, { useEffect, useRef, useState } from "react";
import SimplePeer from "simple-peer";
import { getClientId } from "@/lib/clientId";

type SignalPayload = {
    sdp?: any;
    type?: "offer" | "answer";
};

const WS_URL = process.env.NEXT_PUBLIC_SIGNAL_WS ?? ""; // якщо є сигнальний WS (не обов’язково)
const DEFAULT_ROOM = "home-vision";

export default function Vision() {
    const [roomId, setRoomId] = useState<string>(() => {
        if (typeof window === "undefined") return DEFAULT_ROOM;
        const url = new URL(window.location.href);
        return url.searchParams.get("room") || DEFAULT_ROOM;
    });

    const [isHost, setIsHost] = useState<boolean>(() => {
        if (typeof window === "undefined") return true;
        const url = new URL(window.location.href);
        // ?host=1 → цей клієнт створює offer
        return url.searchParams.get("host") === "1";
    });

    const [status, setStatus] = useState<string>("idle");
    const [error, setError] = useState<string | null>(null);

    const localVideoRef = useRef<HTMLVideoElement | null>(null);
    const remoteVideoRef = useRef<HTMLVideoElement | null>(null);
    const canvasRef = useRef<HTMLCanvasElement | null>(null);

    const peerRef = useRef<SimplePeer.Instance | null>(null);
    const localStreamRef = useRef<MediaStream | null>(null);

    const clientId = useRef<string>("");

    useEffect(() => {
        clientId.current = getClientId();
    }, []);

    async function startLocalCamera() {
        setError(null);
        setStatus("requesting camera…");
        try {
            const stream = await navigator.mediaDevices.getUserMedia({
                video: { facingMode: "environment" },
                audio: false,
            });
            localStreamRef.current = stream;
            if (localVideoRef.current) {
                localVideoRef.current.srcObject = stream;
                await localVideoRef.current.play().catch(() => { });
            }
            setStatus("camera ready");
        } catch (e) {
            setError((e as Error).message);
            setStatus("camera error");
        }
    }

    async function startPeer() {
        setError(null);
        setStatus("starting peer…");

        // 1) створюємо SimplePeer
        const peer = new SimplePeer({
            initiator: isHost,
            trickle: true,
            streams: localStreamRef.current ? [localStreamRef.current] : undefined,
        });

        // 2) локальні сигнали в БД
        peer.on("signal", async (data) => {
            try {
                const res = await fetch(`/api/webrtc/${isHost ? "offer" : "answer"}`, {
                    method: "POST",
                    headers: { "content-type": "application/json" },
                    body: JSON.stringify({
                        roomId,
                        clientId: clientId.current,
                        signal: data,
                    }),
                });
                if (!res.ok) throw new Error("Failed to POST local signal");
            } catch (e) {
                setError((e as Error).message);
            }
        });

        // 3) отримали віддалений стрім — показуємо
        peer.on("stream", (remote) => {
            if (remoteVideoRef.current) {
                remoteVideoRef.current.srcObject = remote;
                remoteVideoRef.current
                    .play()
                    .then(() => setStatus("streaming"))
                    .catch(() => setStatus("stream ready (paused)"));
            }
        });

        peer.on("connect", () => setStatus("connected"));
        peer.on("close", () => setStatus("closed"));
        peer.on("error", (err) => {
            setError(err.message);
            setStatus("peer error");
        });

        peerRef.current = peer;

        // 4) періодично тягнемо віддалений сигнал з БД та кандидати
        let stop = false;
        async function pump() {
            try {
                const url = isHost
                    ? `/api/webrtc/answer?room=${encodeURIComponent(roomId)}`
                    : `/api/webrtc/offer?room=${encodeURIComponent(roomId)}`;
                const r = await fetch(url, { cache: "no-store" });
                const js = await r.json();
                if (js?.signal) {
                    // відповіді/офери може бути багато — пробуємо передати в peer
                    peer.signal(js.signal);
                }

                // ICE-кандидати
                const cr = await fetch(
                    `/api/webrtc/candidate?room=${encodeURIComponent(roomId)}&role=${isHost ? "answer" : "offer"}`,
                    { cache: "no-store" }
                );
                const cj = await cr.json();
                if (Array.isArray(cj?.candidates)) {
                    cj.candidates.forEach((c: any) => {
                        try {
                            peer.signal({ type: "candidate", candidate: c });
                        } catch { }
                    });
                }
            } catch (e) {
                // тихо
            }
            if (!stop) setTimeout(pump, 1500);
        }
        pump();

        // 5) слухаємо локальні кандидати і теж пишемо в БД
        peer.on("signal", async (data) => {
            if ((data as any)?.candidate) {
                try {
                    await fetch(`/api/webrtc/candidate`, {
                        method: "POST",
                        headers: { "content-type": "application/json" },
                        body: JSON.stringify({
                            roomId,
                            role: isHost ? "offer" : "answer",
                            candidate: (data as any).candidate,
                        }),
                    });
                } catch { }
            }
        });

        return () => {
            stop = true;
        };
    }

    function stopAll() {
        try {
            peerRef.current?.destroy();
        } catch { }
        peerRef.current = null;
        if (localStreamRef.current) {
            localStreamRef.current.getTracks().forEach((t) => t.stop());
            localStreamRef.current = null;
        }
        if (localVideoRef.current) localVideoRef.current.srcObject = null;
        if (remoteVideoRef.current) remoteVideoRef.current.srcObject = null;
        setStatus("stopped");
    }

    // 📸 SNAPSHOT → canvas → dataURL → POST /api/snapshots
    async function takeSnapshotAndSave() {
        try {
            const video =
                (remoteVideoRef.current?.srcObject ? remoteVideoRef.current : null) ||
                (localVideoRef.current?.srcObject ? localVideoRef.current : null);

            if (!video) {
                setError("Немає активного відео для знімка");
                return;
            }

            const w = (video as HTMLVideoElement).videoWidth || 1280;
            const h = (video as HTMLVideoElement).videoHeight || 720;

            const canvas = canvasRef.current || document.createElement("canvas");
            canvasRef.current = canvas;
            canvas.width = w;
            canvas.height = h;

            const ctx = canvas.getContext("2d");
            if (!ctx) {
                setError("Canvas 2D недоступний");
                return;
            }
            ctx.drawImage(video as CanvasImageSource, 0, 0, w, h);

            const dataUrl = canvas.toDataURL("image/jpeg", 0.92); // ~JPEG
            const res = await fetch("/api/snapshots", {
                method: "POST",
                headers: { "content-type": "application/json" },
                body: JSON.stringify({
                    roomId,
                    clientId: clientId.current,
                    dataUrl,
                }),
            });

            const js = await res.json();
            if (!res.ok || !js?.ok) throw new Error(js?.error || "Save failed");
            setStatus(`snapshot saved: ${js.id}`);
        } catch (e) {
            setError((e as Error).message);
        }
    }

    return (
        <div className="rounded-2xl bg-white/80 p-4 text-slate-900">
            <div className="flex flex-wrap items-center gap-2">
                <span className="px-2 py-1 rounded bg-slate-900 text-white text-xs">Vision</span>
                <span className="px-2 py-1 rounded bg-slate-100 text-xs">room: {roomId}</span>
                <span className="px-2 py-1 rounded bg-slate-100 text-xs">{isHost ? "host" : "viewer"}</span>
                <span className="ml-auto px-2 py-1 rounded bg-slate-200 text-xs">status: {status}</span>
                {error && <span className="px-2 py-1 rounded bg-rose-600 text-white text-xs">ERR: {error}</span>}
            </div>

            <div className="mt-3 flex flex-wrap gap-3">
                <button
                    onClick={startLocalCamera}
                    className="rounded bg-emerald-600 text-white px-3 py-1 text-sm"
                >
                    🎥 Start camera
                </button>
                <button
                    onClick={startPeer}
                    className="rounded bg-blue-600 text-white px-3 py-1 text-sm"
                >
                    🔌 Start WebRTC ({isHost ? "host" : "viewer"})
                </button>
                <button
                    onClick={takeSnapshotAndSave}
                    className="rounded bg-amber-600 text-white px-3 py-1 text-sm"
                >
                    📸 Зробити кадр (і зберегти в Mongo)
                </button>
                <button onClick={stopAll} className="rounded bg-slate-700 text-white px-3 py-1 text-sm">
                    ⏹ Stop
                </button>
            </div>

            <div className="mt-4 grid gap-4 sm:grid-cols-2">
                <div>
                    <div className="text-xs text-slate-600 mb-1">Local</div>
                    <video
                        ref={localVideoRef}
                        playsInline
                        muted
                        className="w-full rounded-lg bg-black aspect-video"
                    />
                </div>
                <div>
                    <div className="text-xs text-slate-600 mb-1">Remote</div>
                    <video
                        ref={remoteVideoRef}
                        playsInline
                        className="w-full rounded-lg bg-black aspect-video"
                    />
                </div>
            </div>

            {/* прихований canvas для snapshot */}
            <canvas ref={canvasRef} className="hidden" />
        </div>
    );
}
