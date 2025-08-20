export const dynamic = "force-dynamic";
export const runtime = "nodejs";
export const revalidate = 0;

import { NextResponse } from "next/server";
import { getDb } from "@/lib/mongo";

type IceDoc = {
    _id?: string;
    roomId: string;
    from: string; // хто надіслав
    ice: {
        type: "candidate";
        candidate: RTCIceCandidateInit;
    };
    createdAt: string;
};

// --- in-memory fallback ---
const mem = {
    ices: [] as IceDoc[],
};

async function tryDb<T>(fn: () => Promise<T>): Promise<T | null> {
    try { return await fn(); } catch { return null; }
}

// POST: зберегти один ICE-кандидат
export async function POST(req: Request) {
    const body = await req.json() as Partial<IceDoc> & {
        roomId: string;
        from: string;
        ice: { type: "candidate"; candidate: RTCIceCandidateInit };
    };

    const doc: IceDoc = {
        roomId: body.roomId,
        from: body.from,
        ice: body.ice,
        createdAt: new Date().toISOString(),
    };

    const ok = await tryDb(async () => {
        const db = await getDb();
        await db.collection<IceDoc>("webrtc_ice").insertOne(doc);
        return true;
    });

    if (!ok) {
        mem.ices.push(doc);
    }

    return NextResponse.json({ ok: true, mode: ok ? "mongo" : "memory" });
}

// GET: віддати всі ICE для кімнати, КРІМ тих, що надіслав я (from!=me)
export async function GET(req: Request) {
    const url = new URL(req.url);
    const roomId = url.searchParams.get("roomId") || "";
    const me = url.searchParams.get("from") || ""; // мій clientId

    // Mongo спроба
    const got = await tryDb(async () => {
        const db = await getDb();
        const q: any = { roomId };
        if (me) q.from = { $ne: me };
        // віддаємо тільки масив {type:'candidate', candidate:{...}}
        const rows = await db.collection<IceDoc>("webrtc_ice")
            .find(q)
            .sort({ _id: 1 })
            .limit(200)
            .toArray();

        // після видачі — видаляємо, щоб не повторювались
        if (rows.length) {
            const ids = rows.map(r => r._id).filter(Boolean);
            if (ids.length) {
                // @ts-ignore
                await db.collection<IceDoc>("webrtc_ice").deleteMany({ _id: { $in: ids } });
            }
        }
        return rows.map(r => r.ice);
    });

    if (got) return NextResponse.json(got);

    // memory fallback
    const arr = mem.ices.filter(x => x.roomId === roomId && (!me || x.from !== me));
    // прибираємо видані
    mem.ices = mem.ices.filter(x => !(x.roomId === roomId && (!me || x.from !== me)));
    return NextResponse.json(arr.map(r => r.ice));
}
