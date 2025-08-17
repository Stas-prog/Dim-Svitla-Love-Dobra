// src/components/Vision.tsx
"use client";

import { useEffect, useRef, useState } from "react";
import Peer, { SignalData } from "simple-peer";
import { getClientId } from "@/lib/clientId";

/**
 * Допоміжні типи для сигналів
 */
type SdpLike = { type: "offer" | "answer"; sdp: string };
type CandidateLike = { type: "candidate"; candidate: RTCIceCandidateInit };

type Role = "host" | "viewer";

/**
 * Універсальні fetch-и до нашого бекенду.
 * Я навмисно зробив код "толерантним": якщо щось не так із форматом —
 * просто пропустимо, замість падати.
 */
async function postJSON<T = any>(url: string, body: any): Promise<T | null> {
    try {
        const r = await fetch(url, {
            method: "POST",
            headers: { "content-type": "application/json" },
            body: JSON.stringify(body),
            cache: "no-store",
        });
        if (!r.ok) return null;
        return (await r.json()) as T;
    } catch {
        return null;
    }
}
async function getJSON<T = any>(url: string): Promise<T | null> {
    try {
        const r = await fetch(url, { cache: "no-store" });
        if (!r.ok) return null;
        return (await r.json()) as T;
    } catch {
        return null;
    }
}

/**
 * Головний компонент Vision
 */
