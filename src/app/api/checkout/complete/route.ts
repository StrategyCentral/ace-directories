import { NextResponse } from "next/server";
import { stripe } from "@/lib/stripe";
import { db } from "@/lib/supabase";
import { setSession } from "@/lib/auth";
import { SITE } from "@/lib/site";

export const runtime = "nodejs";

/**
 * Stripe sends the buyer here after paying. We confirm the session really is
 * paid and recent, sign them in as the claim's email, and send them on to the
 * thank-you page. Without this, "Build my profile now" asked a customer who had
 * just paid to log in again.
 */
export async function GET(req: Request) {
  const id = new URL(req.url).searchParams.get("session_id") ?? "";
  let slug = "";
  try {
    const s = await stripe().checkout.sessions.retrieve(id);
    const listingId = s.metadata?.listing_id;
    if (listingId) {
      const { data: l } = await db().from("lawyers").select("slug").eq("id", listingId).maybeSingle();
      slug = l?.slug ?? "";
    }
    const fresh = Date.now() / 1000 - s.created < 3 * 3600;
    if (s.status === "complete" && s.payment_status !== "unpaid" && fresh && s.metadata?.claim_id) {
      const { data: claim } = await db().from("claims").select("email").eq("id", s.metadata.claim_id).maybeSingle();
      if (claim?.email) await setSession(claim.email);
    }
  } catch (e) {
    console.error("checkout complete failed", e);
  }
  return NextResponse.redirect(slug ? `${SITE.url}/claim/${slug}/done?session_id=${encodeURIComponent(id)}` : `${SITE.url}/dashboard`);
}
