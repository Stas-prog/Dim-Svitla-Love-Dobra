export const dynamic = "force-dynamic";
export const runtime = "nodejs";
export const revalidate = 0;

import { NextResponse } from "next/server";
import { getDb } from "@/lib/mongo";
import type { HouseState } from "@/lib/types";

export async function GET() {
  const db = await getDb();
  const col = db.collection<HouseState>("house_state");
  const doc = await col.findOne({ _id: "home" });
  return NextResponse.json(doc ?? {});
}

export async function POST(req: Request) {
  const body = (await req.json()) as Partial<HouseState>;
  const db = await getDb();
  const col = db.collection<HouseState>("house_state");

  const now = new Date().toISOString();
  const payload: HouseState = {
    _id: "home",
    theme: body.theme ?? "dawn",
    messageOfTheDay: body.messageOfTheDay ?? "",
    updatedAt: now,
  };
  await col.updateOne({ _id: "home" }, { $set: payload }, { upsert: true });
  return NextResponse.json({ ok: true, updatedAt: now });
}
