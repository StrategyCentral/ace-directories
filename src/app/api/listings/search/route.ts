import { NextResponse } from "next/server";
import { searchListings } from "@/lib/queries";

export const runtime = "nodejs";

export async function GET(req: Request) {
  const url = new URL(req.url);
  const q = (url.searchParams.get("q") ?? "").trim().slice(0, 64);
  const state = url.searchParams.get("state") ?? undefined;
  if (q.length < 2) return NextResponse.json({ rows: [], total: 0 });

  try {
    const { rows, total } = await searchListings({ q, state, perPage: 12 });
    const res = NextResponse.json({
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
    // Public, cacheable for an hour at any CDN in front of us (Cloudflare once proxied).
    // Without this every scraper query was an uncached Supabase round trip.
    res.headers.set("Cache-Control", "public, s-maxage=3600, stale-while-revalidate=86400");
    return res;
  } catch {
    return NextResponse.json({ rows: [], total: 0 });
  }
}
