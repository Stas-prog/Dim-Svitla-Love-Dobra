"use client";
import React, { useEffect, useState } from "react";

type Slide = {
  _id: string;
  roomId: string;
  url: string;
  caption?: string;
  createdAt?: string;
  width?: number;
  height?: number;
};

export default function RoomGallery({ params }: { params: Promise<{ roomId: string }>}) {
  const id = React.use(params);
  const roomId  = id.roomId;
  const [slides, setSlides] = useState<Slide[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const r = await fetch(`/api/slides?roomId=${encodeURIComponent(roomId)}&limit=90`, { cache: "no-store" });
        const j = await r.json();
        if (alive && j.ok) setSlides(j.items || []);
      } catch {}
      finally { if (alive) setLoading(false); }
    })();
    // авто-оновлення кожні 5с
    const t = setInterval(async () => {
      try {
        const r = await fetch(`/api/slides?roomId=${encodeURIComponent(roomId)}&limit=90`, { cache: "no-store" });
        const j = await r.json();
        if (j.ok) setSlides(j.items || []);
      } catch {}
    }, 5000);
    return () => { alive = false; clearInterval(t); };
  }, [roomId]);

  return (
    <main className="max-w-6xl mx-auto p-4 sm:p-6">
      <h1 className="text-xl font-semibold mb-4">🖼 Room: {roomId}</h1>
      {loading && <div className="text-slate-400">Loading…</div>}
      {!loading && slides.length === 0 && <div className="text-slate-400">У цій кімнаті поки немає фото.</div>}

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {slides.map((s) => (
          <a
            key={s._id}
            href={s.url}
            target="_blank"
            rel="noopener noreferrer"
            className="block rounded-xl overflow-hidden border border-slate-700 hover:border-emerald-400 transition-colors"
          >
            <div className="aspect-video bg-slate-800">
              <img
                src={s.url}
                alt={s.caption || s.roomId}
                className="w-full h-full object-cover"
                referrerPolicy="no-referrer"
              />
            </div>
            <div className="p-2 text-xs text-slate-300">
              {s.caption || "snap"} • {s.createdAt ? new Date(s.createdAt).toLocaleString() : ""}
            </div>
          </a>
        ))}
      </div>
    </main>
  );
}
