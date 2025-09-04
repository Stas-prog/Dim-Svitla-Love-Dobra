"use client";

import { useEffect, useMemo, useRef, useState } from "react";

type Snap = { _id: string; roomId: string; image: string; createdAt: string };

export default function DeshifratorPage() {
  const [roomId, setRoomId] = useState("");
  const [items, setItems] = useState<Snap[]>([]);
  const [idx, setIdx] = useState(0);
  const [loading, setLoading] = useState(false);
  const lastTsRef = useRef<string | null>(null);

  // завантаження перше + оновлення
  async function loadSnaps(full = false) {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (roomId) params.set("roomId", roomId);
      if (!full && lastTsRef.current) params.set("since", lastTsRef.current);
      params.set("limit", "60");

      const r = await fetch(`/api/snaps?${params.toString()}`, { cache: "no-store" });
      const data = await r.json();

      if (Array.isArray(data.items)) {
        if (full) {
          setItems(data.items);
        } else if (data.items.length) {
          setItems((prev) => {
            // додаємо нові в кінець
            const merged = [...prev, ...data.items.filter((d: Snap) => !prev.some(p => p._id === d._id))];
            return merged;
          });
        }
        const last = data.items[data.items.length - 1];
        if (last?.createdAt) lastTsRef.current = last.createdAt;
      }
    } catch (e) {
      // ignore
    } finally {
      setLoading(false);
    }
  }

  // перше завантаження
  useEffect(() => {
    loadSnaps(true);
  }, [roomId]);

  // автооновлення кожні 5с
  useEffect(() => {
    const t = setInterval(() => loadSnaps(false), 5000);
    return () => clearInterval(t);
  }, [roomId]);

  // автоперемикання кадрів
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
          placeholder="roomId (optional)"
          value={roomId}
          onChange={(e)=>{ setRoomId(e.target.value.trim()); lastTsRef.current=null; }}
        />
        <button
          onClick={()=>loadSnaps(true)}
          className="px-3 py-1 rounded bg-sky-600 hover:bg-sky-500"
        >Оновити</button>
      </header>

      <section className="relative flex-1 grid place-items-center overflow-hidden">
        {/* фонова «плівка» */}
        <div className="absolute inset-0 opacity-20 bg-[radial-gradient(circle_at_20%_20%,#334155,transparent_40%),radial-gradient(circle_at_80%_80%,#0ea5e9,transparent_30%)]" />
        <div className="relative w-full h-full max-w-5xl mx-auto p-4">
          {/* контейнер з fade */}
          <div className="relative w-full h-full rounded-2xl overflow-hidden bg-slate-900 shadow-2xl">
            {items.map((it, i) => (
              <img
                key={it._id}
                src={it.image}
                alt={`snap-${i}`}
                className={`absolute inset-0 w-full h-full object-contain transition-opacity duration-700 ${i===idx ? "opacity-100" : "opacity-0"}`}
                draggable={false}
              />
            ))}
            {!items.length && (
              <div className="absolute inset-0 grid place-items-center text-slate-400">
                {loading ? "Завантаження…" : "Немає знімків. Зроби 📸 у Vision → з’являться тут."}
              </div>
            )}
          </div>
        </div>
      </section>

      {current && (
        <footer className="p-3 text-center text-xs text-slate-400">
          room: <span className="text-slate-300">{current.roomId}</span> • {new Date(current.createdAt).toLocaleString()}
        </footer>
      )}
    </main>
  );
}
