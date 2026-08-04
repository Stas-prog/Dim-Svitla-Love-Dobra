import { NextResponse } from "next/server";

import { searchKnowledge } from "@/lib/houseBrain";

export async function POST(req: Request) {
  const body = await req.json();

  const query = body.query?.trim();

  if (!query) {
    return NextResponse.json([]);
  }

  const result = await searchKnowledge(query);

  return NextResponse.json(result);
}