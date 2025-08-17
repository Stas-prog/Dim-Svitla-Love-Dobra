export const dynamic = "force-dynamic";
export const runtime = "nodejs";
export const revalidate = 0;

import { NextResponse } from "next/server";
import { getDb } from "@/lib/mongo";

type PostBody = {
    dataUrl: string;     // "data:image/jpeg;base64,...."
    roomId?: string;
    clientId?: string;
};

export async function POST(req: Request) {
    try {
        const { dataUrl, roomId = "home-vision", clientId = "unknown" } = (await req.json()) as PostBody;

        if (!dataUrl || !dataUrl.startsWith("data:image/")) {
            return NextResponse.json({ ok: false, error: "Invalid dataUrl" }, { status: 400 });
        }

        const [header, base64] = dataUrl.split(",", 2);
        if (!base64) {
            return NextResponse.json({ ok: false, error: "Malformed dataUrl" }, { status: 400 });
        }

        const mimeMatch = /^data:(image\/[a-zA-Z0-9.+-]+);base64$/.exec(header);
        const mime = mimeMatch?.[1] || "image/jpeg";
        const buffer = Buffer.from(base64, "base64");

        const db = await getDb();
        const col = db.collection("snapshots");

        const doc = {
            roomId,
            clientId,
            mime,
            size: buffer.length,
            data: buffer, // Binary
            createdAt: new Date().toISOString(),
        };

        const ins = await col.insertOne(doc as any);
        return NextResponse.json({ ok: true, id: ins.insertedId.toString() });
    } catch (e) {
        return NextResponse.json({ ok: false, error: (e as Error).message }, { status: 500 });
    }
}

// Список метаданих останніх знімків (без бінарних даних)
export async function GET(req: Request) {
    const url = new URL(req.url);
    const limit = Math.min(parseInt(url.searchParams.get("limit") || "20", 10) || 20, 100);

    const db = await getDb();
    const col = db.collection("snapshots");
    const rows = await col
        .find({}, { projection: { data: 0 } })
        .sort({ createdAt: -1 })
        .limit(limit)
        .toArray();

    return NextResponse.json(rows);
}
