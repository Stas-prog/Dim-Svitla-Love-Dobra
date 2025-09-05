import { NextResponse } from "next/server";
import cloudinary from "@/lib/cloudinary";

export async function GET(req: Request) {
  const url = new URL(req.url);
  const roomId = (url.searchParams.get("roomId") || "").trim();
  const limit = Math.min(parseInt(url.searchParams.get("limit") || "90", 10) || 90, 200);

  if (!roomId) {
    return NextResponse.json({ ok: false, error: "roomId required" }, { status: 400 });
  }

  try {
    const expr = `folder="vision/${roomId}"`;
    const res = await cloudinary.search
      .expression(expr)
      .sort_by("uploaded_at", "desc")
      .with_field("context")
      .max_results(limit)
      .execute();

    const items = (res.resources || []).map((r: any) => ({
      _id: r.asset_id,
      roomId,
      url: r.secure_url,
      publicId: r.public_id,
      width: r.width,
      height: r.height,
      caption: r.context?.caption || "",
      createdAt: r.created_at,
    }));

    return NextResponse.json({ ok: true, items });
  } catch (e: any) {
    return NextResponse.json({ ok: false, error: e.message || "cloudinary search failed" }, { status: 500 });
  }
}
