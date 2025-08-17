export const dynamic = "force-dynamic";
export const runtime = "nodejs";
export const revalidate = 0;

import { NextResponse } from "next/server";
import { getDb } from "@/lib/mongo";
import type { Filter } from "mongodb";

type RoomDoc = {
    _id: string;
    offer?: any;
    answer?: any;
    hostCandidates?: any[];
    viewerCandidates?: any[];
    createdAt: string;
    updatedAt: string;
};

export async function GET(req: Request) {
    const url = new URL(req.url);
    const roomId = url.searchParams.get("roomId");
    if (!roomId) return NextResponse.json({ error: "roomId required" }, { status: 400 });

    const db = await getDb();
    const col = db.collection<RoomDoc>("webrtc_rooms");
    const doc = await col.findOne(
        { _id: roomId } as Filter<RoomDoc>,
        { projection: { offer: 1 } }
    );
    return NextResponse.json({ offer: doc?.offer ?? null });
}

export async function POST(req: Request) {
    const { roomId, offer } = await req.json();
    if (!roomId || !offer) {
        return NextResponse.json({ error: "roomId & offer required" }, { status: 400 });
    }

    const db = await getDb();
    const col = db.collection<RoomDoc>("webrtc_rooms");
    await col.updateOne(
        { _id: roomId } as Filter<RoomDoc>,
        { $set: { offer, updatedAt: new Date().toISOString() } },
        { upsert: true }
    );
    return NextResponse.json({ ok: true });
}
