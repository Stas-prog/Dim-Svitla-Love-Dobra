import { NextResponse } from "next/server";
import { getDb } from "@/lib/mongo";
import { memStore } from "@/lib/wrtcStore";

export async function POST(req: Request) {
  const { roomId, from, ice } = await req.json().catch(() => ({}));
  if (!roomId || !from || !ice) return NextResponse.json({ ok:false }, { status:400 });

  try {
    const db = await getDb();
    await db.collection("webrtc_candidates").insertOne({ roomId, from, ice, createdAt:new Date().toISOString() });
    return NextResponse.json({ ok:true, mode:"mongo" });
  } catch {
    memStore.pushCand({ roomId, from, ice, createdAt:new Date().toISOString() });
    return NextResponse.json({ ok:true, mode:"memory" });
  }
}

export async function GET(req: Request) {
  const url = new URL(req.url);
  const roomId = url.searchParams.get("roomId") || "";
  const from = url.searchParams.get("from") || "";
  if (!roomId || !from) return NextResponse.json([], { status:400 });

  try {
    const db = await getDb();
    const items = await db
      .collection("webrtc_candidates")
      .find({ roomId, from: { $ne: from } })
      .sort({ createdAt: 1 })
      .toArray();
    if (items.length) {
      const ids = items.map(x => x._id);
      await db.collection("webrtc_candidates").deleteMany({ _id: { $in: ids } as any });
    }
    return NextResponse.json(items.map(i => i.ice));
  } catch {
    const mem = memStore.popCands(roomId, from);
    return NextResponse.json(mem.map(i => i.ice));
  }
}
