export const dynamic = "force-dynamic";

type Snap = {
    _id: string;
    roomId: string;
    image: string;       // data URL (image/jpeg або png)
    createdAt: string;
};

async function getSnaps(roomId: string): Promise<Snap[]> {
    const url =
        `${process.env.NEXT_PUBLIC_BASE_URL ?? ""}/api/snaps?roomId=${encodeURIComponent(roomId)}`;
    const res = await fetch(url, { cache: "no-store" });
    if (!res.ok) return [];
    const j = (await res.json()) as Snap[] | any;
    return Array.isArray(j) ? j : [];
}

export default async function RoomSnapsPage({ params }: { params: Promise<{ roomId: string }> }) {
    const { roomId } = await params;
    const snaps = await getSnaps(roomId);

    return (
        <main className="min-h-screen p-6 bg-slate-900 text-slate-50">
            <div className="max-w-6xl mx-auto">
                <h1 className="text-2xl font-bold mb-2">🖼 Фото кімнати</h1>
                <div className="font-mono text-xs break-all text-slate-300 mb-6">{roomId}</div>

                {snaps.length === 0 ? (
                    <div className="text-slate-300 text-sm">Немає збережених фото для цієї кімнати.</div>
                ) : (
                    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                        {snaps.map((s) => (
                            <div
                                key={s._id}
                                className="rounded-lg overflow-hidden border border-slate-700 bg-slate-800"
                            >
                                <img src={s.image} alt="snap" className="w-full h-auto block" />
                                <div className="p-2 text-[11px] text-slate-300 border-t border-slate-700">
                                    {s.createdAt}
                                </div>
                            </div>
                        ))}
                    </div>
                )}

                <div className="mt-6">
                    <a href="/snaps" className="text-sky-300 underline text-sm">
                        ← До списку кімнат
                    </a>
                </div>
            </div>
        </main>
    );
}
