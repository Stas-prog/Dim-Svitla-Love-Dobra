export const dynamic = "force-dynamic";
export const runtime = "nodejs";
export const revalidate = 0;

import { NextResponse } from "next/server";
import { getDb } from "@/lib/mongo";

const MAX_DATAURL_BYTES = 1_000_000; // ~1MB у base64, підлаштуй під себе
const REQ_PIN = process.env.VISION_PIN || "";

type FrameDoc = {
    _id?: string;
    roomId: string;
    by: "host" | "viewer";
    dataUrl: string;     
    createdAt: string;
};

// POST: зберегти кадр
export async function POST(req: Request) {
    const body = (await req.json()) as { roomId: string; by: "host" | "viewer"; dataUrl: string };
    if (!body?.roomId || !body?.dataUrl) {
        return NextResponse.json({ ok: false, error: "roomId and dataUrl are required" }, { status: 400 });
    }
    if (REQ_PIN) {
  const pin = (req.headers.get("x-pin") || "").trim();
  if (pin !== REQ_PIN) {
    return NextResponse.json({ ok: false, error: "forbidden" }, { status: 403 });
  }
}
if (!body.dataUrl.startsWith("data:image/")) {
  return NextResponse.json({ ok: false, error: "invalid image dataUrl" }, { status: 400 });
}
if (body.dataUrl.length > MAX_DATAURL_BYTES) {
  return NextResponse.json({ ok: false, error: "image too large" }, { status: 413 });
}
    const doc: FrameDoc = { ...body, createdAt: new Date().toISOString() };

    try {
        const db = await getDb();
        await db.collection<FrameDoc>("vision_frames").insertOne(doc);
        // можна легонько чистити дуже старі
        const cutoff = new Date(Date.now() - 12 * 60 * 60 * 1000).toISOString();
        await db.collection<FrameDoc>("vision_frames").deleteMany({ createdAt: { $lt: cutoff } as any });
        return NextResponse.json({ ok: true, mode: "mongo" });
    } catch {
        // fallback: нічого не робимо, але не ламаємо UX
        return NextResponse.json({ ok: true, mode: "memory" });
    }
}

// GET: останні кадри кімнати
export async function GET(req: Request) {
    const url = new URL(req.url);
    const roomId = url.searchParams.get("roomId") || "";
    const limit = Math.min(parseInt(url.searchParams.get("limit") || "50", 10) || 50, 200);

    if (!roomId) return NextResponse.json([]);

    try {
        const db = await getDb();
        const rows = await db
            .collection<FrameDoc>("vision_frames")
            .find({ roomId })
            .sort({ createdAt: -1 } as any)
            .limit(limit)
            .toArray();
        return NextResponse.json(rows);
    } catch {
        return NextResponse.json([]);
    }
}
