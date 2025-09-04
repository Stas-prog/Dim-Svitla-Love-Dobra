// app/api/slides/route.ts
import { NextResponse } from "next/server";
import { getDb } from "@/lib/mongo";

// Якщо ти вже зробив helper у lib/cloudinary.ts — імпортуй його замість локальної функції.
// import { cloudinaryUrl } from "@/lib/cloudinary";

type SlideDoc = {
  _id?: any;
  roomId: string;
  publicId: string;       // Cloudinary public_id
  format?: string;        // "jpg" | "png" | ...
  width?: number;
  height?: number;
  caption?: string;
  createdAt?: string | Date;
};

function cloudinaryUrl(
  publicId: string,
  opts?: { w?: number; h?: number; fit?: "fill" | "pad" | "crop" | "scale"; q?: number; f?: string }
) {
  // ✅ Найпростіший варіант без SDK: посилання через env
  // В .env.local обов'язково має бути:
  // NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME=xxxxx
  const cloud = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME!;
  const w = opts?.w ? `w_${opts.w}` : "";
  const h = opts?.h ? `,h_${opts.h}` : "";
  const fit = opts?.fit ? `,c_${opts.fit}` : ",c_fill";
  const q = opts?.q ? `,q_${opts.q}` : ",q_auto";
  const f = opts?.f ? `,f_${opts.f}` : ""; // наприклад f=auto
  const trans = `/${[w && w.replace(",", ""), h && h.replace(",", ""), fit.replace(",", ""), q.replace(",", ""), f.replace(",", "")]
    .filter(Boolean)
    .join(",")}/`.replace("//", "/");

  // publicId може містити папки, формат Cloudinary: https://res.cloudinary.com/<cloud>/image/upload/<transforms>/<publicId>.<format?>
  // Якщо publicId вже з розширенням — не додаємо .jpg
  const hasExt = /\.[a-z0-9]+$/i.test(publicId);
  const suffix = hasExt ? "" : ".jpg";

  return `https://res.cloudinary.com/${cloud}/image/upload${trans}${publicId}${suffix}`;
}

export async function GET(req: Request) {
  try {
    const url = new URL(req.url);

    // ?roomId=xxx (необов'язково). Якщо порожній — усі кімнати.
    const roomId = (url.searchParams.get("roomId") || "").trim();

    // Пагінація
    const page = Math.max(parseInt(url.searchParams.get("page") || "1", 10), 1);
    const pageSize = Math.min(Math.max(parseInt(url.searchParams.get("pageSize") || "24", 10), 1), 100);

    const db = await getDb();
    const col = db.collection<SlideDoc>("snaps"); // ✅ тепер читаємо з `snaps`

    const filter: any = { publicId: { $exists: true, $ne: "" } };
    if (roomId) filter.roomId = roomId;

    const total = await col.countDocuments(filter);
    const items = await col
      .find(filter)
      .sort({ createdAt: -1 })
      .skip((page - 1) * pageSize)
      .limit(pageSize)
      .toArray();

    // Готуємо слайди з responsive-URL’ами
    const slides = items.map((doc) => {
      const id = doc.publicId;
      return {
        id: String(doc._id),
        roomId: doc.roomId,
        caption: doc.caption || "",
        createdAt: doc.createdAt || null,

        // прев’ю для гріду (швидко й легко)
        thumb: cloudinaryUrl(id, { w: 360, h: 240, fit: "fill", q: 70, f: "auto" }),
        // слайд у каруселі
        slide: cloudinaryUrl(id, { w: 1280, h: 720, fit: "fill", q: 80, f: "auto" }),
        // оригінал/великий перегляд (опційно)
        full: cloudinaryUrl(id, { w: 1920, h: 1080, fit: "fill", q: 85, f: "auto" }),
      };
    });

    return NextResponse.json({
      ok: true,
      page,
      pageSize,
      total,
      totalPages: Math.max(Math.ceil(total / pageSize), 1),
      slides,
    });
  } catch (e: any) {
    console.error("GET /api/slides error:", e);
    return NextResponse.json({ ok: false, error: e.message || "Server error" }, { status: 500 });
  }
}
