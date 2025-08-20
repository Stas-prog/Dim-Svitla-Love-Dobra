export const dynamic = "force-dynamic";
export const runtime = "nodejs";
export const revalidate = 0;

import { NextResponse } from "next/server";
import { getDb } from "@/lib/mongo";

type OfferDoc = {
    _id?: string;
    roomId: string;
    from: string;     // host id
    sdp: { type: "offer"; sdp: string };
    createdAt: string;
};

// in-memory fallback
const mem = {
    offers: [] as OfferDoc[],
};

async function tryDb<T>(fn: () => Promise<T>): Promise<T | null> {
    try { return await fn(); } catch { return null; }
}

function normalizeOfferBody(body: any): OfferDoc {
    const roomId = String(body.roomId || "");
    const from = String(body.from || "");
    const raw = body.sdp ?? body.offer ?? body.payload ?? body;

    if (!raw || raw.type !== "offer" || typeof raw.sdp !== "string") {
        throw new Error("Invalid offer payload");
    }

    return {
        roomId,
        from,
        sdp: { type: "offer", sdp: raw.sdp },
        createdAt: new Date().toISOString(),
    };
}

export async function POST(req: Request) {
    const body = await req.json();
    const doc = normalizeOfferBody(body);

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
    return NextResponse.json(m ?? {}); // клієнт зобов'язаний перевірити форму!
}
