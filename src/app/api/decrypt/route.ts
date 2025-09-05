// /src/app/api/decrypt/route.ts
export const dynamic = "force-dynamic";
export const runtime = "nodejs";
export const revalidate = 0;

import { NextResponse } from "next/server";
import cloudinary from "@/lib/cloudinary";

type Slide = {
  public_id: string;
  secure_url: string;
  thumb_url: string;
  created_at: string;
  width: number;
  height: number;
  format: string;
};

function bad(msg: string, status = 400) {
  return NextResponse.json({ ok: false, error: msg }, { status });
}

function ok(data: unknown, status = 200) {
  return NextResponse.json(data, { status });
}

async function fetchSlides(roomId: string, limit = 50): Promise<Slide[]> {
  const folder = `vision/${roomId}`;

  const res = await cloudinary.search
    .expression(`folder=${folder} AND resource_type:image`)
    .sort_by("created_at", "desc")
    .max_results(Math.min(limit, 200))
    .execute();

  const resources = (res?.resources ?? []) as Array<{
    public_id: string;
    secure_url: string;
    created_at: string;
    width: number;
    height: number;
    format: string;
  }>;

  return resources.map((r) => ({
    public_id: r.public_id,
    secure_url: r.secure_url, // оригінал
    // компактне прев’ю через builder:
    thumb_url: cloudinary.url(r.public_id, {
      type: "upload",
      secure: true,
      transformation: [{ w: 640, h: 360, crop: "limit", q: "auto" }],
    }),
    created_at: r.created_at,
    width: r.width,
    height: r.height,
    format: r.format,
  }));
}

// GET ?roomId=...&limit=...
export async function GET(req: Request) {
  const url = new URL(req.url);
  const roomId = (url.searchParams.get("roomId") || "").trim();
  const limit = parseInt(url.searchParams.get("limit") || "50", 10) || 50;

  if (!roomId) return bad("roomId required");
  try {
    const items = await fetchSlides(roomId, limit);
    return ok({ ok: true, items });
  } catch (e: any) {
    return bad(e?.message || "cloudinary error", 500);
  }
}

// POST { roomId: string, limit?: number }
export async function POST(req: Request) {
  const body = await req.json().catch(() => null);
  const roomId = String(body?.roomId || "").trim();
  const limit = Number(body?.limit ?? 50);

  if (!roomId) return bad("roomId required");
  try {
    const items = await fetchSlides(roomId, limit);
    return ok({ ok: true, items });
  } catch (e: any) {
    return bad(e?.message || "cloudinary error", 500);
  }
}
