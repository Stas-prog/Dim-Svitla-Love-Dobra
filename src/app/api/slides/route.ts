export const dynamic = "force-dynamic";
export const runtime = "nodejs";
export const revalidate = 0;

import { NextResponse } from "next/server";
import { getDb } from "@/lib/mongo";

/**
 * GET /api/slides?roomId=...&limit=...
 * Повертає [{ _id, roomId, url, publicId, caption, width, height, createdAt }, ...]
 */
export async function GET(req: Request) {
  const url = new URL(req.url);
  const roomId = (url.searchParams.get("roomId") || "").trim();
  const limit = Math.min(parseInt(url.searchParams.get("limit") || "60", 10) || 60, 200);

  if (!roomId) {
    return NextResponse.json({ ok: false, error: "roomId required" }, { status: 400 });
  }

  const db = await getDb();
  const rows = await db
    .collection("slides")
    .find({ roomId, url: { $exists: true, $ne: "" } })
    .sort({ createdAt: -1 })
    .limit(limit)
    .toArray();

  return NextResponse.json({ ok: true, items: rows });
}
