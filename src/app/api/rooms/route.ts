export const dynamic = "force-dynamic";
export const runtime = "nodejs";
export const revalidate = 0;

import { NextResponse } from "next/server";
import { getDb } from "@/lib/mongo";

/**
 * GET /api/rooms
 * -> [{ roomId, lastAt, count, coverUrl }]
 */
export async function GET() {
  const db = await getDb();
  const col = db.collection("slides");

  const agg = await col.aggregate([
    { $match: { url: { $exists: true, $ne: "" } } },
    { $sort: { createdAt: -1 } },
    {
      $group: {
        _id: "$roomId",
        lastAt: { $first: "$createdAt" },
        coverUrl: { $first: "$url" },
        count: { $sum: 1 },
      }
    },
    { $project: { _id: 0, roomId: "$_id", lastAt: 1, coverUrl: 1, count: 1 } },
    { $sort: { lastAt: -1 } },
  ]).toArray();

  return NextResponse.json({ ok: true, rooms: agg });
}
