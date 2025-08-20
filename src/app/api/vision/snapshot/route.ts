export const dynamic = "force-dynamic";
export const runtime = "nodejs";
export const revalidate = 0;

import { NextResponse } from "next/server";
import { getDb } from "@/lib/mongo";

// ---- Тип документа в Mongo
type SnapshotDoc = {
    _id?: string;
    roomId: string;
    by: string;                // clientId
    createdAt: string;         // ISO
    contentType: string;       // "image/jpeg" | "image/png"
    bytes: Buffer;             // бінарне зображення
};

// Для App Router нам не потрібен кастомний bodyParser; розмір кадру —
//  ~200–400KB (ми й так стискаємо у Vision.tsx).

function parseDataUrl(dataUrl: string): { mime: string; base64: string } {
    // формат: data:image/jpeg;base64,AAAA...
    const m = /^data:(.+?);base64,(.+)$/.exec(dataUrl);
    if (!m) throw new Error("Bad data URL");
    return { mime: m[1], base64: m[2] };
}

// POST: зберегти один знімок
export async function POST(req: Request) {
    try {
        const { roomId, by, imageBase64 } = (await req.json()) as {
            roomId?: string;
            by?: string;
            imageBase64?: string; // це dataURL (data:image/...;base64,xxx)
        };

        if (!roomId || !by || !imageBase64) {
            return NextResponse.json({ ok: false, error: "roomId/by/imageBase64 required" }, { status: 400 });
        }

        const { mime, base64 } = parseDataUrl(imageBase64);
        const buf = Buffer.from(base64, "base64");

        // Проста валідація, щоб не залетіли мегабайти
        if (buf.length > 1_000_000) {
            // ~1MB ліміт
            return NextResponse.json({ ok: false, error: "image too large" }, { status: 413 });
        }

        const doc: SnapshotDoc = {
            roomId,
            by,
            createdAt: new Date().toISOString(),
            contentType: mime,
            bytes: buf,
        };

        const db = await getDb();
        await db.collection<SnapshotDoc>("vision_snapshots").insertOne(doc);

        return NextResponse.json({ ok: true });
    } catch (e: any) {
        return NextResponse.json({ ok: false, error: e?.message || "save_failed" }, { status: 500 });
    }
}

// GET: отримати останні N знімків кімнати
// /api/vision/snapshot?roomId=...&limit=12
export async function GET(req: Request) {
    try {
        const url = new URL(req.url);
        const roomId = url.searchParams.get("roomId") || "";
        const limit = Math.max(1, Math.min(100, parseInt(url.searchParams.get("limit") || "12", 10)));

        if (!roomId) {
            return NextResponse.json({ ok: false, error: "roomId required" }, { status: 400 });
        }

        const db = await getDb();
        const items = await db
            .collection<SnapshotDoc>("vision_snapshots")
            .find({ roomId })
            .sort({ createdAt: -1 })
            .limit(limit)
            .toArray();

        // Віддаємо як dataURL, щоб можна було одразу показувати <img>
        const result = items.map((it) => ({
            _id: it._id?.toString(),
            roomId: it.roomId,
            by: it.by,
            createdAt: it.createdAt,
            dataUrl: `data:${it.contentType};base64,${Buffer.from(it.bytes).toString("base64")}`,
        }));

        return NextResponse.json({ ok: true, items: result });
    } catch (e: any) {
        return NextResponse.json({ ok: false, error: e?.message || "fetch_failed" }, { status: 500 });
    }
}
