export const dynamic = "force-dynamic";
export const runtime = "nodejs";
export const revalidate = 0;

import { NextResponse } from "next/server";
import { getDb } from "@/lib/mongo";

// Пам’ять у процесі (швидкий шлях), плюс дублюємо в Mongo для надійності.
type AnswerDoc = {
  _id?: string;
  roomId: string;
  to: string;
  sdp: string;
  type: "answer";
  createdAt: string;
};

const mem = {
  answers: [] as AnswerDoc[],
};

export async function GET(req: Request) {
  try {
    const url = new URL(req.url);
    const roomId = url.searchParams.get("roomId") || "";
    const to = url.searchParams.get("to") || "";

    if (!roomId || !to) {
      return NextResponse.json({ error: "roomId and to are required" }, { status: 400 });
    }

    // 1) спроба знайти в оперативній пам’яті
    const inMem = mem.answers.find(a => a.roomId === roomId && a.to === to) || null;
    if (inMem) {
      return NextResponse.json(inMem, { status: 200 });
    }

    // 2) спроба підтягти з Mongo (на випадок рестарту ноди)
    try {
      const db = await getDb();
      const col = db.collection<AnswerDoc>("webrtc_answers");
      const fromDb =
        (await col.findOne({ roomId, to }, { sort: { createdAt: -1 } })) || null;

      if (fromDb) {
        // кешуємо у пам’ять і повертаємо
        mem.answers.push(fromDb);
        return NextResponse.json(fromDb, { status: 200 });
      }
    } catch {
      // якщо немає Mongo або тимчасова помилка — просто ігноруємо, повернемо 204
    }

    // Немає відповіді поки що → повертаємо 204 БЕЗ ТІЛА
    return new NextResponse(null, { status: 204, headers: { "cache-control": "no-store" } });
  } catch (e) {
    console.error("GET /api/webrtc/answer", e);
    return NextResponse.json({ error: "internal error" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const body = (await req.json()) as { roomId: string; to: string; sdp: string };
    const { roomId, to, sdp } = body || {};
    if (!roomId || !to || !sdp) {
      return NextResponse.json({ error: "roomId, to, sdp required" }, { status: 400 });
    }

    const doc: AnswerDoc = {
      roomId,
      to,
      sdp,
      type: "answer",
      createdAt: new Date().toISOString(),
    };

    // кеш у пам’яті
    mem.answers.push(doc);

    // запис у Mongo (безпечний дубль)
    try {
      const db = await getDb();
      await db.collection<AnswerDoc>("webrtc_answers").insertOne(doc);
    } catch (e) {
      console.warn("webrtc_answers insert warn:", e);
    }

    return NextResponse.json({ ok: true }, { status: 200 });
  } catch (e) {
    console.error("POST /api/webrtc/answer", e);
    return NextResponse.json({ error: "internal error" }, { status: 500 });
  }
}
