"use client";

import { useEffect, useRef, useState } from "react";

type Slide = {
  public_id: string;
  secure_url: string;     // повний урл з Cloudinary
  created_at: string;
};

export default function DeshifratorPage() {
  const [roomId, setRoomId] = useState("");
  const [items, setItems] = useState<Slide[]>([]);
  const [idx, setIdx] = useState(0);
  const [loading, setLoading] = useState(false);
  const timerRef = useRef<number | null>(null);

  async function loadSlides() {
    if (!roomId) { setItems([]); return; }
    setLoading(true);
    try {
      const url = `/api/decrypt?roomId=${encodeURIComponent(roomId)}&limit=80`;
      const r = await fetch(url, { cache: "no-store" });
      const j = await r.json();
      const arr: Slide[] = Array.isArray(j?.items) ? j.items : [];
      setItems(arr);
      setIdx(0);
    } catch { /* ignore */ }
    setLoading(false);
  }

  useEffect(() => {
    // первинне завантаження
    loadSlides();

    // автооновлення кожні 6с
    if (timerRef.current) clearInterval(timerRef.current);
    timerRef.current = window.setInterval(() => {
      loadSlides();
    }, 6000) as unknown as number;

    return () => { if (timerRef.current) clearInterval(timerRef.current); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [roomId]);

  // автоперемикання
  useEffect(() => {
    if (!items.length) return;
    const t = setInterval(() => setIdx((i) => (i + 1) % items.length), 3500);
    return () => clearInterval(t);
  }, [items.length]);

  const current = items[idx];

  return (
    <main className="min-h-screen bg-black text-slate-100 flex flex-col">
      <header className="p-4 flex gap-3 items-center">
        <h1 className="text-xl font-semibold">🔎 Дешифратор</h1>
        <input
          className="ml-auto rounded bg-slate-900 border border-slate-700 px-3 py-1 w-72"
          placeholder="roomId (vision/<roomId>)"
          value={roomId}
          onChange={(e)=> setRoomId(e.target.value.trim())}
        />
        <button
          onClick={loadSlides}
          className="px-3 py-1 rounded bg-sky-600 hover:bg-sky-500 disabled:opacity-50"
          disabled={loading || !roomId}
        >
          Оновити
        </button>
      </header>

      <section className="relative flex-1 grid place-items-center overflow-hidden">
        <div className="absolute inset-0 opacity-20 bg-[radial-gradient(circle_at_20%_20%,#334155,transparent_40%),radial-gradient(circle_at_80%_80%,#0ea5e9,transparent_30%)]" />
        <div className="relative w-full h-full max-w-5xl mx-auto p-4">
          <div className="relative w-full h-full rounded-2xl overflow-hidden bg-slate-900 shadow-2xl">
            {items.map((it, i) => (
              <img
                key={it.public_id}
                src={it.secure_url}
                alt={`snap-${i}`}
                className={`absolute inset-0 w-full h-full object-contain transition-opacity duration-700 ${i===idx ? "opacity-100" : "opacity-0"}`}
                draggable={false}
              />
            ))}
            {!items.length && (
              <div className="absolute inset-0 grid place-items-center text-slate-400">
                {loading ? "Завантаження…" : "Немає знімків. Зроби 📸 у Vision або введи roomId."}
              </div>
            )}
          </div>
        </div>
      </section>

      {current && (
        <footer className="p-3 text-center text-xs text-slate-400">
          room: <span className="text-slate-300">{roomId}</span> • {new Date(current.created_at).toLocaleString()}
        </footer>
      )}
    </main>
  );
}
