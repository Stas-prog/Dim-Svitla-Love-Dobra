"use client";

import { useEffect, useRef, useState } from "react";

type Slide = { id: string; url: string; createdAt: string };
type Room = { roomId: string; lastUploadedAt?: string | null };

export default function DecryptorPage() {
  const [roomId, setRoomId] = useState("");
  const [rooms, setRooms] = useState<Room[]>([]);
  const [loadingRooms, setLoadingRooms] = useState(true);

  const [slides, setSlides] = useState<Slide[]>([]);
  const [idx, setIdx] = useState(0);
  const [playing, setPlaying] = useState(true);
  const [speed, setSpeed] = useState(3); // сек: 1..10
  const [loadingSlides, setLoadingSlides] = useState(false);

  const nextCursorRef = useRef<string | null>(null);
  const tickRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // helpers
  const clearTick = () => {
    if (tickRef.current) {
      clearTimeout(tickRef.current);
      tickRef.current = null;
    }
  };

  const scheduleTick = () => {
    clearTick();
    if (!playing || slides.length === 0) return;
    tickRef.current = setTimeout(() => {
      setIdx((i) => {
        const n = slides.length;
        const next = (i + 1) % Math.max(n, 1);
        // якщо підходимо до кінця і є nextCursor — підтягнемо ще
        if (next >= n - 2 && nextCursorRef.current) void loadSlides(false);
        return next;
      });
    }, Math.max(1, speed) * 1000);
  };

  // rooms
  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const r = await fetch("/api/vision/rooms?limit=200", { cache: "no-store" });
        const j = await r.json();
        if (alive) setRooms(j.items || []);
      } finally {
        if (alive) setLoadingRooms(false);
      }
    })();
    return () => {
      alive = false;
    };
  }, []);

  // slides loader
  async function loadSlides(full: boolean) {
    if (!roomId) return;
    setLoadingSlides(true);
    try {
      const params = new URLSearchParams();
      params.set("roomId", roomId);
      params.set("limit", "100");
      if (!full && nextCursorRef.current) params.set("cursor", nextCursorRef.current);

      const r = await fetch(`/api/slides?${params.toString()}`, { cache: "no-store" });
      const j = await r.json();

      const items: Slide[] = Array.isArray(j.items) ? j.items : [];
      if (full) {
        setSlides(items);
        setIdx(0);
      } else if (items.length) {
        setSlides((prev) => {
          const seen = new Set(prev.map((s) => s.id));
          return [...prev, ...items.filter((s) => !seen.has(s.id))];
        });
      }
      nextCursorRef.current = j.nextCursor || null;
    } catch {
      // ignore
    } finally {
      setLoadingSlides(false);
    }
  }

  // on room change
  useEffect(() => {
    nextCursorRef.current = null;
    if (roomId) void loadSlides(true);
    else {
      setSlides([]);
      setIdx(0);
    }
  }, [roomId]);

  // autoplay
  useEffect(() => {
    scheduleTick();
    return clearTick;
  }, [playing, speed, slides, idx]);

  const current = slides[idx];
  const canPrev = slides.length > 1;
  const canNext = slides.length > 1;

  return (
    <main className="min-h-screen bg-black text-slate-100 flex flex-col">
      {/* HEADER */}
      <header className="p-4 flex flex-col gap-3 sm:flex-row sm:items-center">
        <h1 className="text-xl font-semibold">🎞 Кінотеатр</h1>

        {/* вибір кімнати */}
        <div className="flex gap-2 items-center lg:ml-110">
          <label className="text-slate-400 text-sm">Кімната:</label>
          <select
            className="rounded bg-slate-900 border border-slate-700 px-2 py-1"
            value={roomId}
            onChange={(e) => setRoomId(e.target.value)}
          >
            <option value="">{loadingRooms ? "Завантаження…" : "— виберіть —"}</option>
            {rooms.map((r) => (
              <option key={r.roomId} value={r.roomId}>
                {r.roomId}
              </option>
            ))}
          </select>
        </div>

        {/* лінк на фото кімнати */}
        {roomId && (
          <a
            className="sm:ml-auto text-sky-400 underline"
            href={`/snaps/${encodeURIComponent(roomId)}`}
            target="_blank"
          >
            🖼 Фото цієї кімнати
          </a>
        )}
      </header>

      {/* CONTROLS */}
      <section className="px-4 pb-2 flex flex-wrap items-center gap-3">
        <button
          onClick={() => setPlaying((p) => !p)}
          className="px-3 py-1 rounded bg-emerald-500 text-black"
          disabled={slides.length === 0}
        >
          {playing ? "⏸ Пауза" : "▶️ Пуск"}
        </button>

        <button
          onClick={() => setIdx((i) => (i - 1 + slides.length) % Math.max(slides.length, 1))}
          className="px-3 py-1 rounded bg-slate-700"
          disabled={!canPrev}
        >
          ⏮ Попередній
        </button>

        <button
          onClick={() => setIdx((i) => (i + 1) % Math.max(slides.length, 1))}
          className="px-3 py-1 rounded bg-slate-700"
          disabled={!canNext}
        >
          ⏭ Наступний
        </button>

        <div className="ml-0 sm:ml-4 flex items-center gap-2">
          <label className="text-sm text-slate-400">Швидкість:</label>
          <input
            type="range"
            min={1}
            max={10}
            step={1}
            value={speed}
            onChange={(e) => setSpeed(Number(e.target.value))}
          />
          <span className="text-sm tabular-nums">{speed}s</span>
        </div>

        {nextCursorRef.current && (
          <button
            onClick={() => loadSlides(false)}
            className="ml-auto px-3 py-1 rounded bg-sky-600 hover:bg-sky-500"
            disabled={loadingSlides}
          >
            {loadingSlides ? "…завантаження" : "⬇️ Довантажити ще"}
          </button>
        )}
      </section>

      {/* STAGE */}
      <section className="relative flex-1 grid place-items-center overflow-hidden">
        {/* м’який фон */}
        <div className="absolute inset-0 opacity-20 bg-[radial-gradient(circle_at_20%_20%,#334155,transparent_40%),radial-gradient(circle_at_80%_80%,#0ea5e9,transparent_30%)]" />

        <div className="relative w-full h-full max-w-6xl mx-auto p-4">
          <div className="relative w-full h-full rounded-2xl overflow-hidden bg-slate-900 shadow-2xl">
            {slides.map((s, i) => (
              <img
                key={s.id}
                src={s.url}
                alt={`slide-${i}`}
                className={`absolute inset-0 w-full h-full object-contain transition-opacity duration-500 ${
                  i === idx ? "opacity-100" : "opacity-0"
                }`}
                draggable={false}
                onLoad={scheduleTick} // якщо довго вантажиться — таймінг синхронний
              />
            ))}

            {slides.length === 0 && (
              <div className="absolute inset-0 grid place-items-center text-slate-400 p-6 text-center">
                {roomId
                  ? loadingSlides
                    ? "Завантаження кадрів…"
                    : "Немає кадрів у цій кімнаті."
                  : "Оберіть кімнату або створіть знімки у Vision."}
              </div>
            )}
          </div>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="p-3 text-center text-xs text-slate-400">
        {slides.length > 0 ? (
          <>
            кадр {idx + 1}/{slides.length}
            {current?.createdAt ? (
              <> • {new Date(current.createdAt).toLocaleString()}</>
            ) : null}
          </>
        ) : (
          <>готово до перегляду</>
        )}
      </footer>
    </main>
  );
}
