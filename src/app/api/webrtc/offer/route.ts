export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const revalidate = 0;

import { NextResponse } from "next/server";
import { saveOffer, loadOffer } from "@/lib/signalStore";

export async function POST(req: Request) {
  try {
    const { roomId, from, offer } = await req.json();
    if (!roomId || !from || !offer?.type) return NextResponse.json({ ok:false, error:"bad payload" }, { status:400 });
    await saveOffer({ roomId, from, sdp: offer, createdAt: new Date().toISOString() });
    return NextResponse.json({ ok:true });
  } catch (e:any) {
    return NextResponse.json({ ok:false, error:e.message }, { status:500 });
  }
}

export async function GET(req: Request) {
  const url = new URL(req.url);
  const roomId = (url.searchParams.get("roomId")||"").trim();
  if (!roomId) return NextResponse.json({}, { status:200 });
  const doc = await loadOffer(roomId).catch(()=>null);
  return NextResponse.json(doc ?? {}, { status:200 });
}
