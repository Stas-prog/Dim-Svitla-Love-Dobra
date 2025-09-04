import { NextResponse } from "next/server";
import { getDb } from "@/lib/mongo";

export async function POST(req: Request) {
  const { roomId, from, ice } = await req.json();
  if (!roomId || !from || !ice) return NextResponse.json({ ok:false, error:"bad request" }, { status:400 });

  const db = await getDb();
  await db.collection("webrtc_candidates").insertOne({
    roomId, from, ice, createdAt: new Date().toISOString()
  });
  return NextResponse.json({ ok: true });
}

export async function GET(req: Request) {
  const url = new URL(req.url);
  const roomId = url.searchParams.get("roomId") || "";
  const from = url.searchParams.get("from") || "";
  if (!roomId || !from) return NextResponse.json([], { status: 400 });

  const db = await getDb();
  // беремо всі кандидати від ІНШИХ і одразу видаляємо їх
  const items = await db
    .collection("webrtc_candidates")
    .find({ roomId, from: { $ne: from } })
    .sort({ createdAt: 1 })
    .toArray();

  if (items.length) {
    const ids = items.map((x) => x._id);
    await db.collection("webrtc_candidates").deleteMany({ _id: { $in: ids } as any });
  }

  return NextResponse.json(items.map(i => i.ice));
}
