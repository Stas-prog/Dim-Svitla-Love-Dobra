"use client";

import { useEffect, useRef, useState } from "react";

const ICE = { iceServers: [{ urls: "stun:stun.l.google.com:19302" }] };

export default function HostPage() {
    const params = new URLSearchParams(typeof window !== "undefined" ? window.location.search : "");
    const roomId = params.get("room") || "";

    const [status, setStatus] = useState<"idle" | "ready" | "offered" | "answer-wait" | "connected" | "error">("idle");
    const [err, setErr] = useState<string | null>(null);
    const [muted, setMuted] = useState(true);
    const [facing, setFacing] = useState<"user" | "environment">("user");

    const pcRef = useRef<RTCPeerConnection | null>(null);
    const localVideoRef = useRef<HTMLVideoElement | null>(null);
    const localStreamRef = useRef<MediaStream | null>(null);
    const addedRemoteCandidates = useRef<Set<string>>(new Set());

    async function startCamera() {
        try {
            setErr(null);
            if (!roomId) {
                setErr("room parameter missing");
                return;
            }

            // створити кімнату в БД (upsert)
            await fetch("/api/webrtc/room", {
                method: "POST",
                headers: { "content-type": "application/json" },
                body: JSON.stringify({ roomId }),
            });

            const stream = await navigator.mediaDevices.getUserMedia({
                video: { facingMode: facing, width: { ideal: 1280 }, height: { ideal: 720 } },
                audio: true,
            });
            localStreamRef.current = stream;

            if (localVideoRef.current) {
                localVideoRef.current.srcObject = stream;
                localVideoRef.current.muted = true;
                await localVideoRef.current.play().catch(() => { });
            }

            const pc = new RTCPeerConnection(ICE);
            pcRef.current = pc;

            stream.getTracks().forEach((t) => pc.addTrack(t, stream));

            pc.onicecandidate = async (ev) => {
                if (ev.candidate) {
                    await fetch("/api/webrtc/candidate", {
                        method: "POST",
                        headers: { "content-type": "application/json" },
                        body: JSON.stringify({ roomId, from: "host", candidate: ev.candidate }),
                    }).catch(console.error);
                }
            };

            pc.onconnectionstatechange = () => {
                if (pc.connectionState === "connected") setStatus("connected");
            };

            setStatus("ready");
        } catch (e: any) {
            setErr(e?.message || "camera error");
            setStatus("error");
        }
    }

    async function createOffer() {
        try {
            const pc = pcRef.current!;
            const offer = await pc.createOffer({ offerToReceiveAudio: true, offerToReceiveVideo: true });
            await pc.setLocalDescription(offer);

            await fetch("/api/webrtc/offer", {
                method: "POST",
                headers: { "content-type": "application/json" },
                body: JSON.stringify({ roomId, offer }),
            });

            setStatus("offered");
            pollAnswer();
            pollViewerCandidates();
        } catch (e: any) {
            setErr(e?.message || "offer error");
            setStatus("error");
        }
    }

    async function pollAnswer() {
        const pc = pcRef.current!;
        const timer = setInterval(async () => {
            if (!pc) return;
            try {
                const r = await fetch(`/api/webrtc/answer?roomId=${encodeURIComponent(roomId)}`, { cache: "no-store" });
                const { answer } = await r.json();
                if (answer && !pc.currentRemoteDescription) {
                    await pc.setRemoteDescription(answer);
                    setStatus("answer-wait");
                    clearInterval(timer);
                }
            } catch { }
        }, 1500);
    }

    async function pollViewerCandidates() {
        const timer = setInterval(async () => {
            try {
                const r = await fetch(`/api/webrtc/candidate?roomId=${encodeURIComponent(roomId)}`, { cache: "no-store" });
                const data = await r.json();
                const arr: any[] = Array.isArray(data?.viewerCandidates) ? data.viewerCandidates : [];
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
        return () => {
            pcRef.current?.close();
            localStreamRef.current?.getTracks().forEach(t => t.stop());
        };
    }, []);

    return (
        <main className="min-h-screen bg-black text-white p-6">
            <h1 className="text-2xl font-bold mb-2">🎥 Host — Транслятор</h1>
            <p className="text-gray-400 mb-4">Код кімнати: <span className="font-mono bg-gray-800 px-2 py-1 rounded">{roomId || "—"}</span></p>

            <div className="flex flex-col sm:flex-row gap-4">
                <video ref={localVideoRef} className="w-full sm:w-[480px] rounded bg-gray-900" playsInline />

                <div className="flex-1 bg-gray-900/80 border border-gray-800 rounded p-4">
                    <div className="flex gap-2 mb-3">
                        <button
                            onClick={startCamera}
                            className="rounded bg-emerald-600 hover:bg-emerald-500 px-3 py-1 text-sm"
                        >
                            ▶️ Start camera
                        </button>
                        <button
                            onClick={() => setMuted(m => {
                                const v = localVideoRef.current; if (v) v.muted = !m; return !m;
                            })}
                            className="rounded bg-gray-700 hover:bg-gray-600 px-3 py-1 text-sm"
                        >
                            {muted ? "🔇 Muted" : "🔊 Unmuted"}
                        </button>
                        <button
                            onClick={() => setFacing(f => f === "user" ? "environment" : "user")}
                            className="rounded bg-gray-700 hover:bg-gray-600 px-3 py-1 text-sm"
                            title="Перемкнути камеру (перезапусти Start camera)"
                        >
                            🔄 Switch camera
                        </button>
                    </div>

                    <div className="flex gap-2">
                        <button
                            onClick={createOffer}
                            className="rounded bg-indigo-600 hover:bg-indigo-500 px-3 py-1 text-sm disabled:opacity-50"
                            disabled={status === "offered" || status === "connected" || status === "answer-wait"}
                            title="Після Start camera"
                        >
                            🛰 Створити Offer
                        </button>
                    </div>

                    <div className="mt-4 text-sm text-gray-300">
                        <div>Статус: <span className="font-mono">{status}</span></div>
                        {err && <div className="text-rose-400 mt-1">ERR: {err}</div>}
                        <div className="mt-2 text-xs text-gray-400">
                            Після Offer передай глядачу лінк: <br />
                            <code className="bg-gray-800 px-2 py-1 rounded inline-block mt-1 break-all">
                                {typeof window !== "undefined" ? `${window.location.origin}/camera/view?room=${roomId}` : "/camera/view?room=..."}
                            </code>
                        </div>
                    </div>
                </div>
            </div>
        </main>
    );
}
