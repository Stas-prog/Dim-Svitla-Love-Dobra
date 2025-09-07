export const dynamic = "force-dynamic";
export const runtime = "nodejs";

import { NextResponse } from "next/server";
import cloudinary from "@/lib/cloudinary";


export async function GET(_req: Request,  {
  params,
}: {
  params: Promise<{ roomId: string }>;
} ) {
      const { roomId } = await params;

  if (!roomId) return NextResponse.json({ items: [] });

  try {
    const res = await cloudinary.search
      .expression(`public_id:vision/${roomId}/* AND resource_type:image`)
      .sort_by("created_at","desc")
      .max_results(200)
      .execute();

    const items = (res.resources as any[]).map(r => ({
      publicId: r.public_id,
      url: r.secure_url,
      createdAt: r.created_at,
      width: r.width,
      height: r.height,
    }));

    return NextResponse.json({ items });
  } catch (e:any) {
    return NextResponse.json({ items: [], error: e.message }, { status: 500 });
  }
}
