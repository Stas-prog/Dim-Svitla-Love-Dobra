import { NextResponse } from "next/server";
import cloudinary from "@/lib/cloudinary";

export async function GET() {
  try {
    const sub = await cloudinary.api.sub_folders("vision");
    let items: { roomId: string; path: string; lastUploadedAt?: string | null }[] =
      (sub.folders || []).map((f: { name: string; path: string }) => ({
        roomId: f.name,
        path: f.path,
        lastUploadedAt: null,
      }));

    if (items.length) {
      const res = await cloudinary.search
        .expression('folder="vision/*"')
        .aggregate("folder")
        .sort_by("uploaded_at", "desc")
        .max_results(1000)
        .execute();

      const lastByFolder = new Map<string, string>();
      for (const r of res.resources || []) {
        const folder = r.folder as string;
        if (!lastByFolder.has(folder)) lastByFolder.set(folder, r.created_at);
      }

      items = items.map((it) => ({
        ...it,
        lastUploadedAt: lastByFolder.get(it.path) || null,
      }))
      .sort((a, b) =>
        (b.lastUploadedAt || "").localeCompare(a.lastUploadedAt || "")
      );
    }

    return NextResponse.json({ ok: true, items });
  } catch (e: any) {
    return NextResponse.json({ ok: true, items: [] });
  }
}
