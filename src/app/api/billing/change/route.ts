import { NextResponse } from "next/server";
import type Stripe from "stripe";
import { db } from "@/lib/supabase";
import { stripe } from "@/lib/stripe";
import { requireOwner } from "@/lib/ownership";
import { exclusiveHolder, getAddons, syncEntitlements } from "@/lib/addons";
import { EXCLUSIVE_PLAN, MAX_QTY, type AddonSelection } from "@/lib/addon-types";

export const runtime = "nodejs";

/**
 * Change a live subscription from the dashboard: move between plans, or set
 * how many of each add-on the firm has. Increases are charged now, pro rata,
 * to the card on file; decreases are credited against the next invoice.
 *
 *   POST { listing_id, plan_code?, addons?: { exclusive?: slug|null, extra_suburb?: n, team_profile?: n } }
 */
export async function POST(req: Request) {
  const body = await req.json().catch(() => ({}));
  const listingId = String(body.listing_id ?? "");
  if (!(await requireOwner(listingId))) {
    return NextResponse.json({ error: "You don't manage that listing" }, { status: 403 });
  }

  const supabase = db();
  const { data: listing } = await supabase.from("lawyers")
    .select("id,suburb_id,stripe_subscription_id,plan_code").eq("id", listingId).maybeSingle();
  if (!listing?.stripe_subscription_id) {
    return NextResponse.json({ error: "No active subscription on this listing" }, { status: 400 });
  }

  const [{ data: plans }, addons] = await Promise.all([
    supabase.from("plans").select("code,stripe_price_monthly,stripe_price_yearly,is_public"),
    getAddons(),
  ]);
  const sub = await stripe().subscriptions.retrieve(listing.stripe_subscription_id);
  if (sub.status !== "active" && sub.status !== "trialing") {
    return NextResponse.json({ error: "This subscription isn't active. Open billing to fix the payment first." }, { status: 400 });
  }

  const planPrices = new Map<string, string>();
  for (const p of plans ?? []) {
    if (p.stripe_price_monthly) planPrices.set(p.stripe_price_monthly, p.code);
    if (p.stripe_price_yearly) planPrices.set(p.stripe_price_yearly, p.code);
  }
  const planItem = sub.items.data.find((i) => planPrices.has(i.price.id));
  if (!planItem) return NextResponse.json({ error: "Could not read your current plan" }, { status: 500 });
  const interval = planItem.price.recurring?.interval === "year" ? "year" : "month";
  const currentPlan = planPrices.get(planItem.price.id)!;
  const targetPlan = body.plan_code ? String(body.plan_code) : currentPlan;

  const items: Stripe.SubscriptionUpdateParams.Item[] = [];
  let increase = false;

  if (targetPlan !== currentPlan) {
    const p = (plans ?? []).find((x) => x.code === targetPlan && x.is_public);
    const price = interval === "year" ? p?.stripe_price_yearly : p?.stripe_price_monthly;
    if (!price) return NextResponse.json({ error: "Unknown plan" }, { status: 400 });
    items.push({ id: planItem.id, price });
    if (targetPlan === EXCLUSIVE_PLAN) increase = true;
  }

  const want = (body.addons ?? {}) as AddonSelection;
  const itemFor = (code: string) => {
    const a = addons.find((x) => x.code === code);
    const ids = [a?.stripe_price_monthly, a?.stripe_price_yearly];
    return sub.items.data.find((i) => ids.includes(i.price.id)) ?? null;
  };
  const priceFor = (code: string) => {
    const a = addons.find((x) => x.code === code);
    return (interval === "year" ? a?.stripe_price_yearly : a?.stripe_price_monthly) ?? null;
  };
  const setQty = (code: string, qty: number) => {
    const existing = itemFor(code);
    const had = existing?.quantity ?? 0;
    if (qty === had) return;
    if (qty > had) increase = true;
    if (existing) items.push(qty === 0 ? { id: existing.id, deleted: true } : { id: existing.id, quantity: qty });
    else {
      const price = priceFor(code);
      if (price && qty > 0) items.push({ price, quantity: qty });
    }
  };

  for (const code of ["extra_suburb", "team_profile"] as const) {
    if (want[code] === undefined) continue;
    setQty(code, Math.max(0, Math.min(MAX_QTY[code], Math.floor(Number(want[code]) || 0))));
  }

  let exclusivePractice = sub.metadata?.exclusive_practice ?? "";
  const hasExclusive = Boolean(itemFor("exclusive"));
  if (want.exclusive !== undefined) {
    if (want.exclusive) {
      const slug = String(want.exclusive);
      if (targetPlan !== EXCLUSIVE_PLAN) {
        return NextResponse.json({ error: "Suburb Exclusive needs the Featured plan" }, { status: 400 });
      }
      if (!listing.suburb_id) return NextResponse.json({ error: "This listing has no suburb set" }, { status: 400 });
      const { data: area } = await supabase.from("practice_areas").select("slug").eq("slug", slug).maybeSingle();
      if (!area) return NextResponse.json({ error: "Unknown practice area" }, { status: 400 });
      const holder = await exclusiveHolder(listing.suburb_id, slug);
      if (holder && holder !== listing.id) {
        return NextResponse.json({ error: "That Suburb Exclusive is already held by another firm" }, { status: 409 });
      }
      exclusivePractice = slug;
      setQty("exclusive", 1);
    } else {
      exclusivePractice = "";
      setQty("exclusive", 0);
    }
  } else if (hasExclusive && targetPlan !== EXCLUSIVE_PLAN) {
    return NextResponse.json({ error: "Remove Suburb Exclusive before moving off Featured" }, { status: 400 });
  }

  if (items.length === 0 && exclusivePractice === (sub.metadata?.exclusive_practice ?? "")) {
    return NextResponse.json({ ok: true, unchanged: true });
  }

  try {
    const updated = await stripe().subscriptions.update(sub.id, {
      items,
      metadata: { ...sub.metadata, plan_code: targetPlan, exclusive_practice: exclusivePractice },
      proration_behavior: increase ? "always_invoice" : "create_prorations",
      // If the card is declined nothing changes: no half-applied upgrade.
      payment_behavior: increase ? "error_if_incomplete" : "allow_incomplete",
    });
    await syncEntitlements(updated, listingId);
    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error("billing change failed", e);
    const msg = e instanceof Error && /card|payment|declin/i.test(e.message)
      ? "Your card was declined, so nothing was changed. Open billing to update it."
      : "Could not make that change. Nothing was charged.";
    return NextResponse.json({ error: msg }, { status: 402 });
  }
}
