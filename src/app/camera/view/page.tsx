"use client";

import { useEffect, useRef, useState } from "react";

const ICE = { iceServers: [{ urls: "stun:stun.l.google.com:19302" }] };

export default function ViewerPage() {
    const params = new URLSearchParams(typeof window !== "undefined" ? window.location.search : "");
    const roomId = params.get("room") || "";

    const [status, setStatus] = useState<"idle" | "waiting-offer" | "answered" | "connected" | "error">("waiting-offer");
    const [err, setErr] = useState<string | null>(null);
    const [muted, setMuted] = useState(false);

    const pcRef = useRef<RTCPeerConnection | null>(null);
    const remoteVideoRef = useRef<HTMLVideoElement | null>(null);
    const addedRemoteCandidates = useRef<Set<string>>(new Set());

    async function begin() {
        try {
            setErr(null);
            if (!roomId) { setErr("room parameter missing"); setStatus("error"); return; }

            const pc = new RTCPeerConnection(ICE);
            pcRef.current = pc;

            pc.ontrack = (ev) => {
                const [stream] = ev.streams;
                if (remoteVideoRef.current && stream) {
                    remoteVideoRef.current.srcObject = stream;
                    remoteVideoRef.current.autoplay = true;
                    remoteVideoRef.current.playsInline = true;
                }
            };

            pc.onicecandidate = async (ev) => {
                if (ev.candidate) {
                    await fetch("/api/webrtc/candidate", {
                        method: "POST",
                        headers: { "content-type": "application/json" },
                        body: JSON.stringify({ roomId, from: "viewer", candidate: ev.candidate }),
                    }).catch(console.error);
                }
            };

            // забираємо Offer
            const ro = await fetch(`/api/webrtc/offer?roomId=${encodeURIComponent(roomId)}`, { cache: "no-store" });
            const { offer } = await ro.json();
            if (!offer) { setStatus("waiting-offer"); return; }

            await pc.setRemoteDescription(offer);
            const answer = await pc.createAnswer();
            await pc.setLocalDescription(answer);

            // надсилаємо Answer
            await fetch("/api/webrtc/answer", {
                method: "POST",
                headers: { "content-type": "application/json" },
                body: JSON.stringify({ roomId, answer }),
            });

            setStatus("answered");
            pollHostCandidates();

            pc.onconnectionstatechange = () => {
                if (pc.connectionState === "connected") setStatus("connected");
            };
        } catch (e: any) {
            setErr(e?.message || "viewer error");
            setStatus("error");
        }
    }

    async function pollHostCandidates() {
        const timer = setInterval(async () => {
            try {
                const r = await fetch(`/api/webrtc/candidate?roomId=${encodeURIComponent(roomId)}`, { cache: "no-store" });
                const data = await r.json();
                const arr: any[] = Array.isArray(data?.hostCandidates) ? data.hostCandidates : [];
                const pc = pcRef.current;
                if (!pc) return;

                for (const c of arr) {
                    const key = `${c.sdpMid}|${c.sdpMLineIndex}|${c.candidate}`;
                    if (!addedRemoteCandidates.current.has(key)) {
                        addedRemoteCandidates.current.add(key);
                        await pc.addIceCandidate(c).catch(() => { });
                    }
                }
            } catch { }
        }, 1500);
    }

    useEffect(() => {
        // авто-старт при відкритті
        begin();
        return () => pcRef.current?.close();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    return (
        <main className="min-h-screen bg-black text-white p-6">
            <h1 className="text-2xl font-bold mb-2">👀 Viewer — Глядач</h1>
            <p className="text-gray-400 mb-4">Код кімнати: <span className="font-mono bg-gray-800 px-2 py-1 rounded">{roomId || "—"}</span></p>

            <div className="flex flex-col sm:flex-row gap-4">
                <video
                    ref={remoteVideoRef}
                    className="w-full sm:w-[640px] rounded bg-gray-900"
                    playsInline
                    controls={false}
                    muted={muted}
                    onClick={() => {
                        // iOS Safari може вимагати жесту для звуку
                        setMuted(m => !m);
                        const v = remoteVideoRef.current; v?.play().catch(() => { });
                    }}
                />

                <div className="flex-1 bg-gray-900/80 border border-gray-800 rounded p-4">
                    <div className="flex gap-2 mb-3">
                        <button
                            onClick={() => {
                                setMuted(m => !m);
                                const v = remoteVideoRef.current; if (v) v.muted = !muted;
                            }}
                            className="rounded bg-gray-700 hover:bg-gray-600 px-3 py-1 text-sm"
                        >
                            {muted ? "🔇 Звук вимкнено" : "🔊 Звук увімкнено"}
                        </button>
                    </div>

                    <div className="text-sm text-gray-300">
                        <div>Статус: <span className="font-mono">{status}</span></div>
                        {err && <div className="text-rose-400 mt-1">ERR: {err}</div>}
                        <div className="mt-2 text-xs text-gray-400">
                            Якщо відео без звуку — торкнись плеєра (iOS/Chrome блокує автозвук без жесту).
                        </div>
                    </div>
                </div>
            </div>
        </main>
    );
}
