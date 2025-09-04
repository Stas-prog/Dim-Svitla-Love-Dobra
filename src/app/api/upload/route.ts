import { NextResponse } from "next/server";
import { v2 as cloudinary } from "cloudinary";
import type { UploadApiResponse } from "@/types/upload";

// Конфіг Cloudinary
cloudinary.config({
  cloud_name: process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

export async function POST(req: Request) {
  try {
    const formData = await req.formData();
    const file = formData.get("file") as File | null;
    const folder = formData.get("folder")?.toString() || "vision";
    const publicId = formData.get("publicId")?.toString();
    const caption = formData.get("caption")?.toString();

    if (!file) {
      return NextResponse.json({ ok: false, error: "No file uploaded" }, { status: 400 });
    }

    // Читаємо файл у buffer
    const arrayBuffer = await file.arrayBuffer();
    const buf = Buffer.from(arrayBuffer);

    // Завантаження у Cloudinary
    const uploaded = await new Promise<UploadApiResponse>((resolve, reject) => {
      const stream = cloudinary.uploader.upload_stream(
        {
          folder,
          public_id: publicId,
          resource_type: "image",
          context: caption ? { caption } : undefined,
        },
        (err, res) => (err ? reject(err) : resolve(res!))
      );
      stream.end(buf);
    });

    return NextResponse.json({ ok: true, uploaded });
  } catch (e: any) {
    console.error("❌ Upload error:", e);
    return NextResponse.json({ ok: false, error: e.message }, { status: 500 });
  }
}
