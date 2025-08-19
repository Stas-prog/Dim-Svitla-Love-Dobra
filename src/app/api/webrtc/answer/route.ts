export const dynamic = "force-dynamic";
export const runtime = "nodejs";
export const revalidate = 0;

import { NextResponse } from "next/server";
import { getDb } from "@/lib/mongo";

type AnswerDoc = {
  _id?: string;
  roomId: string;
  to: string;      // host id
  from: string;    // viewer id
  sdp: any;        // зберігаємо як прислали (рядок або {type,sdp})
  createdAt: string;
};

// --- in-memory fallback store ---
const mem = {
  answers: [] as AnswerDoc[],
};

async function tryDb<T>(fn: () => Promise<T>): Promise<T | null> {
  try { return await fn(); } catch { return null; }
}

export async function POST(req: Request) {
  const body = await req.json() as any;

  // підтримка {sdp} або {answer}
  const sdp = body?.sdp ?? body?.answer ?? null;

  const doc: AnswerDoc = {
    roomId: String(body.roomId || ""),
    to: String(body.to || body.hostId || body.targetId || ""),    // сумісність
    from: String(body.from || ""),
    sdp,
    createdAt: new Date().toISOString(),
  };

  const ok = await tryDb(async () => {
    const db = await getDb();
    await db.collection<AnswerDoc>("webrtc_answers").deleteMany({ roomId: doc.roomId, to: doc.to });
    await db.collection<AnswerDoc>("webrtc_answers").insertOne(doc);
    return true;
  });

  if (!ok) {
    mem.answers = mem.answers.filter(a => !(a.roomId === doc.roomId && a.to === doc.to));
    mem.answers.push(doc);
  }

  return NextResponse.json({ ok: true, mode: ok ? "mongo" : "memory" });
}

export async function GET(req: Request) {
  const url = new URL(req.url);
  const roomId = url.searchParams.get("roomId") || "";
  const to = url.searchParams.get("to") || "";

  const got = await tryDb(async () => {
    const db = await getDb();
    return await db.collection<AnswerDoc>("webrtc_answers").findOne({ roomId, to });
  });

  if (got) return NextResponse.json(got);

  const m = mem.answers.find(a => a.roomId === roomId && a.to === to) || null;
  return NextResponse.json(m ?? {});
}
