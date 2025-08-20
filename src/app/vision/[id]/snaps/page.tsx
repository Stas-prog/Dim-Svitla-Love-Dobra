import { getDb } from "@/lib/mongo";

export const dynamic = "force-dynamic";

type Params = { id: string };

export default async function VisionSnapsPage({ params }: { params: Promise<Params> }) {
    const { id } = await params;

    const db = await getDb();
    const items = await db
        .collection("vision_snapshots")
        .find({ roomId: id })
        .sort({ createdAt: -1 })
        .limit(24)
        .toArray();

    // перетворимо у dataURL для <img>
    const mapped = items.map((it: any) => ({
        _id: it._id.toString(),
        createdAt: it.createdAt,
        dataUrl: `data:${it.contentType};base64,${Buffer.from(it.bytes).toString("base64")}`,
    }));

    return (
        <main className="min-h-screen bg-slate-950 text-slate-50 p-6">
            <div className="max-w-6xl mx-auto">
                <h1 className="text-2xl font-bold mb-4">🖼️ Snaps for room: {id}</h1>
                {mapped.length === 0 ? (
                    <div className="opacity-70">Поки що немає знімків. Натисни «📸 Зробити фото в Mongo» у Vision.</div>
                ) : (
                    <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-3">
                        {mapped.map((m) => (
                            <div key={m._id} className="rounded-xl overflow-hidden bg-slate-900 border border-slate-800">
                                <img src={m.dataUrl} className="w-full h-auto" alt={m.createdAt} />
                                <div className="p-2 text-xs opacity-70">{m.createdAt}</div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </main>
    );
}
