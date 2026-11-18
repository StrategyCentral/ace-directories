import { NextResponse } from "next/server";
import { db } from "@/lib/supabase";
import { stripe, stripeConfigured } from "@/lib/stripe";
import { SITE } from "@/lib/site";
import { exclusiveHolder, getAddons, getFounder } from "@/lib/addons";
import { EXCLUSIVE_PLAN, MAX_QTY, type AddonSelection } from "@/lib/addon-types";

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
    supabase.from("lawyers").select("id,slug,full_name,stripe_customer_id,suburb_id,is_claimed,stripe_subscription_id,status").eq("id", listingId).maybeSingle(),
  ]);

  if (!plan) return NextResponse.json({ error: "Unknown plan" }, { status: 400 });
  if (!listing) return NextResponse.json({ error: "Unknown listing" }, { status: 404 });

  // Checkout is only for a verified claim on an unowned listing. Without this
  // anyone could buy a plan against a rival's listing_id and the webhook would
  // overwrite its tier and Stripe ids. Owners change plans via /api/billing/change.
  if (!claimId) {
    return NextResponse.json({ error: "Start a claim on this listing first" }, { status: 400 });
  }
  if (listing.status === "removed" || (listing.is_claimed && listing.stripe_subscription_id)) {
    return NextResponse.json({ error: "This listing has already been claimed" }, { status: 409 });
  }
  const { data: claim } = await supabase
    .from("claims").select("listing_id,email,expires_at,status,verified_at").eq("id", claimId).maybeSingle();
  if (!claim || claim.listing_id !== listing.id) {
    return NextResponse.json({ error: "Claim not found" }, { status: 404 });
  }
  if (claim.status !== "awaiting_payment" || !claim.verified_at || !claim.expires_at) {
    return NextResponse.json({ error: "Confirm your email before choosing a plan" }, { status: 403 });
  }
  if (new Date(claim.expires_at).getTime() < Date.now()) {
    return NextResponse.json({ error: "This claim window has closed" }, { status: 410 });
  }
  const claimEmail: string = claim.email;
  await supabase.from("claims")
    .update({ selected_plan: planCode })
    .eq("id", claimId)
    .eq("status", "awaiting_payment");

  // ---- order bumps: add-ons bought with the plan
  const want = (body.addons ?? {}) as AddonSelection;
  const addons = await getAddons();
  const addonLines: { price: string; quantity: number }[] = [];
  const clamp = (n: unknown, max: number) => Math.max(0, Math.min(max, Math.floor(Number(n) || 0)));
  const picked = {
    exclusive: want.exclusive ? String(want.exclusive) : "",
    extra_suburb: clamp(want.extra_suburb, MAX_QTY.extra_suburb),
    team_profile: clamp(want.team_profile, MAX_QTY.team_profile),
  };
  const priceOf = (code: string) => {
    const a = addons.find((x) => x.code === code);
    return (interval === "year" ? a?.stripe_price_yearly : a?.stripe_price_monthly) ?? null;
  };

  if (picked.exclusive) {
    if (planCode !== EXCLUSIVE_PLAN) {
      return NextResponse.json({ error: "Suburb Exclusive is available on the Featured plan" }, { status: 400 });
    }
    if (!listing.suburb_id) {
      return NextResponse.json({ error: "We need a suburb on this listing before it can hold an exclusive" }, { status: 400 });
    }
    const { data: area } = await supabase.from("practice_areas").select("slug").eq("slug", picked.exclusive).maybeSingle();
    if (!area) return NextResponse.json({ error: "Unknown practice area" }, { status: 400 });
    const holder = await exclusiveHolder(listing.suburb_id, picked.exclusive);
    if (holder && holder !== listing.id) {
      return NextResponse.json({ error: "That Suburb Exclusive has just been taken. Pick another practice area." }, { status: 409 });
    }
    const price = priceOf("exclusive");
    if (price) addonLines.push({ price, quantity: 1 });
  }
  for (const code of ["extra_suburb", "team_profile"] as const) {
    const price = priceOf(code);
    if (picked[code] > 0 && price) addonLines.push({ price, quantity: picked[code] });
  }

  const founder = await getFounder();
  const useFounder = Boolean(founder?.active);
  const meta = {
    listing_id: listingId, plan_code: planCode, claim_id: claimId ?? "",
    exclusive_practice: picked.exclusive, founder: useFounder ? "1" : "",
  };

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
        ...addonLines,
      ],
      payment_method_types: ["card"],
      // The founding-firm rate applies itself while places remain; otherwise
      // the buyer can enter a code. Stripe does not allow both on one session.
      ...(useFounder ? { discounts: [{ coupon: founder!.coupon }] } : { allow_promotion_codes: true }),
      // The operating entity is not registered for GST, so no tax is calculated.
      automatic_tax: { enabled: false },
      billing_address_collection: "required",
      subscription_data: { metadata: meta },
      metadata: meta,
      success_url: `${SITE.url}/claim/${listing.slug}/done?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${SITE.url}/claim/${listing.slug}?cancelled=1`,
    });

    return NextResponse.json({ url: session.url });
  } catch (e) {
    console.error("checkout session failed", e);
    return NextResponse.json({ error: "Could not open checkout — please try again" }, { status: 500 });
  }
}
