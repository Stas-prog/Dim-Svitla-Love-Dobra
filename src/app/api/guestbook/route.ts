export const dynamic = "force-dynamic";
export const runtime = "nodejs";
export const revalidate = 0;

import { NextResponse } from "next/server";
import { getDb } from "@/lib/mongo";
import type { GuestbookEntry } from "@/lib/types";

export async function GET() {
    const db = await getDb();
    const col = db.collection<GuestbookEntry>("guestbook");
    const items = await col.find({}).sort({ createdAt: -1 }).limit(200).toArray();
    return NextResponse.json(items);
}

export async function POST(req: Request) {
    const body = (await req.json()) as { name: string; text: string };
    const db = await getDb();
    const col = db.collection<GuestbookEntry>("guestbook");

    const entry: GuestbookEntry = {
        name: body.name?.trim() || "Анонім",
        text: String(body.text || "").slice(0, 500),
        createdAt: new Date().toISOString(),
    };
    await col.insertOne(entry);
    return NextResponse.json({ ok: true });
}
