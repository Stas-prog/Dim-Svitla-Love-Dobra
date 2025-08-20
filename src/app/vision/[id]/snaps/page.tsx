export const dynamic = "force-dynamic";

import { getDb } from "@/lib/mongo";

type SnapshotDoc = {
    _id?: string;
    roomId: string;
    by: string;
    imageDataUrl: string;
    createdAt: string;
};

export default async function SnapsPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = await params;

    const db = await getDb();
    const items = await db
        .collection<SnapshotDoc>("vision_snaps")
        .find({ roomId: id })
        .sort({ createdAt: -1 })
        .limit(200)
        .toArray();

    return (
        <main className="min-h-screen p-4 sm:p-6 bg-gradient-to-b from-amber-50 to-sky-50">
            <div className="max-w-6xl mx-auto">
                <h1 className="text-xl sm:text-2xl font-bold mb-4">
                    📷 Snaps for room: <span className="font-mono">{id}</span>
                </h1>

                {items.length === 0 && (
                    <div className="text-slate-500">Поки немає фото. Зроби перший снапшот зі сторінки Vision.</div>
                )}

                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                    {items.map((snap) => (
                        <div key={String(snap._id)} className="rounded-xl p-2 border border-slate-300 bg-white shadow-sm">
                            <img
                                src={snap.imageDataUrl}
                                alt={snap.createdAt}
                                className="w-full h-auto rounded-lg"
                                loading="lazy"
                                decoding="async"
                            />
                            <div className="text-xs text-slate-600 mt-1">
                                {snap.createdAt}
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </main>
    );
}