export default function Vision() {
    const [mounted, setMounted] = useState(false);
    const [role, setRole] = useState<Role | null>(null);

    const [status, setStatus] = useState<string>("idle");
    const [err, setErr] = useState<string | null>(null);

    const clientIdRef = useRef<string>("");
    const peerRef = useRef<Peer.Instance | null>(null);

    const localVideoRef = useRef<HTMLVideoElement>(null);
    const remoteVideoRef = useRef<HTMLVideoElement>(null);

    const localStreamRef = useRef<MediaStream | null>(null);

    // Ідентифікатори пулінгу
    const answerPollId = useRef<number | null>(null);
    const candPollId = useRef<number | null>(null);

    // =============== Mount / Role from localStorage ===============
    useEffect(() => {
        clientIdRef.current = getClientId();
        const saved = (typeof window !== "undefined" && localStorage.getItem("vision-role")) as
            | Role
            | null;
        setRole(saved ?? "host");
        setMounted(true);
    }, []);

    // =============== Допоміжне: зупинити медіа/peer/пулинг ===============
    function stopPolling() {
        if (answerPollId.current) window.clearInterval(answerPollId.current);
        if (candPollId.current) window.clearInterval(candPollId.current);
        answerPollId.current = null;
        candPollId.current = null;
    }
    function destroyPeer() {
        try {
            peerRef.current?.destroy();
        } catch { }
        peerRef.current = null;
    }
    function stopLocalStream() {
        try {
            localStreamRef.current?.getTracks()?.forEach((t) => t.stop());
        } catch { }
        localStreamRef.current = null;
    }
    function resetVideoElements() {
        if (localVideoRef.current) localVideoRef.current.srcObject = null;
        if (remoteVideoRef.current) remoteVideoRef.current.srcObject = null;
    }
    function fullCleanup() {
        stopPolling();
        destroyPeer();
        stopLocalStream();
        resetVideoElements();
        setStatus("idle");
        setErr(null);
    }

    // =============== Отримання локального потоку для host ===============
    async function ensureLocalMedia() {
        if (localStreamRef.current) return localStreamRef.current;
        try {
            const s = await navigator.mediaDevices.getUserMedia({
                video: { facingMode: "user" },
                audio: true,
            });
            localStreamRef.current = s;
            if (localVideoRef.current) {
                localVideoRef.current.srcObject = s;
            }
            return s;
        } catch (e) {
            setErr("Не вдалося отримати доступ до камери/мікрофона.");
            throw e;
        }
    }

    // =============== Host flow ===============
    async function startHost() {
        fullCleanup();
        setStatus("init host…");
        setErr(null);

        const stream = await ensureLocalMedia();

        // Peer як ініціатор (host)
        const p = new Peer({ initiator: true, trickle: true, stream });
        peerRef.current = p;

        // коли готовий локальний SDP – шлемо в /webrtc/offer
        p.on("signal", async (sig: SignalData) => {
            // Можуть приходити і candidates, і offer. Збережемо все.
            if ((sig as any).type === "offer") {
                setStatus("sending offer…");
                await postJSON("/api/webrtc/offer", {
                    clientId: clientIdRef.current,
                    sdp: (sig as SdpLike).sdp,
                    type: "offer",
                });
                setStatus("offer sent, waiting answer…");

                // починаємо пулити answer для нас
                if (answerPollId.current) window.clearInterval(answerPollId.current);
                answerPollId.current = window.setInterval(async () => {
                    const ans = await getJSON<SdpLike | null>(
                        `/api/webrtc/answer?for=${encodeURIComponent(clientIdRef.current)}`
                    );
                    if (ans && ans.type === "answer" && ans.sdp) {
                        try {
                            p.signal(ans as SignalData);
                            setStatus("answer received ✔");
                            if (answerPollId.current) window.clearInterval(answerPollId.current);
                            answerPollId.current = null;
                        } catch (e) {
                            setErr("Помилка обробки answer");
                        }
                    }
                }, 1500) as unknown as number;
            } else if ((sig as any).type === "candidate") {
                // додаткові локальні кандидати – пересилаємо на бекенд
                await postJSON("/api/webrtc/candidate", {
                    clientId: clientIdRef.current,
                    type: "candidate",
                    candidate: (sig as CandidateLike).candidate,
                });
            }
        });

        // приходять віддалені треки
        p.on("track", (track, stream) => {
            if (remoteVideoRef.current) {
                remoteVideoRef.current.srcObject = stream;
            }
        });

        // статуси
        p.on("connect", () => setStatus("connected ✔"));
        p.on("error", (e) => {
            setErr("Peer error: " + (e?.message ?? String(e)));
            setStatus("error");
        });
        p.on("close", () => {
            setStatus("closed");
            stopPolling();
        });

        // host також може отримувати кандидати від viewer
        if (candPollId.current) window.clearInterval(candPollId.current);
        candPollId.current = window.setInterval(async () => {
            const list = await getJSON<any[] | null>(
                `/api/webrtc/candidate?for=${encodeURIComponent(clientIdRef.current)}`
            );
            if (Array.isArray(list)) {
                list.forEach((item) => {
                    // очікуємо {type:'candidate', candidate:{...}}
                    if (item && item.type === "candidate" && item.candidate) {
                        try {
                            p.signal(item as SignalData);
                        } catch { }
                    }
                });
            }
        }, 1500) as unknown as number;

        setStatus("local media ready, offer pending…");
    }

    // =============== Viewer flow ===============
    async function startViewer() {
        fullCleanup();
        setErr(null);
        setStatus("init viewer…");

        // Viewer НЕ ініціатор
        const p = new Peer({ initiator: false, trickle: true });
        peerRef.current = p;

        // viewer чекає на offer від host
        const offerPoll = window.setInterval(async () => {
            const off = await getJSON<SdpLike | null>(
                `/api/webrtc/offer?for=${encodeURIComponent(clientIdRef.current)}`
            );
            if (off && off.type === "offer" && off.sdp) {
                try {
                    p.signal(off as SignalData);
                    window.clearInterval(offerPoll);
                    setStatus("offer received, sending answer…");
                } catch (e) {
                    setErr("Помилка обробки offer");
                }
            }
        }, 1500);

        // коли в viewer з’являється локальний answer – відправляємо його
        p.on("signal", async (sig: SignalData) => {
            if ((sig as any).type === "answer") {
                await postJSON("/api/webrtc/answer", {
                    clientId: clientIdRef.current,
                    sdp: (sig as SdpLike).sdp,
                    type: "answer",
                });
                setStatus("answer sent ✔");
            } else if ((sig as any).type === "candidate") {
                await postJSON("/api/webrtc/candidate", {
                    clientId: clientIdRef.current,
                    type: "candidate",
                    candidate: (sig as CandidateLike).candidate,
                });
            }
        });

        // віддалений трек від host
        p.on("track", (track, stream) => {
            if (remoteVideoRef.current) {
                remoteVideoRef.current.srcObject = stream;
            }
        });

        p.on("connect", () => setStatus("connected ✔"));
        p.on("error", (e) => {
            setErr("Peer error: " + (e?.message ?? String(e)));
            setStatus("error");
        });
        p.on("close", () => {
            setStatus("closed");
            stopPolling();
        });

        // viewer також приймає кандидати, які може присилати host
        if (candPollId.current) window.clearInterval(candPollId.current);
        candPollId.current = window.setInterval(async () => {
            const list = await getJSON<any[] | null>(
                `/api/webrtc/candidate?for=${encodeURIComponent(clientIdRef.current)}`
            );
            if (Array.isArray(list)) {
                list.forEach((item) => {
                    if (item && item.type === "candidate" && item.candidate) {
                        try {
                            p.signal(item as SignalData);
                        } catch { }
                    }
                });
            }
        }, 1500) as unknown as number;

        setStatus("waiting for offer…");
    }

    function disconnectAll() {
        fullCleanup();
    }

    // =============== UI (контрастні стилі + анти-гідрація) ===============
    return (
        <main className="min-h-screen w-full bg-slate-900 text-slate-100 isolate">
            <div className="mx-auto max-w-5xl p-4 sm:p-6">
                <h1 className="text-2xl sm:text-3xl font-bold">👁️ Vision</h1>
                <p className="mt-1 text-slate-300">
                    Peer-to-peer відео/аудіо місток. Обери роль (host або viewer) і натисни кнопку старту.
                </p>

                {/* Роль показуємо лише після mount — без розсинхрону SSR/CSR */}
                <div className="mt-3">
                    <span
                        suppressHydrationWarning
                        className="px-2 py-1 rounded bg-slate-800 text-xs !text-white"
                    >
                        {mounted && role ? role : "…"}
                    </span>
                </div>

                <div className="mt-4 flex flex-wrap items-center gap-2">
                    <button
                        onClick={() => {
                            setRole("viewer");
                            if (typeof window !== "undefined") localStorage.setItem("vision-role", "viewer");
                        }}
                        className="px-4 py-2 rounded-lg bg-blue-600 !text-white font-semibold shadow-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-400"
                    >
                        Join Viewer
                    </button>

                    <button
                        onClick={() => {
                            setRole("host");
                            if (typeof window !== "undefined") localStorage.setItem("vision-role", "host");
                        }}
                        className="px-4 py-2 rounded-lg bg-emerald-600 !text-white font-semibold shadow-md hover:bg-emerald-700 focus:outline-none focus:ring-2 focus:ring-emerald-400"
                    >
                        Start Broadcaster
                    </button>

                    {mounted && role === "host" && (
                        <button
                            onClick={startHost}
                            className="px-4 py-2 rounded-lg bg-indigo-600 !text-white font-semibold shadow-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-400"
                        >
                            ▶ Start Host
                        </button>
                    )}

                    {mounted && role === "viewer" && (
                        <button
                            onClick={startViewer}
                            className="px-4 py-2 rounded-lg bg-indigo-600 !text-white font-semibold shadow-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-400"
                        >
                            ▶ Start Viewer
                        </button>
                    )}

                    <button
                        onClick={disconnectAll}
                        className="px-4 py-2 rounded-lg bg-rose-600 !text-white font-semibold shadow-md hover:bg-rose-700 focus:outline-none focus:ring-2 focus:ring-rose-400"
                    >
                        ⏹ Disconnect
                    </button>
                </div>

                {/* Статуси */}
                <div className="mt-4 grid gap-3 sm:grid-cols-3">
                    <div className="rounded-lg bg-slate-800/70 p-3">
                        <div className="text-xs text-slate-400">Client ID</div>
                        <div className="mt-1 font-mono text-sm break-all">{clientIdRef.current || "—"}</div>
                    </div>
                    <div className="rounded-lg bg-slate-800/70 p-3">
                        <div className="text-xs text-slate-400">Status</div>
                        <div className="mt-1 text-sm">{status}</div>
                    </div>
                    <div className="rounded-lg bg-slate-800/70 p-3">
                        <div className="text-xs text-slate-400">Error</div>
                        <div className="mt-1 text-sm text-rose-300">{err || "—"}</div>
                    </div>
                </div>

                {/* Відео-панелі */}
                <div className="mt-6 grid gap-4 sm:grid-cols-2">
                    <div className="rounded-2xl bg-slate-800/60 p-3">
                        <div className="text-sm text-slate-300 mb-2">Local</div>
                        <video
                            ref={localVideoRef}
                            className="w-full aspect-video rounded-lg bg-black"
                            playsInline
                            autoPlay
                            muted
                        />
                    </div>
                    <div className="rounded-2xl bg-slate-800/60 p-3">
                        <div className="text-sm text-slate-300 mb-2">Remote</div>
                        <video
                            ref={remoteVideoRef}
                            className="w-full aspect-video rounded-lg bg-black"
                            playsInline
                            autoPlay
                        />
                    </div>
                </div>
            </div>
        </main>
    );
}
