export const dynamic = "force-dynamic";
export const runtime = "nodejs";
export const revalidate = 0;

import { NextResponse } from "next/server";
import { getDb } from "@/lib/mongo";

type SignalDoc = {
    // Mongo сам зробить ObjectId, ми НІДЕ не фільтруємо по _id — тільки по room
    room: string;             // ідентифікатор кімнати
    senderId: string;         // клієнт, що надіслав сигнал
    data: any;                // blob від simple-peer (offer/answer/ice)
    ts: string;               // ISO timestamp
};

// GET /api/webrtc/signal?room=ROOM&since=ISO(optional)
// Повертає масив сигналів у кімнаті, новіші за `since` (або всі, якщо since нема)
export async function GET(req: Request) {
    const url = new URL(req.url);
    const room = url.searchParams.get("room") || "";
    const since = url.searchParams.get("since");

    if (!room) {
        return NextResponse.json({ ok: false, error: "room is required" }, { status: 400 });
    }

    const db = await getDb();
    const col = db.collection<SignalDoc>("webrtc_signal");

    const filter: any = { room };
    if (since) {
        filter.ts = { $gt: since };
    }

    const items = await col.find(filter).sort({ ts: 1 }).limit(500).toArray();
    return NextResponse.json({ ok: true, items });
}

// POST /api/webrtc/signal
// body: { room: string, senderId: string, data: any }
export async function POST(req: Request) {
    const body = await req.json().catch(() => null) as Partial<SignalDoc> | null;
    if (!body || !body.room || !body.senderId || body.data == null) {
        return NextResponse.json({ ok: false, error: "room, senderId, data required" }, { status: 400 });
    }

    const db = await getDb();
    const col = db.collection<SignalDoc>("webrtc_signal");

    const doc: SignalDoc = {
        room: body.room,
        senderId: body.senderId,
        data: body.data,
        ts: new Date().toISOString(),
    };

    await col.insertOne(doc);
    return NextResponse.json({ ok: true });
}
