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

type FromRole = "host" | "viewer";

export async function GET(req: Request) {
    const url = new URL(req.url);
    const roomId = url.searchParams.get("roomId");
    if (!roomId) return NextResponse.json({ error: "roomId required" }, { status: 400 });

    const db = await getDb();
    const col = db.collection<RoomDoc>("webrtc_rooms");
    const doc = await col.findOne(
        { _id: roomId } as Filter<RoomDoc>,
        { projection: { hostCandidates: 1, viewerCandidates: 1, updatedAt: 1 } }
    );
    return NextResponse.json({
        hostCandidates: doc?.hostCandidates ?? [],
        viewerCandidates: doc?.viewerCandidates ?? [],
        updatedAt: doc?.updatedAt ?? null,
    });
}

export async function POST(req: Request) {
    const { roomId, from, candidate } = (await req.json()) as {
        roomId: string;
        from: FromRole;
        candidate: any;
    };
    if (!roomId || (from !== "host" && from !== "viewer") || !candidate) {
        return NextResponse.json({ error: "roomId, from, candidate required" }, { status: 400 });
    }

    const db = await getDb();
    const col = db.collection<RoomDoc>("webrtc_rooms");
    const field = from === "host" ? "hostCandidates" : "viewerCandidates";

    await col.updateOne(
        { _id: roomId } as Filter<RoomDoc>,
        { $push: { [field]: candidate }, $set: { updatedAt: new Date().toISOString() } },
        { upsert: true }
    );

    return NextResponse.json({ ok: true });
}
