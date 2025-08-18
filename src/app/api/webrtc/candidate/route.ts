export const dynamic = "force-dynamic";
export const runtime = "nodejs";
export const revalidate = 0;

import { NextResponse } from "next/server";
import { getDb } from "@/lib/mongo";

type CandDoc = {
    _id?: string;
    roomId: string;
    to: string;    // одержувач
    from: string;  // відправник
    candidate: RTCIceCandidateInit;
    createdAt: string;
};

// in-memory fallback (черга)
const mem = {
    candidates: [] as CandDoc[],
};

async function tryDb<T>(fn: () => Promise<T>): Promise<T | null> {
    try { return await fn(); } catch { return null; }
}

export async function POST(req: Request) {
    const body = (await req.json()) as CandDoc;
    const doc: CandDoc = { ...body, createdAt: new Date().toISOString() };

    const ok = await tryDb(async () => {
        const db = await getDb();
        await db.collection<CandDoc>("webrtc_candidates").insertOne(doc);
        return true;
    });

    if (!ok) {
        mem.candidates.push(doc);
    }

    return NextResponse.json({ ok: true, mode: ok ? "mongo" : "memory" });
}

// Отримати та ВИДАЛИТИ всі кандидати для (roomId,to)
export async function GET(req: Request) {
    const url = new URL(req.url);
    const roomId = url.searchParams.get("roomId") || "";
    const to = url.searchParams.get("to") || "";

    const got = await tryDb(async () => {
        const db = await getDb();
        const col = db.collection<CandDoc>("webrtc_candidates");
        const items = await col.find({ roomId, to }).sort({ createdAt: 1 }).toArray();
        if (items.length) {
            await col.deleteMany({ roomId, to });
        }
        return items;
    });

    if (got) return NextResponse.json(got);

    const list = mem.candidates.filter(c => c.roomId === roomId && c.to === to);
    mem.candidates = mem.candidates.filter(c => !(c.roomId === roomId && c.to === to));
    return NextResponse.json(list);
}
