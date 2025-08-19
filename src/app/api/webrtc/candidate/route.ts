export const dynamic = "force-dynamic";
export const runtime = "nodejs";
export const revalidate = 0;

import { NextResponse } from "next/server";
import { getDb } from "@/lib/mongo";

type IceDoc = {
    _id?: string;
    roomId: string;
    from: string;
    to?: string; // може бути невідомий (host до появи answer)
    ice: { type: "candidate"; candidate: RTCIceCandidateInit };
    createdAt: string;
};

const mem = { ices: [] as IceDoc[] };

async function tryDb<T>(fn: () => Promise<T>): Promise<T | null> {
    try {
        return await fn();
    } catch {
        return null;
    }
}

export async function POST(req: Request) {
    const body = (await req.json()) as {
        roomId: string;
        from: string;
        to?: string;
        ice: { type: "candidate"; candidate: RTCIceCandidateInit };
    };
    const doc: IceDoc = {
        roomId: body.roomId,
        from: body.from,
        to: body.to,
        ice: body.ice,
        createdAt: new Date().toISOString(),
    };

    const ok = await tryDb(async () => {
        const db = await getDb();
        await db.collection<IceDoc>("webrtc_ice").insertOne(doc);
        // легкий TTL-чистильник (старше 2 хв)
        const cutoff = new Date(Date.now() - 2 * 60 * 1000).toISOString();
        await db.collection<IceDoc>("webrtc_ice").deleteMany({ createdAt: { $lt: cutoff } as any });
        return true;
    });

    if (!ok) {
        mem.ices.push(doc);
        const cutoff = Date.now() - 2 * 60 * 1000;
        mem.ices = mem.ices.filter((x) => new Date(x.createdAt).getTime() >= cutoff);
    }
    return NextResponse.json({ ok: true, mode: ok ? "mongo" : "memory" });
}

// GET /api/webrtc/candidate?roomId=...&to=ME&from=OTHER
export async function GET(req: Request) {
    const url = new URL(req.url);
    const roomId = url.searchParams.get("roomId") || "";
    const to = url.searchParams.get("to") || "";
    const from = url.searchParams.get("from") || "";

    // Mongo: забираємо ОДИН найстаріший підходящий і видаляємо його
    const got = await tryDb(async () => {
        const db = await getDb();
        const col = db.collection<IceDoc>("webrtc_ice");

        const filter: any = { roomId };
        const or: any[] = [{ to }];
        if (to) or.push({ to: { $exists: false } });
        filter.$or = or;
        if (from) filter.from = from;

        const doc = await col.findOne(filter, { sort: { createdAt: 1 } as any });
        if (!doc) return null;

        await col.deleteOne({ _id: doc._id } as any);
        return { ice: doc.ice };
    });
    if (got) return NextResponse.json(got);

    // Memory fallback
    const idx = mem.ices.findIndex(
        (c) =>
            c.roomId === roomId &&
            (!from || c.from === from) &&
            (c.to === to || typeof c.to === "undefined")
    );
    if (idx >= 0) {
        const [picked] = mem.ices.splice(idx, 1);
        return NextResponse.json({ ice: picked.ice });
    }
    return NextResponse.json({});
}
