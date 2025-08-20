export const dynamic = "force-dynamic";
export const runtime = "nodejs";
export const revalidate = 0;

import { NextResponse } from "next/server";
import { getDb } from "@/lib/mongo";

type Sdp = { type: "offer" | "answer"; sdp: string };

type OfferDoc = {
    _id?: string;
    roomId: string;
    from: string;         // hostId
    sdp: Sdp;             // {type:"offer", sdp:"..."}
    createdAt: string;
};

// in-memory fallback
const mem = { offers: [] as OfferDoc[] };

async function tryDb<T>(fn: () => Promise<T>): Promise<T | null> {
    try { return await fn(); } catch { return null; }
}

export async function POST(req: Request) {
    const body = await req.json() as { roomId: string; from: string; offer: Sdp };
    const doc: OfferDoc = {
        roomId: body.roomId,
        from: body.from,
        sdp: body.offer,
        createdAt: new Date().toISOString(),
    };

    const ok = await tryDb(async () => {
        const db = await getDb();
        await db.collection<OfferDoc>("webrtc_offers").deleteMany({ roomId: doc.roomId });
        await db.collection<OfferDoc>("webrtc_offers").insertOne(doc);
        return true;
    });

    if (!ok) {
        mem.offers = mem.offers.filter(o => o.roomId !== doc.roomId);
        mem.offers.push(doc);
    }

    return NextResponse.json({ ok: true, mode: ok ? "mongo" : "memory" });
}

export async function GET(req: Request) {
    const url = new URL(req.url);
    const roomId = url.searchParams.get("roomId") || "";

    const got = await tryDb(async () => {
        const db = await getDb();
        return await db.collection<OfferDoc>("webrtc_offers").findOne({ roomId });
    });

    if (got) return NextResponse.json(got);

    const m = mem.offers.find(o => o.roomId === roomId) || null;
    return NextResponse.json(m ?? {});
}
