"use client";

import React, { useEffect, useRef, useState } from "react";
import SimplePeer, { SignalData } from "simple-peer";
import { getClientId } from "@/lib/clientId";

type Mode = "host" | "viewer";

type OfferPayload = { type: "offer"; sdp: any };
type AnswerPayload = { type: "answer"; sdp: any };
type IcePayload = { type: "candidate"; candidate: RTCIceCandidateInit };

type Props = {
    initialMode?: Mode;
    initialRoomId?: string;
};

function sleep(ms: number) {
    return new Promise((r) => setTimeout(r, ms));
}

export default function Vision({ initialMode, initialRoomId }: Props) {
    // ---------- UI / state ----------
    const [mode, setMode] = useState<Mode>(initialMode ?? "host");
    const [roomId, setRoomId] = useState<string>(initialRoomId ?? crypto.randomUUID());
    const [status, setStatus] = useState<"idle" | "connecting" | "connected" | "error">("idle");
    const [err, setErr] = useState<string | null>(null);

    // ---------- Refs ----------
    const clientIdRef = useRef<string>("");
    const peerRef = useRef<SimplePeer.Instance | null>(null);
    const streamRef = useRef<MediaStream | null>(null);

    const localVideoRef = useRef<HTMLVideoElement | null>(null);
    const remoteVideoRef = useRef<HTMLVideoElement | null>(null);

    const pollAnswerTimer = useRef<number | null>(null);
    const pollOfferTimer = useRef<number | null>(null);
    const pollIceTimer = useRef<number | null>(null);

    // ---------- consts ----------
    const POLL_ANSWER_MS = 1500;
    const POLL_OFFER_MS = 1500;
    const POLL_ICE_MS = 800;

    // ---------- helpers ----------
    function clearTimers() {
        if (pollAnswerTimer.current) { window.clearInterval(pollAnswerTimer.current); pollAnswerTimer.current = null; }
        if (pollOfferTimer.current) { window.clearInterval(pollOfferTimer.current); pollOfferTimer.current = null; }
        if (pollIceTimer.current) { window.clearInterval(pollIceTimer.current); pollIceTimer.current = null; }
    }

    function destroyPeer() {
        try { peerRef.current?.destroy(); } catch { }
        peerRef.current = null;
    }

    function stopLocalStream() {
        streamRef.current?.getTracks()?.forEach(t => { try { t.stop(); } catch { } });
        streamRef.current = null;
        if (localVideoRef.current) localVideoRef.current.srcObject = null;
    }

    function resetState(soft = false) {
        clearTimers();
        destroyPeer();
        if (!soft) stopLocalStream();
        setStatus("idle");
        setErr(null);
    }

    async function postJSON(url: string, body: any) {
        const r = await fetch(url, {
            method: "POST",
            headers: { "content-type": "application/json" },
            body: JSON.stringify(body),
        });
        if (!r.ok) throw new Error(`${url} ${r.status}`);
        return r.json();
    }

    async function getJSON(url: string) {
        const r = await fetch(url, { cache: "no-store" });
        if (!r.ok) throw new Error(`${url} ${r.status}`);
        return r.json();
    }

    // ---------- mount ----------
    useEffect(() => {
        clientIdRef.current = getClientId();
        return () => resetState();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    // ---------- connect ----------
    const connect = async () => {
        try {
            resetState(true);
            setStatus("connecting");
            setErr(null);

            if (mode === "host") {
                // 1) Спершу забираємо камеру
                const media = await navigator.mediaDevices.getUserMedia({ video: true, audio: false });
                streamRef.current = media;
                if (localVideoRef.current) {
                    localVideoRef.current.srcObject = media;
                    // автоплей (може бути заблоковано політиками браузера — ок)
                    localVideoRef.current.play().catch(() => { });
                }

                // 2) Створюємо peer ІЗ stream в конструкторі — без addTrack
                const peer = new SimplePeer({
                    initiator: true,
                    trickle: true,
                    stream: media,
                });
                peerRef.current = peer;

                // 3) Вивід помилок/статусу
                peer.on("connect", () => setStatus("connected"));
                peer.on("error", (e) => { setErr(e.message); setStatus("error"); });
                peer.on("close", () => setStatus("idle"));

                // 4) Власні сигнали (offer/ice)
                peer.on("signal", async (data: SignalData) => {
                    try {
                        if ((data as any).type === "offer") {
                            await postJSON("/api/webrtc/offer", {
                                roomId, offer: { type: "offer", sdp: (data as any).sdp } as OfferPayload,
                                from: clientIdRef.current,
                            });
                        } else if ((data as any).candidate) {
                            const candidate = (data as any).candidate as RTCIceCandidateInit;
                            await postJSON("/api/webrtc/candidate", {
                                roomId, ice: { type: "candidate", candidate } as IcePayload,
                                from: clientIdRef.current,
                            });
                        }
                    } catch (e: any) {
                        setErr(e.message || "signal post failed");
                    }
                });

                // 5) Poll відповіді
                pollAnswerTimer.current = window.setInterval(async () => {
                    try {
                        const ans = await getJSON(`/api/webrtc/answer?roomId=${roomId}&to=${clientIdRef.current}`);
                        if (ans?.sdp && peerRef.current && !peerRef.current.destroyed) {
                            peerRef.current.signal({ type: "answer", sdp: ans.sdp });
                        }
                    } catch { }
                }, POLL_ANSWER_MS) as unknown as number;

                // 6) Poll чужих ICE
                pollIceTimer.current = window.setInterval(async () => {
                    try {
                        const list = await getJSON(`/api/webrtc/candidate?roomId=${roomId}&to=${clientIdRef.current}`);
                        if (Array.isArray(list) && peerRef.current && !peerRef.current.destroyed) {
                            for (const it of list) {
                                if (it?.candidate) peerRef.current.signal({ type: "candidate", candidate: it.candidate } as any);
                            }
                        }
                    } catch { }
                }, POLL_ICE_MS) as unknown as number;

            } else {
                // viewer
                const peer = new SimplePeer({ initiator: false, trickle: true });
                peerRef.current = peer;

                peer.on("connect", () => setStatus("connected"));
                peer.on("error", (e) => { setErr(e.message); setStatus("error"); });
                peer.on("close", () => setStatus("idle"));

                // показ віддаленого відео
                // simple-peer генерує і 'stream', і 'track'; використаємо 'stream' для сумісності
                peer.on("stream", (remote: MediaStream) => {
                    const el = remoteVideoRef.current;
                    if (!el) return;
                    el.srcObject = remote;
                    el.play().catch(() => { });
                });

                // надсилаємо свої сигнали (answer/ice)
                peer.on("signal", async (data: SignalData) => {
                    try {
                        if ((data as any).type === "answer") {
                            await postJSON("/api/webrtc/answer", {
                                roomId, answer: { type: "answer", sdp: (data as any).sdp } as AnswerPayload,
                                from: clientIdRef.current,
                            });
                        } else if ((data as any).candidate) {
                            const candidate = (data as any).candidate as RTCIceCandidateInit;
                            await postJSON("/api/webrtc/candidate", {
                                roomId, ice: { type: "candidate", candidate } as IcePayload,
                                from: clientIdRef.current,
                            });
                        }
                    } catch (e: any) {
                        setErr(e.message || "signal post failed");
                    }
                });

                // Poll offer (поки не отримаємо валідний sdp)
                pollOfferTimer.current = window.setInterval(async () => {
                    try {
                        const off = await getJSON(`/api/webrtc/offer?roomId=${roomId}`);
                        if (off?.sdp && peerRef.current && !peerRef.current.destroyed) {
                            peerRef.current.signal({ type: "offer", sdp: off.sdp });
                        }
                    } catch { }
                }, POLL_OFFER_MS) as unknown as number;

                // Poll чужих ICE
                pollIceTimer.current = window.setInterval(async () => {
                    try {
                        const list = await getJSON(`/api/webrtc/candidate?roomId=${roomId}&to=${clientIdRef.current}`);
                        if (Array.isArray(list) && peerRef.current && !peerRef.current.destroyed) {
                            for (const it of list) {
                                if (it?.candidate) peerRef.current.signal({ type: "candidate", candidate: it.candidate } as any);
                            }
                        }
                    } catch { }
                }, POLL_ICE_MS) as unknown as number;
            }
        } catch (e: any) {
            setErr(e.message || "connect failed");
            setStatus("error");
        }
    };

    const disconnect = () => {
        resetState();
    };

    // ---------- snapshot ----------
    const shoot = async () => {
        try {
            const el = mode === "host" ? localVideoRef.current : remoteVideoRef.current;
            if (!el) throw new Error("не знайдено відео-елемент");
            const ms = el.srcObject as MediaStream | null;
            if (!ms || ms.getVideoTracks().length === 0) throw new Error("відео-потік відсутній");

            const track = ms.getVideoTracks()[0];
            const settings = track.getSettings();
            const w = Math.max(320, settings.width || 640);
            const h = Math.max(240, settings.height || 360);

            const canvas = document.createElement("canvas");
            canvas.width = w;
            canvas.height = h;
            const ctx = canvas.getContext("2d");
            if (!ctx) throw new Error("canvas ctx");
            ctx.drawImage(el, 0, 0, w, h);
            const dataUrl = canvas.toDataURL("image/jpeg", 0.8);

            // на API збереження кадру (твій існуючий ендпойнт)
            const r = await fetch("/api/vision/capture", {
                method: "POST",
                headers: { "content-type": "application/json" },
                body: JSON.stringify({ roomId, dataUrl, source: mode }),
            });
            if (!r.ok) throw new Error("/api/vision/capture failed");

            alert("📸 Кадр збережено!");
        } catch (e: any) {
            setErr(e.message || "snapshot failed");
        }
    };

    // ---------- UI (контраст + простота) ----------
    const canShoot =
        (mode === "host" && !!(localVideoRef.current?.srcObject)) ||
        (mode === "viewer" && !!(remoteVideoRef.current?.srcObject));

    return (
        <div className="min-h-screen bg-slate-900 text-white">
            <div className="mx-auto max-w-5xl px-4 py-6">
                <h1 className="text-2xl font-bold">👁️ Зір Світлозіра</h1>
                <p className="text-slate-300 mt-1">Прямий міст WebRTC: {mode === "host" ? "Хост" : "Глядач"}</p>

                {/* Панель керування */}
                <div className="mt-4 grid gap-3 sm:grid-cols-2">
                    <div className="rounded-2xl bg-slate-800/70 p-4 border border-slate-700">
                        <div className="text-sm text-slate-300 mb-2">Режим</div>
                        <div className="flex gap-2">
                            <button
                                className={`px-3 py-1.5 rounded border ${mode === "host" ? "bg-emerald-600 border-emerald-500" : "bg-slate-700 border-slate-600"
                                    }`}
                                onClick={() => { setMode("host"); resetState(); }}
                            >
                                Host
                            </button>
                            <button
                                className={`px-3 py-1.5 rounded border ${mode === "viewer" ? "bg-indigo-600 border-indigo-500" : "bg-slate-700 border-slate-600"
                                    }`}
                                onClick={() => { setMode("viewer"); resetState(); }}
                            >
                                Viewer
                            </button>
                        </div>

                        <div className="mt-4">
                            <div className="text-sm text-slate-300">Room ID</div>
                            <input
                                className="mt-1 w-full rounded bg-slate-900 border border-slate-700 px-2 py-1 font-mono outline-none"
                                value={roomId}
                                onChange={(e) => setRoomId(e.target.value)}
                            />
                            <div className="mt-2 text-xs text-slate-400 break-all">
                                Посилання для глядача: <span className="underline decoration-dotted">{`${location.origin}/vision/${roomId}?mode=viewer`}</span>
                            </div>
                        </div>

                        <div className="mt-4 flex flex-wrap gap-2">
                            <button
                                className="px-3 py-1.5 rounded bg-emerald-600 hover:bg-emerald-500 active:scale-[.98]"
                                onClick={connect}
                            >
                                Підключитися
                            </button>
                            <button
                                className="px-3 py-1.5 rounded bg-rose-600 hover:bg-rose-500 active:scale-[.98]"
                                onClick={disconnect}
                            >
                                Відключитися
                            </button>
                            <button
                                disabled={!canShoot}
                                className={`px-3 py-1.5 rounded border ${canShoot ? "bg-amber-500 border-amber-400" : "bg-slate-700 border-slate-600 opacity-60 cursor-not-allowed"
                                    }`}
                                onClick={shoot}
                                title={canShoot ? "Зробити фото в Mongo" : "Немає відео — немає кадру"}
                            >
                                📸 Зробити фото
                            </button>
                        </div>

                        <div className="mt-3 text-sm">
                            <span className="px-2 py-1 rounded bg-slate-100 text-slate-900">status: {status}</span>
                            {err && <span className="ml-2 px-2 py-1 rounded bg-rose-200 text-rose-900">ERR: {err}</span>}
                        </div>
                    </div>

                    <div className="rounded-2xl bg-slate-800/70 p-4 border border-slate-700">
                        <div className="text-sm text-slate-300 mb-2">Відео</div>
                        <div className="grid gap-3 sm:grid-cols-2">
                            <div>
                                <div className="text-xs text-slate-400 mb-1">Local (host)</div>
                                <div className="aspect-video bg-black/80 rounded overflow-hidden border border-slate-700">
                                    <video ref={localVideoRef} playsInline muted className="w-full h-full object-contain" />
                                </div>
                            </div>
                            <div>
                                <div className="text-xs text-slate-400 mb-1">Remote (viewer)</div>
                                <div className="aspect-video bg-black/80 rounded overflow-hidden border border-slate-700">
                                    <video ref={remoteVideoRef} playsInline className="w-full h-full object-contain" />
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Підказки */}
                <div className="mt-4 text-xs text-slate-400 space-y-1">
                    <div>1) Хост генерує <span className="font-mono">roomId</span> і тисне «Підключитися».</div>
                    <div>2) Глядач відкриває лінк <span className="font-mono">/vision/&lt;roomId?mode=viewer</span> і тисне «Підключитися».</div>
                    <div>3) Коли відео пішло — можна тиснути «📸 Зробити фото» (відповідне до режиму).</div>
                </div>
            </div>
        </div>
    );
}
