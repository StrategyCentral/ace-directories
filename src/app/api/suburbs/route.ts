import { NextResponse } from "next/server";
import { searchSuburbs } from "@/lib/queries";

export const runtime = "nodejs";

export async function GET(req: Request) {
  const q = new URL(req.url).searchParams.get("q") ?? "";
  if (q.trim().length < 2) return NextResponse.json([]);
  try {
    const rows = await searchSuburbs(q.trim(), 8);
    return NextResponse.json(rows, {
      headers: { "cache-control": "public, s-maxage=3600, stale-while-revalidate=86400" },
    });
  } catch {
    return NextResponse.json([]);
  }
}
