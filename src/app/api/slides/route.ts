import { NextResponse } from "next/server";
import cloudinary, { clUrl } from "@/lib/cloudinary";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET(req: Request) {
  try {
    const url = new URL(req.url);
    const roomId = (url.searchParams.get("roomId") || "").trim();
    const series = (url.searchParams.get("series") || "default") as "default" | "slideshow";
    const limit = Math.min(parseInt(url.searchParams.get("limit") || "60", 10) || 60, 200);

    if (!roomId) {
      return NextResponse.json({ items: [] });
    }

    const folder = `vision/${roomId}${series === "slideshow" ? "/slideshow" : ""}`;
    const expr = `folder:${folder} AND resource_type:image`;

    const result = await cloudinary.search
      .expression(expr)
      .sort_by("created_at", "desc")
      .max_results(limit)
      .execute();

    const items = (result?.resources || []).map((r: any) => ({
      public_id: r.public_id as string,
      url: clUrl(r.public_id, { q: 80, f: "auto" }),
      created_at: r.created_at as string,
      width: r.width as number,
      height: r.height as number,
    }));

    return NextResponse.json({ items });
  } catch (e: any) {
    return NextResponse.json({ items: [], error: e?.message || "search failed" }, { status: 500 });
  }
}
