export const dynamic = "force-dynamic";
export const runtime = "nodejs";
export const revalidate = 0;

import { NextResponse } from "next/server";
import { getDb } from "@/lib/mongo";

type OfferDoc = {
    _id?: string;
    roomId: string;
    from: string; // host id
    sdp: any;
    createdAt: string;
};

const mem = { offers: [] as OfferDoc[] };

async function tryDb<T>(fn: () => Promise<T>): Promise<T | null> {
    try {
        return await fn();
    } catch {
        return null;
    }
}

export async function POST(req: Request) {
    const body = (await req.json()) as { roomId: string; offer: any; from: string };
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
        mem.offers = mem.offers.filter((o) => o.roomId !== doc.roomId);
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

    if (got) return NextResponse.json({ sdp: got.sdp, from: got.from });

    const m = mem.offers.find((o) => o.roomId === roomId);
    return NextResponse.json(m ? { sdp: m.sdp, from: m.from } : {});
}
