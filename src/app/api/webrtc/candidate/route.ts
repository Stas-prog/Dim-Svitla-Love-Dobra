export const dynamic = "force-dynamic";
export const runtime = "nodejs";
export const revalidate = 0;

import { NextResponse } from "next/server";
import { getDb } from "@/lib/mongo";

export async function POST(req: Request) {
  const { roomId, from, ice } = await req.json().catch(() => ({}));
  if (!roomId || !from || !ice) {
    return NextResponse.json({ ok:false, error:"bad body" }, { status:400 });
  }

  const db = await getDb();
  await db.collection("webrtc_candidates").insertOne({
    roomId, from, ice, createdAt: new Date().toISOString(),
  });
  return NextResponse.json({ ok:true });
}

export async function GET(req: Request) {
  const url = new URL(req.url);
  const roomId = url.searchParams.get("roomId") || "";
  const from = url.searchParams.get("from") || ""; // мій clientId (щоб не віддавати мої ж ICE)
  if (!roomId || !from) return NextResponse.json([], { status:400 });

  const db = await getDb();
  const items = await db.collection("webrtc_candidates")
    .find({ roomId, from: { $ne: from } })
    .sort({ createdAt: 1 })
    .limit(100)
    .toArray();

  // акуратно почистимо віддані
  if (items.length) {
    const ids = items.map(i => i._id);
    await db.collection("webrtc_candidates").deleteMany({ _id: { $in: ids } as any });
  }

  // повертаємо чисті ICE-об’єкти
  return NextResponse.json(items.map(i => i.ice));
}
