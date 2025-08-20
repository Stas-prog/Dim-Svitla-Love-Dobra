export const dynamic = "force-dynamic";
export const runtime = "nodejs";
export const revalidate = 0;

import { NextResponse } from "next/server";
import { getDb } from "@/lib/mongo";

type Sdp = { type: "offer" | "answer"; sdp: string };

type AnswerDoc = {
  _id?: string;
  roomId: string;
  from: string;       // viewerId
  to: string;         // hostId (ціль)
  sdp: Sdp;           // {type:"answer", sdp:"..."}
  createdAt: string;
};

// in-memory fallback
const mem = { answers: [] as AnswerDoc[] };

async function tryDb<T>(fn: () => Promise<T>): Promise<T | null> {
  try { return await fn(); } catch { return null; }
}

export async function POST(req: Request) {
  const body = await req.json() as { roomId: string; from: string; to: string; answer: Sdp };
  const doc: AnswerDoc = {
    roomId: body.roomId,
    from: body.from,
    to: body.to,
    sdp: body.answer,
    createdAt: new Date().toISOString(),
  };

  const ok = await tryDb(async () => {
    const db = await getDb();
    await db.collection<AnswerDoc>("webrtc_answers").insertOne(doc);
    return true;
  });

  if (!ok) {
    mem.answers.push(doc);
  }

  return NextResponse.json({ ok: true, mode: ok ? "mongo" : "memory" });
}

export async function GET(req: Request) {
  const url = new URL(req.url);
  const roomId = url.searchParams.get("roomId") || "";
  const to = url.searchParams.get("to") || "";  // hostId

  const got = await tryDb(async () => {
    const db = await getDb();
    const doc = await db.collection<AnswerDoc>("webrtc_answers")
      .find({ roomId, to })
      .sort({ _id: -1 })
      .limit(1)
      .toArray();

    if (doc.length) {
      // видалимо відданий, щоб не дублювати
      await db.collection<AnswerDoc>("webrtc_answers").deleteOne({ _id: doc[0]._id });
      return doc[0];
    }
    return null;
  });

  if (got) return NextResponse.json(got);

  // memory
  const idx = mem.answers.findIndex(a => a.roomId === roomId && a.to === to);
  if (idx >= 0) {
    const doc = mem.answers[idx];
    mem.answers.splice(idx, 1);
    return NextResponse.json(doc);
  }

  // 204 не можна через NextResponse.json, тому повертаємо порожній об'єкт
  return NextResponse.json({});
}
