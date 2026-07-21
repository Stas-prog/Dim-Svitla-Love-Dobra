"use client";
import { useMemo } from "react";

export default function ThroughEarthRoom() {
  const src = useMemo(() => {
    const u = process.env.NEXT_PUBLIC_THROUGH_EARTH_URL || "";
    return u.endsWith("/") ? u.slice(0, -1) : u;
  }, []);

  return (
    <main className="min-h-screen bg-slate-900 text-slate-50 p-4 sm:p-6">
      <div className="mx-auto max-w-6xl">
        <header className="mb-4 flex items-center gap-3">
          <h1 className="text-2xl font-bold">🌏 Кімната крізь Землю</h1>
          {src && (
            <a
              href={src}
              target="_blank"
              rel="noopener noreferrer"
              className="ml-auto inline-flex items-center gap-2 rounded-lg bg-sky-600 px-3 py-1.5 text-sm font-semibold text-white hover:bg-sky-500"
            >
              Відкрити окремо ↗
            </a>
          )}
        </header>

        {!src ? (
          <div className="rounded-xl border border-slate-700 bg-slate-800 p-4 text-slate-300">
            Не задано <code className="text-sky-300">NEXT_PUBLIC_THROUGH_EARTH_URL</code>.
          </div>
        ) : (
          <div className="rounded-xl border border-slate-700 bg-slate-800 overflow-hidden">
            <iframe
              title="Through Earth Room"
              src={src}
              className="w-full"
              style={{ minHeight: "90vh", border: "0" }}
              // за потреби додай/звузь дозволи всередині iFrame:
              sandbox="allow-same-origin allow-scripts allow-popups allow-forms"
              allow="clipboard-read; clipboard-write"
            />
          </div>
        )}
      </div>
    </main>
  );
}
