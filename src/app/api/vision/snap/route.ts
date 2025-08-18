import { NextResponse } from "next/server";
import { getDb } from "@/lib/mongo";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";
export const revalidate = 0;

type SnapDoc = {
    _id?: string;
    by?: string;          // clientId
    from?: "host" | "viewer";
    dataUrl: string;      // data:image/jpeg;base64,...
    createdAt: string;    // ISO
};

export async function GET() {
    const db = await getDb();
    const col = db.collection<SnapDoc>("vision_snaps");
    const items = await col.find({}).sort({ createdAt: -1 }).limit(40).toArray();
    return NextResponse.json(items);
}

export async function POST(req: Request) {
    try {
        const body = (await req.json()) as Partial<SnapDoc>;
        if (!body?.dataUrl?.startsWith("data:image/")) {
            return NextResponse.json({ ok: false, error: "Bad dataUrl" }, { status: 400 });
        }
        const doc: SnapDoc = {
            by: body.by,
            from: body.from === "host" || body.from === "viewer" ? body.from : undefined,
            dataUrl: body.dataUrl,
            createdAt: new Date().toISOString(),
        };
        const db = await getDb();
        await db.collection<SnapDoc>("vision_snaps").insertOne(doc);
        return NextResponse.json({ ok: true });
    } catch (e) {
        return NextResponse.json({ ok: false, error: "Save failed" }, { status: 500 });
    }
}
