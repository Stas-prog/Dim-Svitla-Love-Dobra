import { NextResponse } from "next/server";
import { getDb } from "@/lib/mongo";
import { memStore } from "@/lib/wrtcStore";

export async function POST(req: Request) {
  const { roomId, offer, from } = await req.json().catch(() => ({}));
  if (!roomId || !offer || !from) return NextResponse.json({ ok:false }, { status:400 });

  try {
    const db = await getDb();
    await db.collection("webrtc_offers").insertOne({ roomId, from, sdp: offer, createdAt: new Date().toISOString() });
    return NextResponse.json({ ok:true, mode:"mongo" });
  } catch {
    memStore.pushOffer({ roomId, from, sdp: offer, createdAt: new Date().toISOString() });
    return NextResponse.json({ ok:true, mode:"memory" });
  }
}

export async function GET(req: Request) {
  const url = new URL(req.url);
  const roomId = url.searchParams.get("roomId") || "";
  if (!roomId) return NextResponse.json({}, { status:400 });

  try {
    const db = await getDb();
    const doc = await db.collection("webrtc_offers").findOneAndDelete({ roomId }, { sort:{ createdAt:-1 } });
    if (doc?.value) return NextResponse.json(doc.value);
  } catch {}

  const m = memStore.popOffer(roomId);
  return NextResponse.json(m || {});
}
