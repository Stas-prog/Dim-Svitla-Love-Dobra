export const dynamic = "force-dynamic";
export const runtime = "nodejs";
export const revalidate = 0;

import { NextResponse } from "next/server";
import { getDb } from "@/lib/mongo";

export async function POST(req: Request) {
  const { roomId, offer, from } = await req.json().catch(() => ({}));
  if (!roomId || !offer || !from) return NextResponse.json({ ok:false, error:"bad body" }, { status:400 });

  const db = await getDb();
  await db.collection("webrtc_offers").insertOne({
    roomId, from, sdp: offer, createdAt: new Date().toISOString(),
  });
  return NextResponse.json({ ok:true });
}

export async function GET(req: Request) {
  const url = new URL(req.url);
  const roomId = url.searchParams.get("roomId") || "";
  if (!roomId) return NextResponse.json({}, { status:400 });

  const db = await getDb();
  // беремо найсвіжіший offer (НЕ видаляємо — хай кілька viewer можуть під’єднатись)
  const doc = await db.collection("webrtc_offers")
    .find({ roomId })
    .sort({ createdAt: -1 })
    .limit(1)
    .toArray();

  return NextResponse.json(doc[0] || {});
}
