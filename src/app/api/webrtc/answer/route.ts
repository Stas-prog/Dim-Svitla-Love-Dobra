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
        { projection: { answer: 1 } }
    );
    return NextResponse.json({ answer: doc?.answer ?? null });
}

export async function POST(req: Request) {
    const { roomId, answer } = await req.json();
    if (!roomId || !answer) {
        return NextResponse.json({ error: "roomId & answer required" }, { status: 400 });
    }

    const db = await getDb();
    const col = db.collection<RoomDoc>("webrtc_rooms");
    await col.updateOne(
        { _id: roomId } as Filter<RoomDoc>,
        { $set: { answer, updatedAt: new Date().toISOString() } },
        { upsert: true }
    );
    return NextResponse.json({ ok: true });
}
