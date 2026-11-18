import { NextResponse } from "next/server";
import { db } from "@/lib/supabase";

export const runtime = "nodejs";

/** Which practice areas already have a Suburb Exclusive holder in this listing's suburb. */
export async function GET(req: Request) {
  const listingId = new URL(req.url).searchParams.get("listing") ?? "";
  const supabase = db();
  const { data: listing } = await supabase.from("lawyers").select("id,suburb_id").eq("id", listingId).maybeSingle();
  if (!listing?.suburb_id) return NextResponse.json({ taken: [], mine: null });
  const { data } = await supabase.from("exclusivity")
    .select("listing_id,practice_slug").eq("suburb_id", listing.suburb_id).is("ends_at", null);
  return NextResponse.json({
    taken: (data ?? []).filter((r) => r.listing_id !== listing.id).map((r) => r.practice_slug),
    mine: (data ?? []).find((r) => r.listing_id === listing.id)?.practice_slug ?? null,
  });
}
