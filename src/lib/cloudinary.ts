import { v2 as cloudinary } from "cloudinary";

cloudinary.config({
  cloud_name: process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME!,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
  secure: true,
});

export { cloudinary };

export function cloudinaryUrl(
  publicId: string,
  opts?: { w?: number; h?: number; fit?: "fill" | "pad" | "crop" | "scale"; q?: number; f?: string }
) {
  const cloud = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME!;
  const w = opts?.w ? `w_${opts.w}` : "";
  const h = opts?.h ? `,h_${opts.h}` : "";
  const fit = opts?.fit ? `,c_${opts.fit}` : ",c_fill";
  const q = opts?.q ? `,q_${opts.q}` : ",q_auto";
  const f = opts?.f ? `,f_${opts.f}` : ""; // f=auto
  const trans = `/${[w && w.replace(",", ""), h && h.replace(",", ""), fit.replace(",", ""), q.replace(",", ""), f.replace(",", "")]
    .filter(Boolean)
    .join(",")}/`.replace("//", "/");

  const hasExt = /\.[a-z0-9]+$/i.test(publicId);
  const suffix = hasExt ? "" : ".jpg";

  return `https://res.cloudinary.com/${cloud}/image/upload${trans}${publicId}${suffix}`;
}