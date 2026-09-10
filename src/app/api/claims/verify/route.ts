import { NextResponse } from "next/server";
import { db } from "@/lib/supabase";
import { SITE, CLAIM_WINDOW_HOURS } from "@/lib/site";

export const runtime = "nodejs";

/**
 * The claimant clicks the link in their email. This is the only place the
 * 72-hour clock can start, and it only starts for a domain-verified claim —
 * meaning the person demonstrably controls an inbox at the firm's own domain.
 *
 * Anything else lands in manual review with no clock and no risk to the
 * listing, because a stranger should never be able to set a deletion timer
 * running on someone else's business.
 */
export async function GET(req: Request) {
  const token = new URL(req.url).searchParams.get("token");
  if (!token) return NextResponse.redirect(`${SITE.url}/claim?verify=invalid`);

  const supabase = db();
  const { data: claim } = await supabase
    .from("claims")
    .select("id,listing_id,status,verification_level,verified_at")
    .eq("verify_token", token)
    .maybeSingle();

  if (!claim) return NextResponse.redirect(`${SITE.url}/claim?verify=invalid`);

  const { data: listing } = await supabase
    .from("lawyers").select("slug").eq("id", claim.listing_id).maybeSingle();
  const slug = listing?.slug ?? "";
  const now = new Date();

  if (claim.verified_at) {
    return NextResponse.redirect(`${SITE.url}/claim/${slug}?verified=1`);
  }

  if (claim.verification_level === "domain") {
    await supabase.from("claims").update({
      verified_at: now.toISOString(),
      status: "awaiting_payment",
      clock_started_at: now.toISOString(),
      expires_at: new Date(now.getTime() + CLAIM_WINDOW_HOURS * 3_600_000).toISOString(),
      verify_token: null,
    }).eq("id", claim.id);
    return NextResponse.redirect(`${SITE.url}/claim/${slug}?verified=1`);
  }

  await supabase.from("claims").update({
    verified_at: now.toISOString(),
    status: "manual_review",
    verify_token: null,
  }).eq("id", claim.id);
  return NextResponse.redirect(`${SITE.url}/claim/${slug}?review=1`);
}
