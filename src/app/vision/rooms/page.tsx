export const runtime = "nodejs";
export const revalidate = 0;

import Link from "next/link";

type RecentRoom = { roomId: string; lastSeen: string };

async function fetchRooms(): Promise<RecentRoom[]> {
    const r = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL ?? ""}/api/vision/rooms?limit=200`, {
        cache: "no-store",
    }).catch(() => null);
    if (!r || !r.ok) return [];
    const j = await r.json().catch(() => ({}));
    return Array.isArray(j?.items) ? (j.items as RecentRoom[]) : [];
}

export default async function RoomsPage() {
    const items = await fetchRooms();

    return (
        <main className="min-h-screen vision-ui bg-gradient-to-b from-orange-100 to-blue-100 text-slate-900">
            <div className="max-w-5xl mx-auto p-4 sm:p-6">
                <h1 className="text-2xl font-bold mb-4">🗂 Recent rooms</h1>

                <div className="mb-4">
                    <Link
                        href="/vision?mode=host"
                        className="inline-block px-3 py-2 rounded bg-emerald-600 text-white hover:bg-emerald-700"
                    >
                        ⤴︎ Back to Vision
                    </Link>
                </div>

                {items.length === 0 ? (
                    <div className="text-sm text-slate-600">
                        Поки що порожньо. Створи кімнату та зроби фото у <b>Vision</b>.
                    </div>
                ) : (
                    <ul className="grid gap-3 sm:grid-cols-2">
                        {items.map((r) => (
                            <li key={r.roomId} className="rounded-lg border border-slate-300 bg-white p-3 flex flex-col gap-2">
                                <div className="font-mono text-xs break-all">{r.roomId}</div>
                                <div className="text-[11px] text-slate-500">last seen: {r.lastSeen}</div>
                                <div className="flex gap-2">
                                    <Link
                                        href={`/vision/${encodeURIComponent(r.roomId)}/snaps`}
                                        className="px-3 py-1 rounded bg-purple-600 text-white text-sm hover:bg-purple-700"
                                    >
                                        📷 Переглянути фото
                                    </Link>
                                    <Link
                                        href={`/vision?mode=viewer&roomId=${encodeURIComponent(r.roomId)}`}
                                        className="px-3 py-1 rounded bg-sky-600 text-white text-sm hover:bg-sky-700"
                                    >
                                        👁️ Перейти як viewer
                                    </Link>
                                </div>
                            </li>
                        ))}
                    </ul>
                )}
            </div>
        </main>
    );
}
