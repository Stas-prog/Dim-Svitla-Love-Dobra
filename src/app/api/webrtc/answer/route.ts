export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';
export const revalidate = 0;

import { NextResponse } from 'next/server';
import { getDb } from '@/lib/mongo';

type AnswerDoc = {
  _id?: string;
  roomId: string;
  from: string;   // viewer id
  to?: string;    // host id (адресат)
  sdp: any;
  createdAt: string;
};

// in-memory fallback
const mem = {
  answers: [] as AnswerDoc[],
};

async function tryDb<T>(fn: () => Promise<T>): Promise<T | null> {
  try { return await fn(); } catch { return null; }
}

export async function POST(req: Request) {
  const body = (await req.json()) as Partial<AnswerDoc> & { answer?: { sdp: any } };
  // дозволяємо як {answer:{sdp}} так і {sdp}
  const doc: AnswerDoc = {
    roomId: body.roomId!,
    from: body.from!,
    to: body.to,                  // <-- ВАЖЛИВО
    sdp: (body.answer?.sdp ?? (body as any).sdp) as any,
    createdAt: new Date().toISOString(),
  };

  const ok = await tryDb(async () => {
    const db = await getDb();
    // одна активна answer на пару (roomId+to)
    if (doc.to) {
      await db.collection<AnswerDoc>('webrtc_answers').deleteMany({ roomId: doc.roomId, to: doc.to });
    } else {
      await db.collection<AnswerDoc>('webrtc_answers').deleteMany({ roomId: doc.roomId });
    }
    await db.collection<AnswerDoc>('webrtc_answers').insertOne(doc);
    return true;
  });

  if (!ok) {
    // memory fallback
    mem.answers = mem.answers.filter(a => a.roomId !== doc.roomId || (doc.to ? a.to !== doc.to : false));
    mem.answers.push(doc);
  }

  return NextResponse.json({ ok: true, mode: ok ? 'mongo' : 'memory' });
}

export async function GET(req: Request) {
  const url = new URL(req.url);
  const roomId = url.searchParams.get('roomId') || '';
  const to = url.searchParams.get('to') || undefined;

  // Mongo
  const got = await tryDb(async () => {
    const db = await getDb();
    if (to) {
      return await db.collection<AnswerDoc>('webrtc_answers')
        .findOne({ roomId, to }, { sort: { createdAt: -1 } as any });
    }
    return await db.collection<AnswerDoc>('webrtc_answers')
      .findOne({ roomId }, { sort: { createdAt: -1 } as any });
  });

  if (got) return NextResponse.json(got);

  // memory
  const list = mem.answers
    .filter(a => a.roomId === roomId && (!to || a.to === to))
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  return NextResponse.json(list[0] ?? {});
}
