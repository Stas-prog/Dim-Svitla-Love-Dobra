// src/app/api/upload/route.ts
import { NextResponse } from "next/server";
import cloudinary from "@/lib/cloudinary";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

type Body = {
  roomId: string;
  imageDataUrl: string; // data:image/...
  caption?: string;
  series?: "default" | "slideshow";
};

export async function POST(req: Request) {
  try {
    const ct = req.headers.get("content-type") || "";
    if (
      !ct.includes("application/json") &&
      !ct.includes("multipart/form-data") &&
      !ct.includes("application/x-www-form-urlencoded")
    ) {
      return NextResponse.json(
        { ok: false, error: 'Content-Type was not one of "multipart/form-data" or "application/x-www-form-urlencoded" or "application/json".' },
        { status: 400 }
      );
    }

    const body = (await req.json()) as Body;
    const roomId = (body.roomId || "").trim();
    const imageDataUrl = (body.imageDataUrl || "").trim();
    const series = (body.series || "default") as "default" | "slideshow";
    const caption = body.caption || "";

    if (!roomId || !imageDataUrl.startsWith("data:image/")) {
      return NextResponse.json({ ok: false, error: "roomId or imageDataUrl invalid" }, { status: 400 });
    }

    const folder = `vision/${roomId}${series === "slideshow" ? "/slideshow" : ""}`;
    const public_id = `snap-${Date.now()}`;

    const res = await cloudinary.uploader.upload(imageDataUrl, {
      folder,
      public_id,
      overwrite: false,
      context: caption ? { caption } : undefined,
      resource_type: "image",
    });

    return NextResponse.json({
      ok: true,
      public_id: res.public_id,
      secure_url: res.secure_url,
      folder: res.folder,
      width: res.width,
      height: res.height,
      created_at: res.created_at,
    });
  } catch (e: any) {
    return NextResponse.json({ ok: false, error: e?.message || "upload failed" }, { status: 500 });
  }
}
