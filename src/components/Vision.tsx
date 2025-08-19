"use client";

import React, { useEffect, useRef, useState } from "react";
import Peer, { SignalData } from "simple-peer";
import { getClientId } from "@/lib/clientId";

type Mode = "host" | "viewer";

type OfferPayload = { type: "offer"; sdp: any };
type AnswerPayload = { type: "answer"; sdp: any };
type IcePayload = { type: "candidate"; candidate: any };

export default function Vision({
    initialMode = "host",
    initialRoomId,
}: {
    initialMode?: Mode;
    initialRoomId?: string;
}) {
    const [mode, setMode] = useState<Mode>(initialMode);
    const [roomId, setRoomId] = useState<string>(initialRoomId || crypto.randomUUID());
    const [status, setStatus] = useState<"idle" | "connecting" | "connected" | "error">("idle");
    const [err, setErr] = useState<string>("");

    const localVideoRef = useRef<HTMLVideoElement | null>(null);
    const remoteVideoRef = useRef<HTMLVideoElement | null>(null);
    const streamRef = useRef<MediaStream | null>(null);
    const peerRef = useRef<Peer.Instance | null>(null);
    const clientIdRef = useRef<string>("");

    // poll timers
    const pollOfferRef = useRef<number | null>(null);
    const pollAnswerRef = useRef<number | null>(null);
    const pollIceRef = useRef<number | null>(null);

    useEffect(() => {
        clientIdRef.current = getClientId();
    }, []);

    function clearTimers() {
        if (pollOfferRef.current) { window.clearInterval(pollOfferRef.current); pollOfferRef.current = null; }
        if (pollAnswerRef.current) { window.clearInterval(pollAnswerRef.current); pollAnswerRef.current = null; }
        if (pollIceRef.current) { window.clearInterval(pollIceRef.current); pollIceRef.current = null; }
    }

    function destroyPeer() {
        try { peerRef.current?.destroy(); } catch { }
        peerRef.current = null;
        clearTimers();
        setStatus("idle");
    }

    async function captureAndSaveFrame() {
        try {
            const video = mode === "host" ? localVideoRef.current : remoteVideoRef.current;
            if (!video) return;
            const canvas = document.createElement("canvas");
            canvas.width = video.videoWidth || 640;
            canvas.height = video.videoHeight || 360;
            const ctx = canvas.getContext("2d");
            if (!ctx) return;
            ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
            const dataUrl = canvas.toDataURL("image/jpeg", 0.8);

            const res = await fetch("/api/vision/frame", {
                method: "POST",
                headers: { "content-type": "application/json" },
                body: JSON.stringify({
                    roomId,
                    by: mode,
                    dataUrl,
                }),
            });
            if (!res.ok) throw new Error("save frame failed");
            alert("✅ Кадр збережено у Mongo");
        } catch (e: any) {
            alert("❌ Помилка збереження кадру: " + (e.message || e));
        }
    }

    async function start() {
        destroyPeer();
        setErr("");
        setStatus("connecting");

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
        });
        peerRef.current = peer;

        // HOST додає треки
        if (isHost) {
            try {
                const media = await navigator.mediaDevices.getUserMedia({ video: true, audio: false });
                streamRef.current = media;
                if (localVideoRef.current) {
                    localVideoRef.current.srcObject = media;
                    localVideoRef.current.muted = true;
                    localVideoRef.current.playsInline = true;
                    await localVideoRef.current.play().catch(() => { });
                }
                media.getTracks().forEach((t) => peer.addTrack(t, media));
            } catch (e: any) {
                setErr(e.message || "getUserMedia failed");
                setStatus("error");
                return;
            }
        } else {
            // VIEWER слухає віддалений стрім
            peer.on("stream", async (remote: MediaStream) => {
                const el = remoteVideoRef.current;
                if (!el) return;
                el.srcObject = remote;
                el.playsInline = true;
                await el.play().catch(() => { });
            });
        }

        // Всі сигнали: offer / answer / ice → API
        peer.on("signal", async (data: SignalData) => {
            try {
                if ((data as any).type === "offer") {
                    // HOST → публікуємо offer
                    await fetch("/api/webrtc/offer", {
                        method: "POST",
                        headers: { "content-type": "application/json" },
                        body: JSON.stringify({
                            roomId,
                            offer: data as OfferPayload,
                            from: clientIdRef.current,
                        }),
                    });
                } else if ((data as any).type === "answer") {
                    // VIEWER → публікуємо answer
                    await fetch("/api/webrtc/answer", {
                        method: "POST",
                        headers: { "content-type": "application/json" },
                        body: JSON.stringify({
                            roomId,
                            answer: data as AnswerPayload,
                            from: clientIdRef.current,
                        }),
                    });
                } else if ((data as any).candidate) {
                    // ICE → складаємо в Mongo
                    const payload: IcePayload = { type: "candidate", candidate: (data as any).candidate };
                    await fetch("/api/webrtc/candidate", {
                        method: "POST",
                        headers: { "content-type": "application/json" },
                        body: JSON.stringify({
                            roomId,
                            ice: payload,
                            from: clientIdRef.current,
                        }),
                    });
                }
            } catch (e: any) {
                console.error("signal POST error", e);
                setErr(e.message || "signal error");
            }
        });

        peer.on("connect", () => setStatus("connected"));
        peer.on("error", (e) => { setErr(e.message || "peer error"); setStatus("error"); });
        peer.on("close", () => setStatus("idle"));

        // --- Пулінг сигналів ---
        if (isHost) {
            // HOST: чекає answer + ICE від viewer
            pollAnswerRef.current = window.setInterval(async () => {
                try {
                    const url = `/api/webrtc/answer?roomId=${encodeURIComponent(roomId)}&to=${encodeURIComponent(clientIdRef.current)}`;
                    const r = await fetch(url, { cache: "no-store" });
                    if (r.ok) {
                        const j = await r.json();
                        if (j?.sdp) {
                            peer.signal(j as AnswerPayload);
                        }
                    }
                } catch { }
            }, 1000) as any;

            pollIceRef.current = window.setInterval(async () => {
                try {
                    const url = `/api/webrtc/candidate?roomId=${encodeURIComponent(roomId)}&to=${encodeURIComponent(clientIdRef.current)}`;
                    const r = await fetch(url, { cache: "no-store" });
                    if (r.ok) {
                        const j = await r.json();
                        if (j?.ice?.candidate) {
                            peer.signal(j.ice as any);
                        }
                    }
                } catch { }
            }, 1000) as any;
        } else {
            // VIEWER: чекає offer + ICE від host
            pollOfferRef.current = window.setInterval(async () => {
                try {
                    const url = `/api/webrtc/offer?roomId=${encodeURIComponent(roomId)}`;
                    const r = await fetch(url, { cache: "no-store" });
                    if (r.ok) {
                        const j = await r.json();
                        if (j?.sdp) {
                            peer.signal(j as OfferPayload);
                            // Після першого успішного offer — більше не тягнемо
                            if (pollOfferRef.current) { window.clearInterval(pollOfferRef.current); pollOfferRef.current = null; }
                        }
                    }
                } catch { }
            }, 1000) as any;

            pollIceRef.current = window.setInterval(async () => {
                try {
                    const url = `/api/webrtc/candidate?roomId=${encodeURIComponent(roomId)}&to=${encodeURIComponent(clientIdRef.current)}`;
                    const r = await fetch(url, { cache: "no-store" });
                    if (r.ok) {
                        const j = await r.json();
                        if (j?.ice?.candidate) {
                            peer.signal(j.ice as any);
                        }
                    }
                } catch { }
            }, 1000) as any;
        }
    }

    useEffect(() => {
        return () => {
            clearTimers();
            destroyPeer();
            try { streamRef.current?.getTracks().forEach(t => t.stop()); } catch { }
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    return (
        <div className="rounded-2xl bg-white p-4 text-slate-900 shadow">
            <div className="flex flex-wrap items-center gap-2">
                <span className="px-2 py-1 rounded bg-slate-100 text-xs">
                    {mode}
                </span>
                <span className="px-2 py-1 rounded bg-slate-100 text-xs">
                    status: {status}
                </span>
                {err && <span className="px-2 py-1 rounded bg-rose-600 text-white text-xs">ERR: {err}</span>}

                <div className="ml-auto flex items-center gap-2">
                    <select
                        className="border rounded px-2 py-1 text-sm"
                        value={mode}
                        onChange={(e) => setMode(e.target.value as Mode)}
                    >
                        <option value="host">host</option>
                        <option value="viewer">viewer</option>
                    </select>
                    <input
                        className="border rounded px-2 py-1 text-sm w-[280px]"
                        value={roomId}
                        onChange={(e) => setRoomId(e.target.value)}
                        placeholder="room id"
                    />
                    <button
                        onClick={start}
                        className="rounded bg-slate-900 text-white text-sm px-3 py-1"
                    >
                        Підключити
                    </button>
                    <button
                        onClick={captureAndSaveFrame}
                        className="rounded bg-amber-500 text-white text-sm px-3 py-1"
                        title="Зберегти поточний кадр у Mongo"
                    >
                        Зробити фото в Mongo
                    </button>
                </div>
            </div>

            <div className="mt-3 grid gap-3 md:grid-cols-2">
                <div className="rounded-lg bg-slate-50 p-2">
                    <div className="text-xs text-slate-500 mb-1">Local (host)</div>
                    <video ref={localVideoRef} className="w-full rounded bg-black" />
                </div>
                <div className="rounded-lg bg-slate-50 p-2">
                    <div className="text-xs text-slate-500 mb-1">Remote (viewer sees)</div>
                    <video ref={remoteVideoRef} className="w-full rounded bg-black" />
                </div>
            </div>
        </div>
    );
}
