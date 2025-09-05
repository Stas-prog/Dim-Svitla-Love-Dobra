export const dynamic = "force-dynamic";
export const runtime = "nodejs";
export const revalidate = 0;

import { NextResponse } from "next/server";
import cloudinary from "@/lib/cloudinary";

type RoomItem = {
  roomId: string;
  path: string;
  lastUploadedAt: string | null;
};

// зібрати всі підпапки у "vision"
async function listRoomFolders(): Promise<{ name: string; path: string }[]> {
  const folders: { name: string; path: string }[] = [];
  let next: string | undefined = undefined;

  do {
    // @ts-ignore cloudinary типи для sub_folders мають слабку сигнатуру
    const resp = await cloudinary.api.sub_folders("vision", {
      next_cursor: next,
      max_results: 100,
    });
    const chunk = (resp?.folders || []).map((f: any) => ({
      name: f.name as string,
      path: f.path as string, // "vision/<roomId>"
    }));
    folders.push(...chunk);
    next = resp?.next_cursor;
  } while (next);

  return folders;
}

// дістаємо останній аплоад у папці
async function latestInFolder(path: string): Promise<string | null> {
  const res = await cloudinary.search
    .expression(`folder=${path} AND resource_type:image`)
    .sort_by("created_at", "desc")
    .max_results(1)
    .execute();

  const r = (res?.resources ?? [])[0] as { created_at?: string } | undefined;
  return r?.created_at ?? null;
}

export async function GET() {
  try {
    const folders = await listRoomFolders();
    const items: RoomItem[] = [];

    // послідовно, щоб не впертися у ліміти API; якщо треба — можна зробити batched
    for (const f of folders) {
      const last = await latestInFolder(f.path);
      items.push({
        roomId: f.name,
        path: f.path,
        lastUploadedAt: last,
      });
    }

    // новіші — вище
    items.sort((a, b) => {
      const A = a.lastUploadedAt || "";
      const B = b.lastUploadedAt || "";
      return A < B ? 1 : A > B ? -1 : 0;
    });

    return NextResponse.json({ ok: true, items });
  } catch (e: any) {
    return NextResponse.json({ ok: false, error: e?.message || "cloudinary error" }, { status: 500 });
  }
}
