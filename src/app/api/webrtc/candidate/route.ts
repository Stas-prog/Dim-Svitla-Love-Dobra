// src/app/api/webrtc/candidate/route.ts
export const dynamic = "force-dynamic";
export const runtime = "nodejs";
export const revalidate = 0;

import { NextResponse } from "next/server";
import { getDb } from "@/lib/mongo";

type IceDoc = {
    _id?: string;
    roomId: string;
    from: string;        // хто надіслав
    to?: string;         // кому адресовано (ід іншої сторони)
    candidate: any;      // зберігаємо ICE-кандидат (RTCIceCandidateInit)
    createdAt: string;   // ISO
};

// --- просте in-memory fallback сховище (на випадок проблем з Mongo) ---
const mem = {
    ices: [] as IceDoc[],
};

async function tryDb<T>(fn: () => Promise<T>): Promise<T | null> {
    try { return await fn(); } catch { return null; }
}

// POST: зберегти кандидат
// body: { roomId: string; from: string; to?: string; ice: { type:'candidate', candidate: RTCIceCandidateInit } }
export async function POST(req: Request) {
    const body = await req.json() as {
        roomId: string;
        from: string;
        to?: string;
        ice: { type: "candidate"; candidate: any };
    };

    const doc: IceDoc = {
        roomId: body.roomId,
        from: body.from,
        to: body.to,
        candidate: body.ice?.candidate,
        createdAt: new Date().toISOString(),
    };

    // спроба Mongo
    const ok = await tryDb(async () => {
        const db = await getDb();
        await db.collection<IceDoc>("webrtc_ice").insertOne(doc);
        return true;
    });

    if (!ok) {
        // in-memory fallback
        mem.ices.push(doc);
    }

    return NextResponse.json({ ok: true, mode: ok ? "mongo" : "memory" });
}

// GET: отримати список кандидатів
// /api/webrtc/candidate?roomId=...&to=...  -> поверне масив { type:'candidate', candidate: {...} }
export async function GET(req: Request) {
    const url = new URL(req.url);
    const roomId = url.searchParams.get("roomId") || "";
    const to = url.searchParams.get("to") || undefined;

    // спроба з Mongo
    const rows = await tryDb(async () => {
        const db = await getDb();
        const filter: Partial<IceDoc> = { roomId };
        if (to) filter.to = to;
        const list = await db
            .collection<IceDoc>("webrtc_ice")
            .find(filter)
            .sort({ createdAt: 1 })
            .toArray();
        return list;
    });

    if (rows) {
        return NextResponse.json(
            rows.map(r => ({ type: "candidate", candidate: r.candidate }))
        );
    }

    // in-memory fallback
    const list = mem.ices
        .filter(i => i.roomId === roomId && (!to || i.to === to))
        .sort((a, b) => a.createdAt.localeCompare(b.createdAt));

    return NextResponse.json(
        list.map(r => ({ type: "candidate", candidate: r.candidate }))
    );
}
