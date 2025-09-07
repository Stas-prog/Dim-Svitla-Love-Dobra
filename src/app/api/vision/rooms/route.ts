import { NextResponse } from "next/server";
import { cldSearch } from "@/lib/cloudinary";

// GET /api/vision/rooms?limit=200
export async function GET(req: Request) {
  try {
    const url = new URL(req.url);
    const limit = Math.min(parseInt(url.searchParams.get("limit") || "200", 10) || 200, 500);

    // Беремо останні зображення з УСІХ кімнат: folder:vision/*
    // Сортуємо за новизною, щоб легше було скласти "lastUploadedAt" по кімнатах
    const { resources, next_cursor } = await cldSearch({
      folder: "vision/*", // ← важливо: ловимо всі підпапки
      max_results: limit,
      sort_by: [{ created_at: "desc" }],
    });

    // Групуємо по roomId, який витягуємо з public_id: "vision/<roomId>/file"
    type Room = { roomId: string; path: string; lastUploadedAt: string | null };
    const map = new Map<string, Room>();

    for (const r of resources || []) {
      const pid: string = r.public_id || "";
      // public_id має формат "vision/<roomId>/filename"
      const parts = pid.split("/");
      if (parts.length < 3 || parts[0] !== "vision") continue;
      const roomId = parts[1];

      const existing = map.get(roomId);
      const createdAt = r.created_at || null;
      if (!existing) {
        map.set(roomId, {
          roomId,
          path: `vision/${roomId}`,
          lastUploadedAt: createdAt,
        });
      }
    }

    const items = Array.from(map.values())
      .sort((a, b) => {
        const ta = a.lastUploadedAt ? Date.parse(a.lastUploadedAt) : 0;
        const tb = b.lastUploadedAt ? Date.parse(b.lastUploadedAt) : 0;
        return tb - ta;
      });

    return NextResponse.json({ items, nextCursor: next_cursor || null });
  } catch (e: any) {
    return NextResponse.json({ items: [], nextCursor: null, error: e?.message || "rooms failed" }, { status: 500 });
  }
}
