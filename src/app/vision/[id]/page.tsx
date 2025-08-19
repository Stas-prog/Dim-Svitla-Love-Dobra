export const dynamic = "force-dynamic";

import { use } from "react";
import Vision from "@/components/Vision";

export default function VisionWithIdPage({
    params,
    searchParams,
}: {
    params: Promise<{ id: string }>;
    searchParams: Promise<{ mode?: "host" | "viewer" }>;
}) {
    const p = use(params);
    const sp = use(searchParams);
    const initialMode = (sp.mode === "viewer" || sp.mode === "host") ? sp.mode : "viewer";

    return (
        <main className="min-h-screen bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950 p-6 text-white">
            <h1 className="text-2xl font-bold">🔗 Vision з посиланням</h1>
            <p className="text-slate-300 mb-4">
                Кімната: <span className="font-mono">{p.id}</span> — режим: <b>{initialMode}</b>
            </p>
            <Vision initialMode={initialMode} initialRoomId={p.id} />
        </main>
    );
}
