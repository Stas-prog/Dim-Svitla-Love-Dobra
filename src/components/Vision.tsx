"use client";

import React, { useEffect, useRef, useState } from "react";
import Peer, { SignalData } from "simple-peer";
import { getClientId } from "@/lib/clientId";

type Mode = "host" | "viewer";

type VisionProps = {
  initialRoomId?: string;
  initialMode?: Mode;
};

type Sdp = { type: "offer" | "answer"; sdp: string };
type SdpDoc = { roomId: string; from: string; sdp: Sdp };

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
  const hostIdRef = useRef<string>("");

  const localVideoRef = useRef<HTMLVideoElement | null>(null);
  const remoteVideoRef = useRef<HTMLVideoElement | null>(null);

  const offerTimerRef = useRef<number | null>(null);
  const answerTimerRef = useRef<number | null>(null);
  const iceTimerRef = useRef<number | null>(null);

  const didApplyOfferRef = useRef(false);
  const didSendAnswerRef = useRef(false);
  const didApplyAnswerRef = useRef(false);

  // --- Слайд-шоу контроль
  const [slideOn, setSlideOn] = useState(false);
  const slideTimerRef = useRef<number | null>(null);
  const [slideLimit, setSlideLimit] = useState<number>(50);
  const slideCountRef = useRef<number>(0);
  const [slideDelayMs, setSlideDelayMs] = useState<number>(1200); // інтервал між кадрами
  const isTakingRef = useRef(false); // щоб не накладалися запити

  useEffect(() => { setMounted(true); }, []);

  // URL -> mode/roomId
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

  // Формуємо viewer link із поточним roomId
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
    if (status === "connecting") return;
    setErr("");
    setStatus("connecting");

    const id = await ensureRoomId();
    destroyPeer();

    const isHost = mode === "host";
    const peer = new Peer({
      initiator: isHost,
      trickle: false,
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
      // viewer слухає вхідний remote stream
      peer.on("stream", (remote: MediaStream) => {
        const el = remoteVideoRef.current;
        if (!el) return;
        el.srcObject = remote;
        el.play().catch(() => { /* autoplay guard */ });
      });
    } else {
      // host: якщо не встиг увімкнути камеру — попросимо доступ і додамо треки
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

    // --- Відправка сигналів на бек
    peer.on("signal", async (data: SignalData) => {
      try {
        if ((data as any).type === "offer") {
          const res = await fetch("/api/webrtc/offer", {
            method: "POST",
            headers: { "content-type": "application/json" },
            body: JSON.stringify({ roomId: id, offer: data, from: clientIdRef.current }),
          });
          if (!res.ok) throw new Error("offer save failed");
        } else if ((data as any).type === "answer" && didSendAnswerRef.current) {
          return; // вже відправляли
        } else if ((data as any).type === "answer") {
          didSendAnswerRef.current = true;
          const res = await fetch("/api/webrtc/answer", {
            method: "POST",
            headers: { "content-type": "application/json" },
            body: JSON.stringify({
              roomId: id,
              answer: data,
              from: clientIdRef.current,
              to: hostIdRef.current || "",
            }),
          });
          if (!res.ok) throw new Error("answer save failed");
        }
      } catch (e: any) {
        console.error("signal POST error", e);
        setErr(e.message || "signal error");
      }
    });

    // --- Валідація SDP
    function isValidSdp(obj: any, expected: "offer" | "answer"): obj is Sdp {
      return obj && obj.type === expected && typeof obj.sdp === "string";
    }

    // viewer: отримує OFFER
    async function pollOfferOnce(peerInst: Peer.Instance, room: string) {
      const r = await fetch(`/api/webrtc/offer?roomId=${encodeURIComponent(room)}`, { cache: "no-store" });
      if (!r.ok) return false;
      const doc = await r.json();
      if (doc?.sdp?.type === "offer" && !didApplyOfferRef.current) {
        didApplyOfferRef.current = true;
        if (doc.from) hostIdRef.current = doc.from;
        if (peerRef.current === peerInst) peerInst.signal(doc.sdp);
        return true;
      }
      return false;
    }

    // host: отримує ANSWER
    async function pollAnswerOnce(peerInst: Peer.Instance, room: string, hostId: string) {
      if (!hostId) return false;
      const r = await fetch(
        `/api/webrtc/answer?roomId=${encodeURIComponent(room)}&to=${encodeURIComponent(hostId)}`,
        { cache: "no-store" }
      );
      if (!r.ok) return false;
      const doc = await r.json();
      if (doc?.sdp?.type === "answer" && !didApplyAnswerRef.current) {
        didApplyAnswerRef.current = true;
        if (peerRef.current === peerInst) peerInst.signal(doc.sdp);
        return true;
      }
      return false;
    }

    // --- Запускаємо пулінг
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

    peer.on("connect", () => setStatus("connected"));
    peer.on("error", (e) => { setErr(e.message || "peer error"); setStatus("error"); });
    peer.on("close", () => setStatus("idle"));
  }

  function handleStop() {
    setErr("");
    setStatus("idle");
    stopSlideshow();
    destroyPeer();
    try { streamRef.current?.getTracks().forEach(t => t.stop()); } catch { }
    streamRef.current = null;
  }

  // --- Базовий знімок (Cloudinary)
  async function handleSnapshot(): Promise<boolean> {
    try {
      const el = mode === "host" ? localVideoRef.current : remoteVideoRef.current;
      if (!el) throw new Error("video element not ready");

      // Захист від «чорних» кадрів: чекаємо поки з’явиться розмір
      if (!el.videoWidth || !el.videoHeight) throw new Error("video not ready (size)");

      const canvas = document.createElement("canvas");
      canvas.width = el.videoWidth;
      canvas.height = el.videoHeight;
      const ctx = canvas.getContext("2d");
      if (!ctx) throw new Error("canvas ctx error");

      ctx.drawImage(el, 0, 0, canvas.width, canvas.height);
      const dataUrl = canvas.toDataURL("image/jpeg", 0.85);

      const res = await fetch("/api/upload", {
        method: "POST",
        headers: {
          "content-type": "application/json",
          "x-pin": process.env.VISION_PIN || "1234",
        },
        body: JSON.stringify({
          roomId: await ensureRoomId(),
          imageDataUrl: dataUrl,
          caption: "",
        }),
      });

      if (!res.ok) {
        const msg = await res.text().catch(() => "");
        throw new Error(`upload failed: ${msg || res.status}`);
      }

      return true;
    } catch (e: any) {
      setErr(e.message || "snapshot error");
      return false;
    }
  }

  // --- Слайд-шоу (з лімітом)
  function stopSlideshow() {
    setSlideOn(false);
    slideCountRef.current = 0;
    if (slideTimerRef.current) {
      clearInterval(slideTimerRef.current);
      slideTimerRef.current = null;
    }
  }

  function startSlideshow() {
    if (slideOn) return;
    setErr("");
    slideCountRef.current = 0;
    setSlideOn(true);

    slideTimerRef.current = window.setInterval(async () => {
      if (!slideOn) return;
      if (slideCountRef.current >= slideLimit) {
        stopSlideshow();
        return;
      }
      try {
      handleSnapshot();
      slideCountRef.current += 1;}
      catch (e: any) {
      setErr(e.message || "snapshot error");
      return false;
    }
    }, slideDelayMs) as any;
  }

  function toggleSlideshow() {
    if (!slideOn) startSlideshow();
    else stopSlideshow();
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
            <button className="px-3 py-1 rounded bg-cyan-400 text-black" onClick={handleStartCamera} disabled={status==="connecting"}>
              🎥 Увімкнути камеру (host)
            </button>
          )}

          <button className="px-3 py-1 rounded bg-emerald-400 text-black" onClick={handleConnect} disabled={status==="connecting"}>
            🔗 Підключити
          </button>

          <button className="px-3 py-1 rounded bg-amber-400 text-black" onClick={handleSnapshot} disabled={status!=="connected"}>
            📸 Зробити фото (Cloudinary)
          </button>
          <button className="px-3 py-1 rounded bg-slate-600 ml-1" onClick={handleStop}>
            ⛔️ Зупинити
          </button>

          {/* Слайд-шоу + пакет */}
          <div className="flex items-center gap-2 ml-2">
            <div className="flex flex-col">🎞
            <label className="text-xs text-slate-300">Пакет:</label>
            <select
              className="rounded bg-slate-900 border border-slate-600 px-2 py-1 text-sm"
              value={slideLimit}
              onChange={(e)=> setSlideLimit(Number(e.target.value))}
              disabled={slideOn}
              title="Кількість кадрів у сесії"
            >
              <option value={20}>20</option>
              <option value={50}>50</option>
              <option value={100}>100</option>
              <option value={200}>200</option>
            </select>

            <label className="text-xs text-slate-300 ml-2">Інтервал:</label>
            <select
              className="rounded bg-slate-900 border border-slate-600 px-2 py-1 text-sm"
              value={slideDelayMs}
              onChange={(e)=> setSlideDelayMs(Number(e.target.value))}
              disabled={slideOn}
              title="Затримка між кадрами"
            >
              <option value={800}>0.8s</option>
              <option value={1200}>1.2s</option>
              <option value={2000}>2s</option>
              <option value={3000}>3s</option>
            </select>
            </div>
            <button
              className={`px-3 py-1 rounded ${slideOn ? "bg-rose-500" : "bg-indigo-400"} text-black`}
              onClick={toggleSlideshow}
              disabled={status!=="connected"}
              title="Слайд-шоу з лімітом пакетів"
            >
              {slideOn ? "⏹ Зупинити слайд-шоу" : "▶️ Слайд-шоу"}
            </button>

            <span className="text-xs text-slate-400 ml-2">
              {slideOn ? `кадрів: ${slideCountRef.current}/${slideLimit}` : `готово до зйомки`}
            </span>
          </div>
        </div>
      </div>

      <div className="mt-2 flex gap-2 flex-wrap">
        <a
          href="/snaps"
          className="px-3 py-1 rounded bg-black text-amber-700 text-sm"
          target="_blank"
        >
          🗂 Відкрити список кімнат
        </a>
        {roomId && (
          <a
            href={`/snaps/${encodeURIComponent(roomId)}`}
            className="px-3 py-1 rounded bg-black text-amber-700 text-sm"
            target="_blank"
          >
            🖼 Фото цієї кімнати
          </a>
        )}
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

      <div className="rounded-lg bg-slate-800 p-3 mt-4">
        <div className="text-sm font-semibold mb-2">🗂 Rooms & gallery</div>
        <p className="text-xs text-slate-300 mb-3">
          Всі кімнати та свіжі кадри — на окремих сторінках.
        </p>

        <a className="inline-block px-3 py-2 rounded bg-slate-600 text-red-700 hover:bg-sky-300" href="/snaps">
          🗂 Відкрити список кімнат
        </a>

        {roomId && (
          <a
            className="inline-block mt-3 text-xs underline text-sky-300"
            href={`/snaps/${encodeURIComponent(roomId)}`}
            target="_blank"
          >
            👉 Відкрити фото цієї кімнати
          </a>
        )}
      </div>
    </div>
  );
}
