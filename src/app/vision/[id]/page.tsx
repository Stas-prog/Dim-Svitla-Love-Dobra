import React from "react";
import Vision from "@/components/Vision";
import '../vision-theme.css'

export default function VisionRoomPage({
    params,
    searchParams,
}: {
    params: Promise<{ id: string }>;
    searchParams: Promise<{ mode?: string }>;
}) {
    const p = React.use(params);
    const sp = React.use(searchParams);

    const id = p.id;
    const initialMode = sp.mode === "host" || sp.mode === "viewer" ? (sp.mode as "host" | "viewer") : "viewer";

    return (
        <main className="vision-ui min-h-screen bg-slate-950 text-slate-100">
            <div className="max-w-5xl mx-auto p-4 sm:p-6">
                <h1 className="text-2xl font-bold mb-3">🔗 Vision (room: {id})</h1>
                <Vision initialRoomId={id} initialMode={initialMode} />
            </div>
        </main>
    );
}
