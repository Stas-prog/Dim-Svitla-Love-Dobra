"use client";
import React, { useEffect, useState } from "react";

type Room = { roomId:string; path:string; lastUploadedAt?:string|null };

export default function RoomsPage() {
  const [rooms,setRooms] = useState<Room[]>([]);
  const [loading,setLoading] = useState(true);

  useEffect(()=>{
    let alive = true;
    (async ()=>{
      const r = await fetch("/api/vision/rooms", { cache:"no-store" });
      const j = await r.json();
      if (alive) { setRooms(j.items||[]); setLoading(false); }
    })();
    const t = setInterval(async ()=>{
      try {
        const r = await fetch("/api/vision/rooms", { cache:"no-store" });
        const j = await r.json();
        setRooms(j.items||[]);
      } catch {}
    }, 8000);
    return ()=>{ alive=false; clearInterval(t); };
  },[]);

  return (
    <main className="max-w-5xl mx-auto p-4 sm:p-6">
      <h1 className="text-xl font-semibold mb-4">🗂 Rooms</h1>
      {loading && <div className="text-slate-400">Loading…</div>}
      {!loading && rooms.length===0 && <div className="text-slate-400">Поки порожньо.</div>}
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {rooms.map((r,i)=>(
          <a key={i} href={`/snaps/${encodeURIComponent(r.roomId)}`}
             className="rounded-xl border border-slate-700 hover:border-emerald-400 p-3 block">
            <div className="font-medium">{r.roomId}</div>
            <div className="text-xs text-slate-400">{r.lastUploadedAt ? new Date(r.lastUploadedAt).toLocaleString() : "—"}</div>
          </a>
        ))}
      </div>
    </main>
  );
}
