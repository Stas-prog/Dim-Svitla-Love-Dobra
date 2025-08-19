export const dynamic = "force-dynamic";
export const runtime = "nodejs";
export const revalidate = 0;

import { NextResponse } from "next/server";
import { getDb } from "@/lib/mongo";

type AnswerDoc = {
  _id?: string;
  roomId: string;
  from: string; // viewer
  to: string;   // host id
  sdp: any;
  createdAt: string;
};

const mem = { answers: [] as AnswerDoc[] };

async function tryDb<T>(fn: () => Promise<T>): Promise<T | null> {
  try {
    return await fn();
  } catch {
    return null;
  }
}

export async function POST(req: Request) {
  const body = (await req.json()) as { roomId: string; answer: any; from: string; to?: string | null };
  const doc: AnswerDoc = {
    roomId: body.roomId,
    from: body.from,
    to: body.to || "",
    sdp: body.answer,
    createdAt: new Date().toISOString(),
  };

  const ok = await tryDb(async () => {
    const db = await getDb();
    await db.collection<AnswerDoc>("webrtc_answers").deleteMany({ roomId: doc.roomId, to: doc.to });
    await db.collection<AnswerDoc>("webrtc_answers").insertOne(doc);
    return true;
  });

  if (!ok) {
    mem.answers = mem.answers.filter((a) => !(a.roomId === doc.roomId && a.to === doc.to));
    mem.answers.push(doc);
  }
  return NextResponse.json({ ok: true, mode: ok ? "mongo" : "memory" });
}

export async function GET(req: Request) {
  const url = new URL(req.url);
  const roomId = url.searchParams.get("roomId") || "";
  const to = url.searchParams.get("to") || ""; // host id

  const got = await tryDb(async () => {
    const db = await getDb();
    const x = await db.collection<AnswerDoc>("webrtc_answers").findOne({ roomId, to });
    return x ? { sdp: x.sdp, from: x.from } : null;
  });
  if (got) return NextResponse.json(got);

  const m = mem.answers.find((a) => a.roomId === roomId && a.to === to) || null;
  return NextResponse.json(m ? { sdp: m.sdp, from: m.from } : {});
}
