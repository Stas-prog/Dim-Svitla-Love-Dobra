export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const revalidate = 0;

import { NextResponse } from "next/server";
import { saveAnswer, loadAnswer } from "@/lib/signalStore";

export async function POST(req: Request) {
  try {
    const { roomId, to, from, answer } = await req.json();
    if (!roomId || !to || !from || !answer?.type) {
      return NextResponse.json({ ok:false, error:"bad payload" }, { status:400 });
    }
    await saveAnswer({ roomId, to, from, sdp: answer, createdAt: new Date().toISOString() });
    return NextResponse.json({ ok:true });
  } catch (e:any) {
    return NextResponse.json({ ok:false, error:e.message }, { status:500 });
  }
}

export async function GET(req: Request) {
  const url = new URL(req.url);
  const roomId = (url.searchParams.get("roomId")||"").trim();
  const to = (url.searchParams.get("to")||"").trim();
  if (!roomId || !to) return NextResponse.json({}, { status:200 });
  const doc = await loadAnswer(roomId, to).catch(()=>null);
  return NextResponse.json(doc ?? {}, { status:200 });
}
