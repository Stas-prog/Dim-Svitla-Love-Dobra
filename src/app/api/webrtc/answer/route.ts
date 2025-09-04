import { NextResponse } from "next/server";
import { getDb } from "@/lib/mongo";

export async function POST(req: Request) {
  const { roomId, answer, from, to } = await req.json();
  if (!roomId || !answer || !from || !to) return NextResponse.json({ ok:false, error:"bad request" }, { status:400 });

  const db = await getDb();
  await db.collection("webrtc_answers").insertOne({
    roomId, from, to, sdp: answer, createdAt: new Date().toISOString()
  });

  return NextResponse.json({ ok: true });
}

export async function GET(req: Request) {
  const url = new URL(req.url);
  const roomId = url.searchParams.get("roomId") || "";
  const to = url.searchParams.get("to") || "";
  if (!roomId || !to) return NextResponse.json({}, { status: 400 });

  const db = await getDb();
  // видаємо рівно одну відповідь саме для hostId=to і видаляємо
  const doc = await db.collection("webrtc_answers").findOneAndDelete(
    { roomId, to },
    { sort: { createdAt: -1 } }
  );

  return NextResponse.json(doc?.value || {});
}
