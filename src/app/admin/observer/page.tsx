"use client";
import { useEffect, useState } from "react";

type Resp = {
    ok: boolean; at: string;
    house?: { theme?: string; motd?: string; updatedAt?: string } | null;
    settings?: any | null;
    lease?: { holderId?: string; until?: string; updatedAt?: string } | null;
    state?: {
        _id: string; instId?: string; tf?: string;
        sim?: { cashUSDT: number; equityUSDT: number; position: any; tradesCount: number; lastClosedTs: number | null } | null;
        candlesCount?: number; updatedAt?: string | null;
    } | null;
};

export default function ObserverPage() {
    const [data, setData] = useState<Resp | null>(null);
    const [tick, setTick] = useState(0);

    useEffect(() => {
        let stop = false;
        (async () => {
            try {
                const r = await fetch("/api/public/status", { cache: "no-store" });
                const j = await r.json();
                if (!stop) setData(j);
            } catch { }
        })();
        const id = setInterval(() => setTick(t => t + 1), 15000);
        return () => { stop = true; clearInterval(id); };
    }, [tick]);

    return (
        <main className="p-4 space-y-4">
            <h1 className="text-xl font-semibold">Observer</h1>
            {!data ? (
                <div className="text-slate-500">Завантаження…</div>
            ) : (
                <div className="grid gap-4 md:grid-cols-2">
                    <section className="rounded-xl bg-white/70 p-3">
                        <div className="text-sm text-slate-500">House</div>
                        <pre className="text-xs whitespace-pre-wrap">{JSON.stringify(data.house, null, 2)}</pre>
                    </section>
                    <section className="rounded-xl bg-white/70 p-3">
                        <div className="text-sm text-slate-500">Settings</div>
                        <pre className="text-xs whitespace-pre-wrap">{JSON.stringify(data.settings, null, 2)}</pre>
                    </section>
                    <section className="rounded-xl bg-white/70 p-3">
                        <div className="text-sm text-slate-500">Lease</div>
                        <pre className="text-xs whitespace-pre-wrap">{JSON.stringify(data.lease, null, 2)}</pre>
                    </section>
                    <section className="rounded-xl bg-white/70 p-3">
                        <div className="text-sm text-slate-500">State</div>
                        <pre className="text-xs whitespace-pre-wrap">{JSON.stringify(data.state, null, 2)}</pre>
                    </section>
                </div>
            )}
            <div className="text-xs text-slate-400">Last fetch: {data?.at ?? "—"}</div>
        </main>
    );
}
