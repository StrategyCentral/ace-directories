import { NextResponse } from "next/server";
import { db } from "@/lib/supabase";
import { getSession } from "@/lib/auth";
import { isPaid } from "@/lib/types";

export const runtime = "nodejs";

/** Fields a firm may edit on its own listing. Everything else is read-only. */
const EDITABLE = [
  "tagline", "bio", "website", "email", "phone", "logo_url", "photo_url",
  "founded_year", "team_size", "languages", "accreditations", "socials", "video_url",
] as const;

const PLAN_AREA_LIMIT: Record<string, number> = {
  verified: 3, featured: 8, dominator: 99, firm: 99,
};

export async function PATCH(req: Request) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Not signed in" }, { status: 401 });

  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }

  const listingId = String(body.listing_id ?? "");
  const supabase = db();

  // Ownership is proven by a completed claim on this listing from this address.
  const { data: claim } = await supabase
    .from("claims")
    .select("id")
    .eq("listing_id", listingId)
    .eq("email", session.email)
    .eq("status", "completed")
    .maybeSingle();

  if (!claim) return NextResponse.json({ error: "You don't manage that listing" }, { status: 403 });

  const { data: listing } = await supabase
    .from("lawyers").select("tier,plan_code").eq("id", listingId).maybeSingle();
  if (!listing) return NextResponse.json({ error: "Listing not found" }, { status: 404 });

  const patch: Record<string, unknown> = { updated_at: new Date().toISOString() };
  for (const field of EDITABLE) {
    if (field in body) patch[field] = body[field] === "" ? null : body[field];
  }

  // Practice areas are capped by plan — that cap is a paid feature, so enforce
  // it server-side rather than trusting the form.
  if (Array.isArray(body.practice_areas)) {
    if (!isPaid(listing.tier)) {
      return NextResponse.json({ error: "Upgrade to edit practice areas" }, { status: 403 });
    }
    const limit = PLAN_AREA_LIMIT[listing.plan_code ?? "verified"] ?? 1;
    const areas = (body.practice_areas as string[]).slice(0, limit);
    patch.practice_areas = areas;
  }

  const { error } = await supabase.from("lawyers").update(patch).eq("id", listingId);
  if (error) {
    console.error("listing update failed", error);
    return NextResponse.json({ error: "Could not save" }, { status: 500 });
  }

  // Keep the completeness score honest after every edit.
  await supabase.rpc("recompute_profile_score", { listing: listingId }).then(
    () => undefined,
    () => undefined,
  );

  return NextResponse.json({ ok: true });
}
