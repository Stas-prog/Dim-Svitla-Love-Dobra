import { v2 as cloudinary } from "cloudinary";

cloudinary.config({
  cloud_name: process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

export default cloudinary;

// маленький helper для URL
export function clUrl(publicId: string, opts?: { w?: number; h?: number; fit?: "fill"|"pad"|"crop"|"scale"; q?: number; f?: string }) {
  const tr: string[] = [];
  if (opts?.w) tr.push(`w_${opts.w}`);
  if (opts?.h) tr.push(`h_${opts.h}`);
  if (opts?.fit) tr.push(`c_${opts.fit}`);
  if (opts?.q) tr.push(`q_${opts.q}`);
  if (opts?.f) tr.push(`f_${opts.f}`);
  const prefix = tr.length ? `${tr.join(",")}/` : "";
  return `https://res.cloudinary.com/${process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME}/image/upload/${prefix}${publicId}.jpg`;
}
