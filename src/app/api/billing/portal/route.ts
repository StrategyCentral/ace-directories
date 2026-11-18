import { NextResponse } from "next/server";
import { db } from "@/lib/supabase";
import { stripe } from "@/lib/stripe";
import { SITE } from "@/lib/site";
import { requireOwner } from "@/lib/ownership";

export const runtime = "nodejs";

/** Opens Stripe's billing page: update the card, download invoices, cancel. */
export async function POST(req: Request) {
  const body = await req.json().catch(() => ({}));
  const listingId = String(body.listing_id ?? "");
  if (!(await requireOwner(listingId))) {
    return NextResponse.json({ error: "You don't manage that listing" }, { status: 403 });
  }
  const { data: listing } = await db().from("lawyers").select("stripe_customer_id").eq("id", listingId).maybeSingle();
  if (!listing?.stripe_customer_id) {
    return NextResponse.json({ error: "No billing account on this listing yet" }, { status: 400 });
  }
  try {
    const { data: cfg } = await db().from("app_settings").select("value").eq("key", "stripe_portal_config").maybeSingle();
    const session = await stripe().billingPortal.sessions.create({
      ...(cfg?.value ? { configuration: cfg.value } : {}),
      customer: listing.stripe_customer_id,
      return_url: `${SITE.url}/dashboard`,
    });
    return NextResponse.json({ url: session.url });
  } catch (e) {
    console.error("billing portal failed", e);
    return NextResponse.json(
      { error: `Could not open billing. Email ${SITE.supportEmail} and we'll make the change for you.` },
      { status: 500 },
    );
  }
}
