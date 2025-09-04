import { NextResponse } from "next/server";
import { getDb } from "@/lib/mongo";
import { memStore } from "@/lib/wrtcStore";

export async function POST(req: Request) {
  const { roomId, answer, from, to } = await req.json().catch(() => ({}));
  if (!roomId || !answer || !from || !to) return NextResponse.json({ ok:false }, { status:400 });

  try {
    const db = await getDb();
    await db.collection("webrtc_answers").insertOne({ roomId, from, to, sdp: answer, createdAt: new Date().toISOString() });
    return NextResponse.json({ ok:true, mode:"mongo" });
  } catch {
    memStore.pushAnswer({ roomId, from, to, sdp: answer, createdAt: new Date().toISOString() });
    return NextResponse.json({ ok:true, mode:"memory" });
  }
}

export async function GET(req: Request) {
  const url = new URL(req.url);
  const roomId = url.searchParams.get("roomId") || "";
  const to = url.searchParams.get("to") || "";
  if (!roomId || !to) return NextResponse.json({}, { status:400 });

  try {
    const db = await getDb();
    const doc = await db.collection("webrtc_answers").findOneAndDelete({ roomId, to }, { sort:{ createdAt:-1 } });
    if (doc?.value) return NextResponse.json(doc.value);
  } catch {}

  const m = memStore.popAnswer(roomId, to);
  return NextResponse.json(m || {});
}
