import { NextResponse } from "next/server";
import { getDb } from "@/lib/mongo";
import {cloudinaryUrl} from "@/lib/cloudinary";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";
export const revalidate = 0;


type Body = {
  prompt?: string;
  roomId?: string;
  limit?: number;
  // опц. PIN, щоб уберегти ендпойнт від сторонніх
  pin?: string;
};

export async function POST(req: Request) {
  try {
    const { prompt = "", roomId = "", limit = 1, pin = "" } = (await req.json()) as Body;

    // 🔒 PIN (необов’язково). Якщо у .env.local є VISION_PIN — вимагаємо збіг.
    if (process.env.VISION_PIN) {
      const okPin = pin || req.headers.get("x-pin") || "";
      if (okPin !== process.env.VISION_PIN) {
        return NextResponse.json({ ok: false, error: "forbidden" }, { status: 403 });
      }
    }

    const db = await getDb();
    const col = db.collection("snaps"); // документи з { roomId, publicId, caption?, createdAt? }

    const filter: any = { publicId: { $exists: true, $ne: "" } };
    if (roomId) filter.roomId = roomId;

    const docs = await col
      .find(filter)
      .sort({ createdAt: -1 })
      .limit(Math.min(Math.max(limit, 1), 10))
      .toArray();

    const slides = docs.map((d) => {
      const id = d.publicId as string;
      return {
        id: String(d._id),
        roomId: d.roomId,
        caption: d.caption || "",
        createdAt: d.createdAt ?? null,
        thumb: cloudinaryUrl(id, { w: 360, h: 240, q: 70, f: "auto" }),
        view: cloudinaryUrl(id, { w: 1280, h: 720, q: 80, f: "auto" }),
        full: cloudinaryUrl(id, { w: 1920, h: 1080, q: 85, f: "auto" }),
      };
    });

    // 🔮 Поки що відповідаємо “людяно”: повертаємо слайди + eco-анонс аналізу.
    // Далі сюди можна під'єднати ML-опис кадру або модальне Q/A.
    return NextResponse.json({
      ok: true,
      prompt,
      count: slides.length,
      slides,
      message:
        slides.length === 0
          ? "Слайдів не знайдено. Зроби знімок у Vision → Mongo → Cloudinary."
          : "Слайди готові. Аналітику кадрів під’єднаємо наступним кроком.",
    });
  } catch (e: any) {
    return NextResponse.json({ ok: false, error: e.message || "server error" }, { status: 500 });
  }
}
