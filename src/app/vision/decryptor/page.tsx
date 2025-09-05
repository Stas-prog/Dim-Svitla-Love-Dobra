// src/app/vision/decryptor/page.tsx
"use client";

import { useEffect, useMemo, useRef, useState } from "react";

type Item = { public_id:string; url:string; created_at:string };

export default function DecryptorPage() {
  const [roomId, setRoomId] = useState("");
  const [series, setSeries] = useState<"default"|"slideshow">("slideshow"); // за замовчуванням кіношна серія
  const [items, setItems] = useState<Item[]>([]);
  const [idx, setIdx] = useState(0);
  const [loading, setLoading] = useState(false);

  async function load(full = true) {
    if (!roomId) { setItems([]); return; }
    setLoading(true);
    try {
      const r = await fetch(`/api/slides?roomId=${encodeURIComponent(roomId)}&series=${series}&limit=120`, { cache:"no-store" });
      const j = await r.json();
      setItems(Array.isArray(j.items) ? j.items : []);
      setIdx(0);
    } finally {
      setLoading(false);
    }
  }

  useEffect(()=>{ load(true); }, [roomId, series]);

  // авто-прокрутка
  useEffect(()=>{
    if (!items.length) return;
    const t = setInterval(()=> setIdx(i => (i+1)%items.length), 2500);
    return ()=>clearInterval(t);
  }, [items.length]);

  const current = items[idx];

  return (
    <main className="min-h-screen bg-black text-slate-100 flex flex-col">
      <header className="p-4 flex gap-3 items-center">
        <h1 className="text-xl font-semibold">🔎 Дешифратор</h1>

        <input
          className="ml-auto rounded bg-slate-900 border border-slate-700 px-3 py-1 w-72"
          placeholder="roomId"
          value={roomId}
          onChange={(e)=> setRoomId(e.target.value.trim())}
        />

        <select
          className="rounded bg-slate-900 border border-slate-700 px-2 py-1"
          value={series}
          onChange={(e)=> setSeries(e.target.value as any)}
        >
          <option value="default">default</option>
          <option value="slideshow">slideshow</option>
        </select>

        <button onClick={()=>load(true)} className="px-3 py-1 rounded bg-sky-600 hover:bg-sky-500">
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
                src={it.url}
                alt={`snap-${i}`}
                className={`absolute inset-0 w-full h-full object-contain transition-opacity duration-700 ${i===idx ? "opacity-100" : "opacity-0"}`}
                draggable={false}
              />
            ))}
            {!items.length && (
              <div className="absolute inset-0 grid place-items-center text-slate-400">
                {loading ? "Завантаження…" : "Немає знімків. Увімкни ▶️ Слайд-шоу у Vision — і кадри з’являться тут."}
              </div>
            )}
          </div>
        </div>
      </section>

      {current && (
        <footer className="p-3 text-center text-xs text-slate-400">
          room: <span className="text-slate-300">{roomId}</span> • {new Date(current.created_at).toLocaleString()} • кадр {idx+1}/{items.length}
        </footer>
      )}
    </main>
  );
}
