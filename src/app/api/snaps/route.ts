import { NextResponse } from "next/server";
import { getDb } from "@/lib/mongo";
import cloudinary  from "@/lib/cloudinary";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";
export const revalidate = 0;

// GET: останні (нові зверху)
export async function GET() {
  const db = await getDb();
  const snaps = await db
    .collection("snaps")
    .find({}, { projection: { image: 0 } })  
    .sort({ createdAt: -1 })
    .limit(200)
    .toArray();

  return NextResponse.json(snaps);
}



export async function POST(req: Request) {
  try {
    const { roomId, clientId = "unknown", image, from } = await req.json();

    if (!roomId || !image || !String(image).startsWith("data:image/")) {
      return NextResponse.json({ error: "roomId та image(dataURL) обов’язкові" }, { status: 400 });
    }

    // 1) Upload to Cloudinary
    const uploaded = await cloudinary.uploader.upload(image, {
      folder: `dim_svitla/${roomId}`,
      // якщо хочеш оптимізацію по дефолту
      transformation: [{ quality: "auto", fetch_format: "auto" }],
    });

    // 2) Save meta to Mongo
    const db = await getDb();
    // десь у завантаженні/адмін-роуті
     await db.collection("snaps").createIndex({ roomId: 1, createdAt: -1 });
     await db.collection("snaps").createIndex({ publicId: 1 }, { unique: false });

    const result = await db.collection("snaps").insertOne({
      roomId,
      clientId,
      from,
      url: uploaded.secure_url,
      publicId: uploaded.public_id,
      width: uploaded.width,
      height: uploaded.height,
      bytes: uploaded.bytes,
      format: uploaded.format,
      createdAt: new Date(),
    });

    return NextResponse.json({ insertedId: result.insertedId, url: uploaded.secure_url });
  } catch (e: any) {
    console.error("POST /api/snaps error", e);
    return NextResponse.json({ error: e?.message || "Upload error" }, { status: 500 });
  }
}
