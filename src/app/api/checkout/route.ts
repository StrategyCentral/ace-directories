import { NextResponse } from "next/server";
import { db } from "@/lib/supabase";
import { stripe, stripeConfigured } from "@/lib/stripe";
import { SITE } from "@/lib/site";

export const runtime = "nodejs";

export async function POST(req: Request) {
  if (!stripeConfigured()) {
    return NextResponse.json(
      { error: "Payments aren't switched on yet. Email us and we'll set you up manually." },
      { status: 503 },
    );
  }

  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }

  const claimId = body.claim_id ? String(body.claim_id) : null;
  const listingId = String(body.listing_id ?? "");
  const planCode = String(body.plan_code ?? "");
  const interval = body.interval === "year" ? "year" : "month";

  const supabase = db();
  const [{ data: plan }, { data: listing }] = await Promise.all([
    supabase.from("plans").select("*").eq("code", planCode).maybeSingle(),
    supabase.from("lawyers").select("id,slug,full_name,stripe_customer_id").eq("id", listingId).maybeSingle(),
  ]);

  if (!plan) return NextResponse.json({ error: "Unknown plan" }, { status: 400 });
  if (!listing) return NextResponse.json({ error: "Unknown listing" }, { status: 404 });

  let claimEmail: string | undefined;
  if (claimId) {
    const { data: claim } = await supabase
      .from("claims").select("email,expires_at,status").eq("id", claimId).maybeSingle();
    if (!claim) return NextResponse.json({ error: "Claim not found" }, { status: 404 });
    if (new Date(claim.expires_at).getTime() < Date.now()) {
      return NextResponse.json({ error: "This claim window has closed" }, { status: 410 });
    }
    claimEmail = claim.email;
    await supabase.from("claims")
      .update({ selected_plan: planCode, status: "awaiting_payment" })
      .eq("id", claimId);
  }

  const priceId = interval === "year" ? plan.stripe_price_yearly : plan.stripe_price_monthly;
  const unitAmount = interval === "year" ? plan.yearly_price : plan.monthly_price;

  try {
    const session = await stripe().checkout.sessions.create({
      mode: "subscription",
      customer: listing.stripe_customer_id || undefined,
      customer_email: listing.stripe_customer_id ? undefined : claimEmail,
      line_items: [
        priceId
          ? { price: priceId, quantity: 1 }
          : {
              // No Stripe price configured yet — build one inline from the DB so
              // checkout still works before the catalogue is wired up.
              quantity: 1,
              price_data: {
                currency: "aud",
                unit_amount: unitAmount,
                recurring: { interval },
                product_data: {
                  name: `${SITE.shortName} ${plan.name} — ${listing.full_name}`,
                  description: plan.tagline ?? undefined,
                },
              },
            },
      ],
      allow_promotion_codes: true,
      automatic_tax: { enabled: false },
      subscription_data: {
        metadata: { listing_id: listingId, plan_code: planCode, claim_id: claimId ?? "" },
      },
      metadata: { listing_id: listingId, plan_code: planCode, claim_id: claimId ?? "" },
      success_url: `${SITE.url}/claim/${listing.slug}/done?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${SITE.url}/claim/${listing.slug}?cancelled=1`,
    });

    return NextResponse.json({ url: session.url });
  } catch (e) {
    console.error("checkout session failed", e);
    return NextResponse.json({ error: "Could not open checkout — please try again" }, { status: 500 });
  }
}
