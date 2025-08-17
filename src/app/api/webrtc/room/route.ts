export const dynamic = "force-dynamic";
export const runtime = "nodejs";
export const revalidate = 0;

import { NextResponse } from "next/server";
import { getDb } from "@/lib/mongo";
import type { Filter } from "mongodb";

type RoomDoc = {
    _id: string; // roomId як РЯДОК
    offer?: any;
    answer?: any;
    hostCandidates?: any[];
    viewerCandidates?: any[];
    createdAt: string;
    updatedAt: string;
};

export async function GET(req: Request) {
    const url = new URL(req.url);
    const id = url.searchParams.get("id");
    if (!id) return NextResponse.json({ error: "id required" }, { status: 400 });

    const db = await getDb();
    const col = db.collection<RoomDoc>("webrtc_rooms");
    const doc = await col.findOne({ _id: id } as Filter<RoomDoc>);
    return NextResponse.json(doc ?? {});
}

export async function POST(req: Request) {
    const body = (await req.json()) as { roomId?: string };
    const roomId =
        (body?.roomId || "").trim() ||
        Math.random().toString(36).slice(2, 8).toUpperCase();

    const now = new Date().toISOString();
    const db = await getDb();
    const col = db.collection<RoomDoc>("webrtc_rooms");

    const base: RoomDoc = {
        _id: roomId,
        offer: undefined,
        answer: undefined,
        hostCandidates: [],
        viewerCandidates: [],
        createdAt: now,
        updatedAt: now,
    };

    await col.updateOne(
        { _id: roomId } as Filter<RoomDoc>,
        { $setOnInsert: base, $set: { updatedAt: now } },
        { upsert: true }
    );

    const doc = await col.findOne({ _id: roomId } as Filter<RoomDoc>);
    return NextResponse.json({ ok: true, room: doc });
}
