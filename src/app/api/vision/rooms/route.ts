export const dynamic = "force-dynamic";
export const runtime = "nodejs";
export const revalidate = 0;

import { NextResponse } from "next/server";
import { getDb } from "@/lib/mongo";

type RoomStamp = { roomId: string; createdAt: string };

/** Безпечно витягнути roomId та createdAt (у ISO) з будь-якого документа */
function pluck(arr: any[]): RoomStamp[] {
    return arr
        .map((d) => {
            const roomId = d?.roomId ? String(d.roomId) : "";
            let createdAt = "";
            const raw = d?.createdAt;
            if (raw instanceof Date) createdAt = raw.toISOString();
            else if (typeof raw === "string") createdAt = raw;
            else if (raw) createdAt = String(raw);
            return { roomId, createdAt };
        })
        .filter((x) => !!x.roomId && !!x.createdAt);
}

export async function GET() {
    try {
        const db = await getDb();

        // беремо останні сліди по снімпшотах і офферах
        const snapsRaw = await db
            .collection("vision_snaps")
            .find({}, { projection: { roomId: 1, createdAt: 1 } })
            .sort({ createdAt: -1 })
            .limit(200)
            .toArray();

        const offersRaw = await db
            .collection("webrtc_offers")
            .find({}, { projection: { roomId: 1, createdAt: 1 } })
            .sort({ createdAt: -1 })
            .limit(200)
            .toArray();

        const snaps = pluck(snapsRaw);
        const offers = pluck(offersRaw);

        // злиємо “останній раз бачили” по roomId
        const latest = new Map<string, string>(); // roomId -> ISO createdAt
        for (const s of snaps) {
            const cur = latest.get(s.roomId);
            if (!cur || s.createdAt > cur) latest.set(s.roomId, s.createdAt);
        }
        for (const o of offers) {
            const cur = latest.get(o.roomId);
            if (!cur || o.createdAt > cur) latest.set(o.roomId, o.createdAt);
        }

        const result: RoomStamp[] = Array.from(latest.entries())
            .map(([roomId, createdAt]) => ({ roomId, createdAt }))
            .sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1)); // новіші вгорі

        return NextResponse.json(result);
    } catch (e) {
        // на випадок, якщо Mongo недоступна — повернемо порожній список
        return NextResponse.json<RoomStamp[]>([], { status: 200 });
    }
}
