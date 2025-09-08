// src/app/api/upload/route.ts
export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const revalidate = 0;

import { NextResponse } from "next/server";
import cloudinary from "@/lib/cloudinary";

export async function POST(req: Request) {
  try {
    // 1) Опціональний PIN-захист
    const expectedPin =
      process.env.VISION_PIN || process.env.NEXT_PUBLIC_VISION_PIN || "";
    if (expectedPin) {
      const got = req.headers.get("x-pin") || "";
      if (got !== expectedPin) {
        return NextResponse.json(
          { ok: false, error: "Invalid PIN" },
          { status: 401 }
        );
      }
    }

    // 2) Читаємо multipart
    const form = await req.formData().catch(() => null);
    if (!form)
      return NextResponse.json(
        { ok: false, error: "Expected multipart/form-data" },
        { status: 400 }
      );

    const file = form.get("file");
    const roomId = String(form.get("roomId") || "").trim();
    const caption = String(form.get("caption") || "").trim();

    if (!roomId)
      return NextResponse.json(
        { ok: false, error: "roomId is required" },
        { status: 400 }
      );
    if (!(file instanceof File))
      return NextResponse.json(
        { ok: false, error: "file is required" },
        { status: 400 }
      );

    // 3) Готуємо буфер для upload_stream
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    const folder = `vision/${roomId}`;
    const publicId = `snap-${Date.now()}`;

    // 4) Завантаження в Cloudinary
    const result = await new Promise<any>((resolve, reject) => {
      const stream = cloudinary.uploader.upload_stream(
        {
          folder,
          public_id: publicId,
          resource_type: "image",
          overwrite: true,
          context: {
            room: roomId,
            caption,
          },
        },
        (err, res) => (err ? reject(err) : resolve(res))
      );
      stream.end(buffer);
    });

    return NextResponse.json({
      ok: true,
      roomId,
      public_id: result.public_id,
      url: result.secure_url,
      created_at: result.created_at,
    });
  } catch (e: any) {
    return NextResponse.json(
      { ok: false, error: e?.message || "upload error" },
      { status: 500 }
    );
  }
}
