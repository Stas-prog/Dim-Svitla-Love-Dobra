"use client";

import { useEffect, useState } from "react";

type Snap = {
    _id?: string;
    by?: string;
    from?: "host" | "viewer";
    dataUrl: string;
    createdAt: string;
};

export default function SnapsPage() {
    const [items, setItems] = useState<Snap[]>([]);
    const [loading, setLoading] = useState(true);

    async function load() {
        setLoading(true);
        try {
            const r = await fetch("/api/vision/snap", { cache: "no-store" });
            const rows = await r.json();
            setItems(rows);
        } catch {
            // ignore
        } finally {
            setLoading(false);
        }
    }

    useEffect(() => { load(); }, []);

    return (
        <main className="min-h-screen p-6 sm:p-10 bg-slate-900 text-white">
            <div className="flex items-center justify-between">
                <h1 className="text-2xl font-bold mb-4">🖼️ Останні фото</h1>
                <button className="px-3 py-2 rounded bg-blue-600 hover:bg-blue-500" onClick={load}>⟳ Оновити</button>
            </div>

            {loading ? (
                <div className="opacity-80">Завантаження…</div>
            ) : items.length === 0 ? (
                <div className="opacity-80">Поки що немає фото…</div>
            ) : (
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                    {items.map((s) => (
                        <figure key={s._id} className="rounded-xl overflow-hidden bg-black/40">
                            <img src={s.dataUrl} alt="snap" className="w-full h-auto block" />
                            <figcaption className="p-2 text-xs opacity-75">
                                {new Date(s.createdAt).toLocaleString()} • {s.from ?? "?"} • {s.by ?? ""}
                            </figcaption>
                        </figure>
                    ))}
                </div>
            )}
        </main>
    );
}
