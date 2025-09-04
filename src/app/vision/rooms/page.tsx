"use client";
import React, { useEffect, useState } from "react";
import Link from "next/link";

type Room = { roomId: string; lastAt: string; coverUrl: string; count: number };

export default function RoomsPage() {
  const [rooms, setRooms] = useState<Room[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const r = await fetch("/api/rooms", { cache: "no-store" });
        const j = await r.json();
        if (alive && j.ok) setRooms(j.rooms || []);
      } catch {}
      finally { if (alive) setLoading(false); }
    })();
    return () => { alive = false; };
  }, []);

  return (
    <main className="max-w-5xl mx-auto p-4 sm:p-6">
      <h1 className="text-2xl font-semibold mb-4">🗂 Rooms & Gallery</h1>
      {loading && <div className="text-slate-400">Loading…</div>}
      {!loading && rooms.length === 0 && <div className="text-slate-400">Порожньо.</div>}

      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {rooms.map(r => (
          <Link
            key={r.roomId}
            href={`/snaps/${encodeURIComponent(r.roomId)}`}
            className="block rounded-xl overflow-hidden border border-slate-700 hover:border-sky-400 transition-colors"
          >
            <div className="aspect-video bg-slate-800">
              {/* простий <img> щоб не морочити next/image доменами */}
              {r.coverUrl ? (
                <img
                  src={r.coverUrl}
                  alt={r.roomId}
                  className="w-full h-full object-cover"
                  referrerPolicy="no-referrer"
                />
              ) : null}
            </div>
            <div className="p-3">
              <div className="font-semibold">{r.roomId}</div>
              <div className="text-xs text-slate-400">
                {new Date(r.lastAt).toLocaleString()} • {r.count} фото
              </div>
            </div>
          </Link>
        ))}
      </div>
    </main>
  );
}
