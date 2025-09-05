import { NextResponse } from "next/server";
import { v2 as cloudinary } from "cloudinary";

cloudinary.config({
  cloud_name: process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME!,
  api_key: process.env.CLOUDINARY_API_KEY!,
  api_secret: process.env.CLOUDINARY_API_SECRET!,
});

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function bad(msg: string, status = 400) {
  return NextResponse.json({ ok: false, error: msg }, { status });
}

export async function POST(req: Request) {
  try {
    const ctype = req.headers.get("content-type") || "";

    // 1) MULTIPART (FormData з файлом)
    if (ctype.includes("multipart/form-data")) {
      const form = await req.formData();
      const file = form.get("file") as File | null;
      const roomId = String(form.get("roomId") || "default-room");
      const caption = String(form.get("caption") || "");

      if (!file) return bad('No "file" in form-data');

      const arrayBuf = await file.arrayBuffer();
      const buffer = Buffer.from(arrayBuf);
      const folder = `vision/${roomId}`;
      const publicId = `snap-${Date.now()}`;

      // з buffer — через upload_stream
      const uploaded = await new Promise<any>((resolve, reject) => {
        const stream = cloudinary.uploader.upload_stream(
          {
            folder,
            public_id: publicId,
            resource_type: "image",
            overwrite: true,
          },
          (err, result) => (err ? reject(err) : resolve(result))
        );
        stream.end(buffer);
      });

      return NextResponse.json({
        ok: true,
        url: uploaded.secure_url,
        public_id: uploaded.public_id,
        width: uploaded.width,
        height: uploaded.height,
        caption,
        roomId,
        createdAt: new Date(),
      });
    }

    // 2) JSON (dataUrl)
    if (ctype.includes("application/json")) {
      const { imageDataUrl, roomId = "default-room", caption = "" } = await req.json();

      if (!imageDataUrl || typeof imageDataUrl !== "string" || !imageDataUrl.startsWith("data:image"))
        return bad('Expected "imageDataUrl" data URL');

       const folder = `vision/${roomId}`;
       const publicId = `snap-${Date.now()}`;

      const uploaded = await cloudinary.uploader.upload(imageDataUrl, {
        folder,
        public_id: publicId,
        resource_type: "image",
        overwrite: true,
      });

      return NextResponse.json({
        ok: true,
        url: uploaded.secure_url,
        public_id: uploaded.public_id,
        width: uploaded.width,
        height: uploaded.height,
        caption,
        roomId,
      });
    }

    // Інакший content-type
    return bad('Content-Type was not one of "multipart/form-data" or "application/json".');
  } catch (e: any) {
    return NextResponse.json({ ok: false, error: e.message || "upload error" }, { status: 500 });
  }
}
