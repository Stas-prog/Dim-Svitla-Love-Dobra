"use client";
import React, { useEffect, useState } from "react";
type Slide = { _id:string; roomId:string; url:string; createdAt?:string };

export default function Decryptor() {
  const [roomId,setRoomId] = useState("");
  const [slides,setSlides] = useState<Slide[]>([]);

  useEffect(()=>{
    if (!roomId) { setSlides([]); return; }
    let alive = true;
    (async ()=>{
      const r = await fetch(`/api/slides?roomId=${encodeURIComponent(roomId)}&limit=120`, { cache:"no-store" });
      const j = await r.json();
      if (alive) setSlides(j.items||[]);
    })();
    const t = setInterval(async ()=>{
      try {
        const r = await fetch(`/api/slides?roomId=${encodeURIComponent(roomId)}&limit=120`, { cache:"no-store" });
        const j = await r.json();
        setSlides(j.items||[]);
      } catch {}
    }, 4000);
    return ()=>{ alive=false; clearInterval(t); };
  },[roomId]);

  return (
    <main className="max-w-6xl mx-auto p-4 sm:p-6">
      <h1 className="text-xl font-semibold mb-4">🔎 Дешефратор</h1>
      <input
        className="w-full max-w-md rounded bg-slate-900 border border-slate-600 px-3 py-2"
        placeholder="Введи roomId"
        value={roomId}
        onChange={e=>setRoomId(e.target.value.trim())}
      />
      <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {slides.map(s=>(
          <a key={s._id} href={s.url} target="_blank" rel="noopener noreferrer"
             className="block rounded-xl overflow-hidden border border-slate-700 hover:border-emerald-400">
            <div className="aspect-video bg-slate-800">
              <img src={s.url} alt={s.roomId} className="w-full h-full object-cover" />
            </div>
            <div className="p-2 text-xs text-slate-300">{s.createdAt ? new Date(s.createdAt).toLocaleString() : ""}</div>
          </a>
        ))}
      </div>
    </main>
  );
}
