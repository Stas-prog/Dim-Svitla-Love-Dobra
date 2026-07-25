import { getDb } from "@/lib/mongo";

type Sdp = { type: "offer" | "answer"; sdp: string };
type OfferDoc = { roomId: string; from: string; sdp: Sdp; createdAt: string };
type AnswerDoc = { roomId: string; to: string; from: string; sdp: Sdp; createdAt: string };
type IceDoc = { roomId: string; from: string; ice: any; createdAt: string };

// In-memory запаска (живе доки живе процес)
const mem = {
  offers: new Map<string, OfferDoc>(),        // roomId -> offer
  answers: new Map<string, AnswerDoc>(),      // roomId -> answer (per host)
  ices: new Map<string, IceDoc[]>(),          // roomId -> list
};

async function tryDb() {
  try {
    const db = await getDb();
    return db;
  } catch {
    return null;
  }
}

export async function saveOffer(doc: OfferDoc) {
  const db = await tryDb();
  if (db) {
    await db.collection<OfferDoc>("webrtc_offers").updateOne(
      { roomId: doc.roomId },
      { $set: doc },
      { upsert: true }
    );
  } else {
    mem.offers.set(doc.roomId, doc);
  }
}

export async function loadOffer(roomId: string): Promise<OfferDoc | null> {
  const db = await tryDb();
  if (db) {
    const row = await db.collection<OfferDoc>("webrtc_offers").findOne({ roomId });
    return row ?? null;
  }
  return mem.offers.get(roomId) ?? null;
}

export async function saveAnswer(doc: AnswerDoc) {
  const db = await tryDb();
  if (db) {
    await db.collection<AnswerDoc>("webrtc_answers").updateOne(
      { roomId: doc.roomId, to: doc.to },
      { $set: doc },
      { upsert: true }
    );
  } else {
    mem.answers.set(`${doc.roomId}:${doc.to}`, doc);
  }
}

export async function loadAnswer(roomId: string, to: string): Promise<AnswerDoc | null> {
  const db = await tryDb();
  if (db) {
    const row = await db.collection<AnswerDoc>("webrtc_answers").findOne({ roomId, to });
    return row ?? null;
  }
  return mem.answers.get(`${roomId}:${to}`) ?? null;
}

export async function saveIce(doc: IceDoc) {
  const db = await tryDb();
  if (db) {
    await db.collection<IceDoc>("webrtc_ice").insertOne(doc);
  } else {
    const key = doc.roomId;
    if (!mem.ices.has(key)) mem.ices.set(key, []);
    mem.ices.get(key)!.push(doc);
  }
}

export async function loadIce(roomId: string, excludeFrom: string): Promise<IceDoc[]> {
  const db = await tryDb();
  if (db) {
    return await db
      .collection<IceDoc>("webrtc_ice")
      .find({ roomId, from: { $ne: excludeFrom } })
      .sort({ createdAt: 1 } as any)
      .limit(200)
      .toArray();
  }
  return (mem.ices.get(roomId) ?? []).filter(x => x.from !== excludeFrom);
}
