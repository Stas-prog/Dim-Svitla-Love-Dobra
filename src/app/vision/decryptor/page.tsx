"use client";
import React, { useEffect, useState } from "react";

type Slide = { url: string; createdAt?: string };

export default function DecryptorPage() {
  const [roomId, setRoomId] = useState("");
  const [slides, setSlides] = useState<Slide[]>([]);
  const [loading, setLoading] = useState(false);

  async function load() {
    if (!roomId.trim()) return;
    setLoading(true);
    try {
      const r = await fetch(`/api/slides?roomId=${encodeURIComponent(roomId)}&limit=30`, { cache: "no-store" });
      const j = await r.json();
      if (j.ok) setSlides(j.items || []);
    } catch {}
    finally { setLoading(false); }
  }

  // авто-оновлення кожні 4с при заповненому roomId
  useEffect(() => {
    if (!roomId) return;
    const t = setInterval(load, 4000);
    return () => clearInterval(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [roomId]);

  return (
    <main className="max-w-5xl mx-auto p-4 sm:p-6">
      <h1 className="text-2xl font-semibold mb-3">🔎 Дешифратор</h1>

      <div className="flex gap-2 flex-wrap items-center mb-4">
        <input
          className="px-3 py-2 rounded bg-slate-900 border border-slate-700"
          placeholder="roomId…"
          value={roomId}
          onChange={(e) => setRoomId(e.target.value)}
          onKeyDown={(e) => { if (e.key === "Enter") load(); }}
        />
        <button
          className="px-3 py-2 rounded bg-emerald-500 text-black disabled:opacity-50"
          onClick={load}
          disabled={loading || !roomId.trim()}
        >
          {loading ? "Оновлюю…" : "Завантажити"}
        </button>
      </div>

      {slides.length === 0 && <div className="text-slate-400">Немає знімків для кімнати.</div>}

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {slides.map((s, i) => (
          <div key={i} className="rounded-xl overflow-hidden border border-slate-700">
            <div className="aspect-video bg-slate-800">
              <img src={s.url} alt={`snap ${i}`} className="w-full h-full object-cover" />
            </div>
            <div className="p-2 text-xs text-slate-400">{s.createdAt ? new Date(s.createdAt).toLocaleString() : ""}</div>
          </div>
        ))}
      </div>
    </main>
  );
}
