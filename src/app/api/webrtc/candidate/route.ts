export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const revalidate = 0;

import { NextResponse } from "next/server";
import { saveIce, loadIce } from "@/lib/signalStore";

export async function POST(req: Request) {
  try {
    const { roomId, from, ice } = await req.json();
    if (!roomId || !from || !ice) return NextResponse.json({ ok:false, error:"bad payload" }, { status:400 });
    await saveIce({ roomId, from, ice, createdAt: new Date().toISOString() });
    return NextResponse.json({ ok:true });
  } catch (e:any) {
    return NextResponse.json({ ok:false, error:e.message }, { status:500 });
  }
}

export async function GET(req: Request) {
  const url = new URL(req.url);
  const roomId = (url.searchParams.get("roomId")||"").trim();
  const from = (url.searchParams.get("from")||"").trim();
  if (!roomId || !from) return NextResponse.json([], { status:200 });
  const arr = await loadIce(roomId, from).catch(()=>[]);
  return NextResponse.json(arr, { status:200 });
}
