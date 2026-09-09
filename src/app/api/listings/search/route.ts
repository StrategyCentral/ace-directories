import { NextResponse } from "next/server";
import { searchListings } from "@/lib/queries";

export const runtime = "nodejs";

export async function GET(req: Request) {
  const url = new URL(req.url);
  const q = (url.searchParams.get("q") ?? "").trim();
  const state = url.searchParams.get("state") ?? undefined;
  if (q.length < 2) return NextResponse.json({ rows: [], total: 0 });

  try {
    const { rows, total } = await searchListings({ q, state, perPage: 12 });
    return NextResponse.json({
      total,
      rows: rows.map((r) => ({
        slug: r.slug,
        name: r.full_name,
        suburb: r.suburb,
        state: r.state,
        phone: r.phone,
        claimed: r.is_claimed,
      })),
    });
  } catch {
    return NextResponse.json({ rows: [], total: 0 });
  }
}
