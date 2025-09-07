import { v2 as cloudinary } from "cloudinary";

/**
 * Конфіг з .env
 * Обовʼязково:
 *   NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME
 *   CLOUDINARY_API_KEY
 *   CLOUDINARY_API_SECRET
 */
cloudinary.config({
  cloud_name: process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
  secure: true,
});

export type UrlOpts = {
  w?: number;
  h?: number;
  fit?: "fill" | "pad" | "crop" | "scale"; // map → crop
  q?: number; // quality
  f?: string; // fetch_format (e.g. "jpg" | "webp" | "auto")
};

/** Побудова трансформованого URL для публічного id */
export function cloudinaryUrl(publicId: string, opts: UrlOpts = {}) {
  const crop = opts.fit ?? "scale";
  const tr: Record<string, any> = { crop };

  if (opts.w) tr.width = opts.w;
  if (opts.h) tr.height = opts.h;
  if (opts.q) tr.quality = opts.q;
  if (opts.f) tr.fetch_format = opts.f;

  return cloudinary.url(publicId, {
    secure: true,
    resource_type: "image",
    transformation: [tr],
  });
}

/** Опції пошуку */
export type SearchOpts = {
  folder: string;             // напр. "vision/<roomId>" або "vision"
  max_results?: number;       // 10..200
  next_cursor?: string;       // для пагінації
  sort_by?: { created_at: "asc" | "desc" }[]; // тільки created_at потрібно
};

/**
 * Пошук через Cloudinary Search API:
 *   - expression: folder:<folder> AND resource_type:image
 *   - sort_by: created_at asc|desc
 *   - повертає { resources, next_cursor }
 */
export async function cldSearch(opts: SearchOpts): Promise<{ resources: any[]; next_cursor?: string | null }> {
  const max = Math.min(Math.max(opts.max_results ?? 100, 1), 200);

  // Побудова expression
  // Якщо хочеш у підпапки: `folder:${opts.folder}/*`
  const hasWildcard = opts.folder.endsWith("/*");
  const expression = `folder:${opts.folder}${hasWildcard ? "" : ""} AND resource_type:image`;

  let s = cloudinary.search
    .expression(expression)
    .max_results(max);

  // Сортування
  const dir = opts.sort_by?.[0]?.created_at ?? "desc";
  s = s.sort_by("created_at", dir);

  // Пагінація
  if (opts.next_cursor) {
    s = s.next_cursor(opts.next_cursor);
  }

  const res = await s.execute(); // { resources, next_cursor, total_count, ... }
  return { resources: res.resources || [], next_cursor: res.next_cursor || null };
}

export default cloudinary;
