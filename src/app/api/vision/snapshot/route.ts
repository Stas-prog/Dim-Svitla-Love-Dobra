export const dynamic = "force-dynamic";
export const runtime = "nodejs";
export const revalidate = 0;

import { NextResponse } from "next/server";
import { getDb } from "@/lib/mongo";

type SnapshotDoc = {
    _id?: string;
    roomId: string;
    by: string;
    imageDataUrl: string; // data:image/jpeg;base64,...
    createdAt: string;
};

function ok(data: any, status = 200) {
    return NextResponse.json(data, { status });
}

function bad(msg: string, status = 400) {
    return NextResponse.json({ ok: false, error: msg }, { status });
}

async function tryDb<T>(fn: () => Promise<T>): Promise<T | null> {
    try { return await fn(); } catch { return null; }
}

/**
 * POST /api/vision/snapshot
 * body: { roomId: string; by: string; imageDataUrl: string }
 */
export async function POST(req: Request) {
    const body = await req.json().catch(() => null);
    if (!body) return bad("invalid json");

    const roomId = String(body.roomId || "").trim();
    const by = String(body.by || "").trim();
    const imageDataUrl = String(body.imageDataUrl || body.imageBase64 || "").trim();

    if (!roomId) return bad("roomId required");
    if (!by) return bad("by required");
    if (!imageDataUrl || !imageDataUrl.startsWith("data:image")) {
        return bad("imageDataUrl required (dataURL)");
    }

    const doc: SnapshotDoc = {
        roomId,
        by,
        imageDataUrl,
        createdAt: new Date().toISOString(),
    };

    const okIns = await tryDb(async () => {
        const db = await getDb();
        // індекси (один раз створяться)
        await db.collection<SnapshotDoc>("vision_snaps")
            .createIndex({ roomId: 1, createdAt: -1 });

        await db.collection<SnapshotDoc>("vision_snaps").insertOne(doc);
        return true;
    });

    if (!okIns) return bad("db insert failed", 500);
    return ok({ ok: true });
}

/**
 * GET /api/vision/snapshot?roomId=...&limit=...
 * Повертає список снапів (нові зверху)
 */
export async function GET(req: Request) {
    const url = new URL(req.url);
    const roomId = (url.searchParams.get("roomId") || "").trim();
    const limit = Math.min(parseInt(url.searchParams.get("limit") || "100", 10) || 100, 200);

    if (!roomId) return bad("roomId required");

    const rows = await tryDb(async () => {
        const db = await getDb();
        const arr = await db
            .collection<SnapshotDoc>("vision_snaps")
            .find({ roomId })
            .sort({ createdAt: -1 })
            .limit(limit)
            .toArray();
        return arr;
    });

    if (!rows) return bad("db read failed", 500);
    return ok({ ok: true, items: rows });
}
