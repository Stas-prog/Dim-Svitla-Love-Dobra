export const dynamic = "force-dynamic";
export const runtime = "nodejs";
export const revalidate = 0;

import { NextResponse } from "next/server";
import { getDb } from "@/lib/mongo";

export async function POST(req: Request) {
  const { roomId, answer, from, to } = await req.json().catch(() => ({}));
  if (!roomId || !answer || !from || !to) {
    return NextResponse.json({ ok:false, error:"bad body" }, { status:400 });
  }

  const db = await getDb();
await db.collection("webrtc_offers").createIndex({ createdAt: 1 }, { expireAfterSeconds: 3600 });
await db.collection("webrtc_answers").createIndex({ createdAt: 1 }, { expireAfterSeconds: 3600 });
await db.collection("webrtc_candidates").createIndex({ createdAt: 1 }, { expireAfterSeconds: 600 });

  await db.collection("webrtc_answers").insertOne({
    roomId, from, to, sdp: answer, createdAt: new Date().toISOString(),
  });
  return NextResponse.json({ ok:true });
}

export async function GET(req: Request) {
  const url = new URL(req.url);
  const roomId = url.searchParams.get("roomId") || "";
  const to = url.searchParams.get("to") || "";   // <- hostId
  if (!roomId || !to) return NextResponse.json({}, { status:400 });

  const db = await getDb();
  // підбираємо останню відповідь ДЛЯ цього hostId (to)
  const doc = await db.collection("webrtc_answers")
    .find({ roomId, to })
    .sort({ createdAt: -1 })
    .limit(1)
    .toArray();

  return NextResponse.json(doc[0] || {});
}
