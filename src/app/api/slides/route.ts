import { NextResponse } from "next/server";
import { cloudinaryUrl, cldSearch } from "@/lib/cloudinary";

// GET /api/slides?roomId=...&limit=100&cursor=...
export async function GET(req: Request) {
  try {
    const url = new URL(req.url);
    const roomId = url.searchParams.get("roomId") || "";
    const limit = Math.min(parseInt(url.searchParams.get("limit") || "100", 10) || 100, 200);
    const cursor = url.searchParams.get("cursor") || undefined;

    if (!roomId) return NextResponse.json({ items: [], nextCursor: null });

    // шукаємо ЗОБРАЖЕННЯ у папці vision/<roomId>, від старих до нових
    const { resources, next_cursor } = await cldSearch({
      folder: `vision/${roomId}`,
      max_results: limit,
      next_cursor: cursor,
      sort_by: [{ created_at: "asc" }],
    });

    const items = (resources || []).map((r: any) => ({
      id: r.asset_id || r.public_id,
      url: cloudinaryUrl(r.public_id, { w: 1600, q: 80, f: "jpg", fit: "scale" }),
      createdAt: r.created_at,
    }));

    return NextResponse.json({ items, nextCursor: next_cursor || null });
  } catch (e: any) {
    return NextResponse.json({ items: [], nextCursor: null, error: e?.message || "search failed" }, { status: 500 });
  }
}
