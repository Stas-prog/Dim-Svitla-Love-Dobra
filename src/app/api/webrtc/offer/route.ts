import { NextResponse } from "next/server";
import { getDb } from "@/lib/mongo";

export async function POST(req: Request) {
  const { roomId, offer, from } = await req.json();
  if (!roomId || !offer || !from) return NextResponse.json({ ok:false, error:"bad request" }, { status:400 });

  const db = await getDb();
  await db.collection("webrtc_offers").insertOne({
    roomId, from, sdp: offer, createdAt: new Date().toISOString()
  });

  return NextResponse.json({ ok: true });
}

export async function GET(req: Request) {
  const url = new URL(req.url);
  const roomId = url.searchParams.get("roomId") || "";
  if (!roomId) return NextResponse.json({}, { status: 400 });

  const db = await getDb();
  // віддаємо найсвіжіший offer і ОДРАЗУ видаляємо
  const doc = await db.collection("webrtc_offers").findOneAndDelete(
    { roomId },
    { sort: { createdAt: -1 } }
  );

  return NextResponse.json(doc?.value || {});
}
