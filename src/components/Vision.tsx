"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import SimplePeer, { SignalData } from "simple-peer";

type UIMode = "host" | "viewer";

type Props = {
    initialMode?: UIMode;
    initialRoomId?: string;
};

type OfferPayload = SignalData;   // { type:'offer', sdp:... }
type AnswerPayload = SignalData;  // { type:'answer', sdp:... }
type IcePayload = { type: "candidate"; candidate: RTCIceCandidateInit };

const POLL_MS = 1200;

export default function Vision({ initialMode, initialRoomId }: Props) {
    // --- URL fallbacks ---
    const search = typeof window !== "undefined" ? window.location.search : "";
    const params = useMemo(() => new URLSearchParams(search), [search]);

    const startMode: UIMode =
        (initialMode ??
            ((params.get("mode") ?? "viewer") === "host" ? "host" : "viewer")) as UIMode;

    const startRoomId: string =
        initialRoomId ??
        params.get("roomId") ??
        (typeof crypto !== "undefined" && crypto.randomUUID
            ? crypto.randomUUID()
            : String(Date.now()));

    // --- state ---
    const [mode, setMode] = useState<UIMode>(startMode);
    const [roomId, setRoomId] = useState<string>(startRoomId);
    const [status, setStatus] = useState("idle");
    const [err, setErr] = useState<string | null>(null);

    // --- refs ---
    const localVideoRef = useRef<HTMLVideoElement | null>(null);
    const remoteVideoRef = useRef<HTMLVideoElement | null>(null);
    const streamRef = useRef<MediaStream | null>(null);
    const peerRef = useRef<SimplePeer.Instance | null>(null);
    const myIdRef = useRef<string>(
        typeof crypto !== "undefined" && crypto.randomUUID
            ? crypto.randomUUID()
            : String(Date.now())
    );
    const otherIdRef = useRef<string | null>(null); // партнер по кімнаті

    // helpers
    const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

    async function pollJSON<T = any>(url: string): Promise<T | null> {
        try {
            const r = await fetch(url, { cache: "no-store" });
            if (!r.ok) return null;
            const j = await r.json();
            if (j && Object.keys(j).length) return j as T;
            return null;
        } catch {
            return null;
        }
    }

    useEffect(() => {
        let stop = false;
        const isHost = mode === "host";
        setStatus("starting");
        setErr(null);

        const peer = new SimplePeer({ initiator: isHost, trickle: true });
        peerRef.current = peer;

        // HOST: getUserMedia + addTrack
        if (isHost) {
            (async () => {
                try {
                    const media = await navigator.mediaDevices.getUserMedia({
                        video: true,
                        audio: false,
                    });
                    if (stop) return;
                    streamRef.current = media;
                    if (localVideoRef.current) localVideoRef.current.srcObject = media;
                    media.getTracks().forEach((t) => peer.addTrack(t, media));
                } catch (e: any) {
                    if (!stop) setErr(e.message || "getUserMedia failed");
                }
            })();
        } else {
            // VIEWER: приймає remote stream
            peer.on("track", (_track, stream) => {
                const el = remoteVideoRef.current;
                if (!el) return;
                el.srcObject = stream;
                el.play().catch(() => { });
            });
        }

        // Всі вихідні сигнали сюди
        peer.on("signal", async (data: SignalData) => {
            try {
                if ((data as any).type === "offer") {
                    // HOST зберігає OFFЕР
                    await fetch("/api/webrtc/offer", {
                        method: "POST",
                        headers: { "content-type": "application/json" },
                        body: JSON.stringify({
                            roomId,
                            offer: data as OfferPayload,
                            from: myIdRef.current,
                        }),
                    });
                } else if ((data as any).type === "answer") {
                    // VIEWER зберігає ANSWER (to = hostId)
                    await fetch("/api/webrtc/answer", {
                        method: "POST",
                        headers: { "content-type": "application/json" },
                        body: JSON.stringify({
                            roomId,
                            answer: data as AnswerPayload,
                            from: myIdRef.current,
                            to: otherIdRef.current, // відомий після читання offer
                        }),
                    });
                } else if ((data as any).candidate) {
                    // ICE двосторонній: to — якщо вже знаємо партнера
                    await fetch("/api/webrtc/candidate", {
                        method: "POST",
                        headers: { "content-type": "application/json" },
                        body: JSON.stringify({
                            roomId,
                            ice: { type: "candidate", candidate: (data as any).candidate } as IcePayload,
                            from: myIdRef.current,
                            to: otherIdRef.current ?? undefined,
                        }),
                    });
                }
            } catch (e: any) {
                console.error("signal POST error", e);
                setErr(e.message || "signal error");
            }
        });

        peer.on("connect", () => setStatus("connected"));
        peer.on("error", (e) => {
            setErr(e.message);
            setStatus("error");
        });
        peer.on("close", () => setStatus("idle"));

        // Пулінг (залежно від ролі)
        (async () => {
            if (isHost) {
                // HOST чекає answer + ICE від viewer
                setStatus("waiting-answer");

                // опитуємо відповідь
                while (!stop && !otherIdRef.current) {
                    const ans = await pollJSON<{ sdp: any; from: string }>(
                        `/api/webrtc/answer?roomId=${encodeURIComponent(roomId)}&to=${encodeURIComponent(
                            myIdRef.current
                        )}`
                    );
                    if (ans?.sdp) {
                        otherIdRef.current = ans.from;
                        peer.signal(ans.sdp as any);
                        break;
                    }
                    await sleep(POLL_MS);
                }

                setStatus("exchanging-ice");
                // host читає ICE, адресовані йому
                while (!stop) {
                    const ice = await pollJSON<{ ice: IcePayload }>(
                        `/api/webrtc/candidate?roomId=${encodeURIComponent(
                            roomId
                        )}&to=${encodeURIComponent(myIdRef.current)}`
                    );
                    if (ice?.ice?.candidate) {
                        try {
                            peer.signal(ice.ice as any);
                        } catch (e) {
                            // може прийти задубльований кандидат — ігноруємо
                        }
                    }
                    await sleep(POLL_MS);
                }
            } else {
                // VIEWER спершу чекає offer від host
                setStatus("waiting-offer");
                let hostId: string | null = null;

                while (!stop && !hostId) {
                    const off = await pollJSON<{ sdp: any; from: string }>(
                        `/api/webrtc/offer?roomId=${encodeURIComponent(roomId)}`
                    );
                    if (off?.sdp && off.from) {
                        hostId = off.from;
                        otherIdRef.current = hostId;
                        peer.signal(off.sdp as any);
                        break;
                    }
                    await sleep(POLL_MS);
                }

                setStatus("exchanging-ice");
                // viewer читає ICE: або адресовані йому, або «broadcast» (to не заданий) від host
                while (!stop) {
                    const ice = await pollJSON<{ ice: IcePayload }>(
                        `/api/webrtc/candidate?roomId=${encodeURIComponent(
                            roomId
                        )}&to=${encodeURIComponent(myIdRef.current)}&from=${encodeURIComponent(
                            otherIdRef.current || ""
                        )}`
                    );
                    if (ice?.ice?.candidate) {
                        try {
                            peer.signal(ice.ice as any);
                        } catch (e) { }
                    }
                    await sleep(POLL_MS);
                }
            }
        })();

        return () => {
            stop = true;
            try {
                peer.destroy();
            } catch { }
            peerRef.current = null;
        };
    }, [mode, roomId]);

    return (
        <div className="min-h-screen bg-black text-white p-4 space-y-4">
            <h1 className="text-2xl font-bold">Vision WebRTC Bridge</h1>

            <div className="flex flex-wrap gap-3 items-center">
                <span className="px-2 py-1 rounded bg-slate-100 text-xs text-slate-900">mode</span>
                <button
                    className={`px-3 py-1 rounded ${mode === "host" ? "bg-emerald-600" : "bg-slate-700"}`}
                    onClick={() => setMode("host")}
                >
                    host
                </button>
                <button
                    className={`px-3 py-1 rounded ${mode === "viewer" ? "bg-blue-600" : "bg-slate-700"}`}
                    onClick={() => setMode("viewer")}
                >
                    viewer
                </button>

                <span className="ml-4 px-2 py-1 rounded bg-slate-100 text-xs text-slate-900">room</span>
                <input
                    value={roomId}
                    onChange={(e) => setRoomId(e.target.value)}
                    className="px-2 py-1 rounded bg-white/90 text-black"
                />
                <a
                    className="px-3 py-1 rounded bg-indigo-600"
                    href={`/vision/${encodeURIComponent(roomId)}?mode=viewer`}
                >
                    Посилання для глядача
                </a>

                <span className="ml-auto text-sm opacity-80">status: {status}</span>
            </div>

            {err && <div className="text-sm text-rose-400">ERR: {err}</div>}

            <div className="grid gap-4 sm:grid-cols-2">
                <div className="rounded-2xl bg-white/10 p-3">
                    <div className="text-sm opacity-80 mb-1">{mode === "host" ? "LOCAL" : "REMOTE"}</div>
                    {mode === "host" ? (
                        <video ref={localVideoRef} autoPlay playsInline muted className="w-full rounded-lg" />
                    ) : (
                        <video ref={remoteVideoRef} autoPlay playsInline className="w-full rounded-lg" />
                    )}
                </div>
            </div>
        </div>
    );
}
