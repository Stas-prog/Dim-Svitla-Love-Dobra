"use client";

import React, { useEffect, useRef, useState } from "react";
import Peer, { SignalData } from "simple-peer";
import { getClientId } from "@/lib/clientId";

type Mode = "host" | "viewer";
type Sdp = { type: "offer" | "answer"; sdp: string };
type SdpDoc = { roomId: string; from: string; sdp: Sdp };

// невеличкий хелпер
function genId() {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) return crypto.randomUUID();
  return `${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

export default function Vision() {
  // ---------- UI state
  const [mode, setMode] = useState<Mode>("host");
  const [roomId, setRoomId] = useState<string>("");
  const [status, setStatus] = useState<"idle" | "connecting" | "connected" | "error">("idle");
  const [err, setErr] = useState<string>("");

  const [mounted, setMounted] = useState(false);
  const [viewerHref, setViewerHref] = useState<string>("");

  // ---------- slideshow
  const [slideshowEnabled, setSlideshowEnabled] = useState(false);
  const [slideshowLimit, setSlideshowLimit] = useState<number>(20);
  const [shotsTaken, setShotsTaken] = useState<number>(0);
  const slideTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // ---------- WebRTC refs
  const clientIdRef = useRef<string>("");
  const peerRef = useRef<Peer.Instance | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const hostIdRef = useRef<string>("");

  const localVideoRef = useRef<HTMLVideoElement | null>(null);
  const remoteVideoRef = useRef<HTMLVideoElement | null>(null);

  const offerTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const answerTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const iceTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // антидублікати SDP
  const didApplyOfferRef = useRef(false);
  const didSendAnswerRef = useRef(false);
  const didApplyAnswerRef = useRef(false);

  useEffect(() => setMounted(true), []);

  // ---- URL <-> state
  useEffect(() => {
    if (!mounted) return;

    clientIdRef.current = getClientId();

    const url = new URL(window.location.href);
    // mode
    const qpMode = (url.searchParams.get("mode") as Mode) || "host";
    setMode(qpMode);
    // roomId
    const qpId = url.searchParams.get("roomId");
    if (qpId) {
      setRoomId(qpId);
    } else {
      const id = genId();
      setRoomId(id);
      url.searchParams.set("roomId", id);
      if (!url.searchParams.get("mode")) url.searchParams.set("mode", qpMode);
      window.history.replaceState({}, "", url.toString());
    }
  }, [mounted]);

  // viewer link
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

  // -------- helpers
  function destroyPeer() {
    try {
      peerRef.current?.destroy();
    } catch {}
    peerRef.current = null;

    if (offerTimerRef.current) {
      clearInterval(offerTimerRef.current);
      offerTimerRef.current = null;
    }
    if (answerTimerRef.current) {
      clearInterval(answerTimerRef.current);
      answerTimerRef.current = null;
    }
    if (iceTimerRef.current) {
      clearInterval(iceTimerRef.current);
      iceTimerRef.current = null;
    }

    // скидаємо SDP прапорці на нову спробу
    didApplyOfferRef.current = false;
    didSendAnswerRef.current = false;
    didApplyAnswerRef.current = false;
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

  // -------- camera
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

  // -------- connect
  async function handleConnect() {
    if (status === "connecting") return;
    setErr("");
    setStatus("connecting");

    const id = await ensureRoomId();
    destroyPeer();

    const isHost = mode === "host";
    const peer = new Peer({
      initiator: isHost,
      trickle: false, // простіше для нашого сигналінгу
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
        el.play().catch(() => {});
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

    // --- signal out
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
          if (didSendAnswerRef.current) return;
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
        // (trickle:false) ICE всередині SDP
      } catch (e: any) {
        console.error("signal POST error", e);
        setErr(e.message || "signal error");
      }
    });

    const isValidSdp = (obj: any, expected: "offer" | "answer"): obj is Sdp =>
      obj && obj.type === expected && typeof obj.sdp === "string";

    // viewer: poll OFFER
    async function pollOfferOnce(peerInst: Peer.Instance, room: string) {
      const r = await fetch(`/api/webrtc/offer?roomId=${encodeURIComponent(room)}`, { cache: "no-store" });
      if (!r.ok) return false;
      const doc = (await r.json()) as Partial<SdpDoc> | null;
      if (doc && doc.sdp && isValidSdp(doc.sdp, "offer") && !didApplyOfferRef.current) {
        didApplyOfferRef.current = true;
        if (doc.from) hostIdRef.current = doc.from;
        if (peerRef.current === peerInst) peerInst.signal(doc.sdp);
        return true;
      }
      return false;
    }

    // host: poll ANSWER
    async function pollAnswerOnce(peerInst: Peer.Instance, room: string, hostId: string) {
      if (!hostId) return false;
      const r = await fetch(
        `/api/webrtc/answer?roomId=${encodeURIComponent(room)}&to=${encodeURIComponent(hostId)}`,
        { cache: "no-store" }
      );
      if (!r.ok) return false;
      const doc = await r.json();
      const sdp = doc?.sdp ?? null;
      if (isValidSdp(sdp, "answer") && !didApplyAnswerRef.current) {
        didApplyAnswerRef.current = true;
        if (peerRef.current === peerInst) peerInst.signal(sdp);
        return true;
      }
      return false;
    }

    // timers
    if (!isHost) {
      offerTimerRef.current = setInterval(async () => {
        try {
          const got = await pollOfferOnce(peer, id);
          if (got && offerTimerRef.current) {
            clearInterval(offerTimerRef.current);
            offerTimerRef.current = null;
          }
        } catch {}
      }, 1200);
    } else {
      answerTimerRef.current = setInterval(async () => {
        try {
          const got = await pollAnswerOnce(peer, id, clientIdRef.current);
          if (got && answerTimerRef.current) {
            clearInterval(answerTimerRef.current);
            answerTimerRef.current = null;
          }
        } catch {}
      }, 1200);
    }

    peer.on("connect", () => setStatus("connected"));
    peer.on("error", (e) => {
      setErr(e.message || "peer error");
      setStatus("error");
    });
    peer.on("close", () => setStatus("idle"));
  }

  function handleStop() {
    setErr("");
    setStatus("idle");
    destroyPeer();
    try {
      streamRef.current?.getTracks().forEach((t) => t.stop());
    } catch {}
    streamRef.current = null;

    // зупиняємо слайдшоу
    setSlideshowEnabled(false);
    setShotsTaken(0);
    if (slideTimerRef.current) {
      clearInterval(slideTimerRef.current);
      slideTimerRef.current = null;
    }
  }

  // ---------- SNAPSHOT -> /api/upload (multipart)
  async function handleSnapshot() {
    try {
      const el = mode === "host" ? localVideoRef.current : remoteVideoRef.current;
      if (!el) throw new Error("video element not ready");

      const canvas = document.createElement("canvas");
      canvas.width = el.videoWidth || 640;
      canvas.height = el.videoHeight || 360;
      const ctx = canvas.getContext("2d");
      if (!ctx) throw new Error("canvas ctx error");

      ctx.drawImage(el, 0, 0, canvas.width, canvas.height);
      const dataUrl = canvas.toDataURL("image/jpeg", 0.85);

      // перетворюємо dataURL на Blob
      const blob = await (await fetch(dataUrl)).blob();
      const fd = new FormData();
      fd.append("roomId", await ensureRoomId());
      fd.append("file", blob, `snap-${Date.now()}.jpg`);
      // опціонально: підпис
      // fd.append("caption", "Made with Vision");
      // якщо ти хочеш пін із клієнта (безпечно лише як публічний), додай NEXT_PUBLIC_VISION_PIN
      

      const res = await fetch("/api/upload", {
        method: "POST",
        body: fd,
      });

      if (!res.ok) {
        const msg = await res.text().catch(() => "");
        throw new Error(`upload failed: ${msg || res.status}`);
      }

      setErr("");
      return true;
    } catch (e: any) {
      setErr(e.message || "snapshot error");
      return false;
    }
  }

  // ---------- SLIDESHOW
  useEffect(() => {
    if (!slideshowEnabled) {
      if (slideTimerRef.current) {
        clearInterval(slideTimerRef.current);
        slideTimerRef.current = null;
      }
      return;
    }

    setShotsTaken(0);
    slideTimerRef.current = setInterval(async () => {
      // стоп якщо не connected
      if (status !== "connected") return;

      // якщо виконали ліміт — вимикаємося
      setShotsTaken((prev) => {
        const next = prev + 1;
        return next;
      });

      const ok = await handleSnapshot();
      if (!ok) return;

      // перевіримо ліміт після успішного кадру
      setShotsTaken((prev) => {
        if (prev >= slideshowLimit) {
          setSlideshowEnabled(false);
          if (slideTimerRef.current) {
            clearInterval(slideTimerRef.current);
            slideTimerRef.current = null;
          }
        }
        return prev;
      });
    }, 2000);

    return () => {
      if (slideTimerRef.current) {
        clearInterval(slideTimerRef.current);
        slideTimerRef.current = null;
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [slideshowEnabled, slideshowLimit, status, mode]);

  return (
    <div className="rounded-2xl p-4 my-6 bg-slate-900 text-slate-50 shadow vision-ui">
      {/* top bar */}
      <div className="flex items-center gap-2 flex-wrap">
        <span className="px-2 py-1 rounded bg-slate-700 text-xs">mode: {mode}</span>
        <span className="px-2 py-1 rounded bg-slate-700 text-xs">status: {status}</span>
        {err && <span className="px-2 py-1 rounded bg-rose-600 text-xs">ERR: {err}</span>}
        <div className="ml-auto flex gap-2">
          <button
            className={`px-3 py-1 rounded ${
              mode === "host" ? "bg-amber-500 text-black" : "bg-slate-700"
            }`}
            onClick={() => setMode("host")}
          >
            host
          </button>
          <button
            className={`px-3 py-1 rounded ${
              mode === "viewer" ? "bg-emerald-400 text-black" : "bg-slate-700"
            }`}
            onClick={() => setMode("viewer")}
          >
            viewer
          </button>
        </div>
      </div>

      {/* room / viewer link */}
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
                if (v) url.searchParams.set("roomId", v);
                else url.searchParams.delete("roomId");
                window.history.replaceState({}, "", url.toString());
              }
            }}
            placeholder="auto-generated"
          />
          <div className="text-xs text-slate-400 mt-2">viewer link</div>
          <div
            className="break-all text-xs bg-slate-900 rounded p-2 border border-slate-700"
            suppressHydrationWarning
          >
            {mounted ? viewerHref || "—" : "—"}
          </div>
        </div>

        <div className="rounded-lg bg-slate-800 p-3 flex items-center gap-2 flex-wrap">
          {mode === "host" && (
            <button className="px-3 py-1 rounded bg-cyan-400 text-black" onClick={handleStartCamera}>
              🎥 Увімкнути камеру (host)
            </button>
          )}
          <button
            className={`px-3 py-1 rounded ${
              status === "connecting" ? "bg-slate-500 cursor-not-allowed" : "bg-emerald-400 text-black"
            }`}
            disabled={status === "connecting"}
            onClick={handleConnect}
          >
            🔗 Підключити
          </button>
          <button className="px-3 py-1 rounded bg-amber-400 text-black" onClick={handleSnapshot}>
            📸 Зробити фото (Cloudinary)
          </button>
          <button className="px-3 py-1 rounded bg-slate-600" onClick={handleStop}>
            ⛔️ Зупинити
          </button>
        </div>
      </div>

      {/* quick links */}
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

      {/* videos */}
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

      {/* slideshow controls */}
      <div className="rounded-lg bg-slate-800 p-3 mt-4 flex items-center gap-3 flex-wrap">
        <button
          className={`px-3 py-1 rounded ${
            slideshowEnabled ? "bg-rose-500 text-black" : "bg-sky-500 text-black"
          }`}
          onClick={() => setSlideshowEnabled((v) => !v)}
          disabled={status !== "connected"}
          title={status !== "connected" ? "Потрібно підключитися" : "Перемкнути слайд-шоу"}
        >
          🎞 Слайд-шоу {slideshowEnabled ? "OFF" : "ON"}
        </button>

        <label className="text-xs text-slate-300">пакет:</label>
        <select
          className="rounded bg-slate-900 border border-slate-700 px-2 py-1"
          value={slideshowLimit}
          onChange={(e) => setSlideshowLimit(Number(e.target.value))}
          disabled={slideshowEnabled}
        >
          <option value={20}>20</option>
          <option value={50}>50</option>
          <option value={100}>100</option>
          <option value={200}>200</option>
        </select>

        <span className="ml-auto text-xs text-slate-400">
          {shotsTaken} / {slideshowLimit}
        </span>
      </div>
    </div>
  );
}
