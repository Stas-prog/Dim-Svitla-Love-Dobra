export const dynamic = "force-dynamic";
export const runtime = "nodejs";
export const revalidate = 0;

import { NextResponse } from "next/server";
import { getDb } from "@/lib/mongo";
import type { BotSnapshot } from "@/lib/types";

export async function GET() {
    const db = await getDb();
    const col = db.collection<BotSnapshot>("bot_state");
    const doc = await col.findOne({ _id: "bot" });
    return NextResponse.json(doc ?? {});
}

export async function POST(req: Request) {
    const body = (await req.json()) as Partial<BotSnapshot>;
    const db = await getDb();
    const col = db.collection<BotSnapshot>("bot_state");

    const now = new Date().toISOString();
    const payload: BotSnapshot = {
        _id: "bot",
        status: (body.status as BotSnapshot["status"]) ?? "idle",
        notes: body.notes ?? "",
        updatedAt: now,
    };
    await col.updateOne({ _id: "bot" }, { $set: payload }, { upsert: true });
    return NextResponse.json({ ok: true, updatedAt: now });
}
