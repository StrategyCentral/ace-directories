import type Stripe from "stripe";
import { db } from "./supabase";
import { stripe, stripeConfigured } from "./stripe";
import { revalidateListing } from "./revalidate-listing";
import { send } from "./email";
import { ADMIN_ALERT_TO } from "./claim-admin";
import { EXCLUSIVE_PLAN, INCLUDED, type Addon, type Founder } from "./addon-types";

const RANK: Record<string, number> = { featured: 500, verified: 250 };

export async function getAddons(): Promise<Addon[]> {
  const { data } = await db().from("addons").select("*").order("sort_order", { ascending: true });
  return (data as Addon[]) ?? [];
}

/* ------------------------------------------------------------------ founders */

let founderCache: { at: number; value: Founder | null } | null = null;

/**
 * The founding-firm offer. Stripe's coupon is the source of truth for how many
 * places are left, so the count on the page can never drift from what checkout
 * will actually honour.
 */
export async function getFounder(): Promise<Founder | null> {
  if (founderCache && Date.now() - founderCache.at < 120_000) return founderCache.value;
  let value: Founder | null = null;
  try {
    if (stripeConfigured()) {
      const { data } = await db().from("app_settings").select("value").eq("key", "founder_coupon").maybeSingle();
      const id = data?.value;
      if (id) {
        const c = await stripe().coupons.retrieve(id);
        const cap = c.max_redemptions ?? 0;
        const remaining = Math.max(0, cap - (c.times_redeemed ?? 0));
        value = {
          active: Boolean(c.valid) && remaining > 0 && Boolean(c.percent_off),
          remaining, cap,
          percent: c.percent_off ?? 0,
          months: c.duration_in_months ?? 0,
          coupon: c.id,
        };
      }
    }
  } catch (e) {
    console.error("founder lookup failed", e);
  }
  founderCache = { at: Date.now(), value };
  return value;
}

/* --------------------------------------------------------------- exclusivity */

export async function exclusiveHolder(suburbId: string, practiceSlug: string): Promise<string | null> {
  const { data } = await db().from("exclusivity")
    .select("listing_id").eq("suburb_id", suburbId).eq("practice_slug", practiceSlug)
    .is("ends_at", null).maybeSingle();
  return data?.listing_id ?? null;
}

/* -------------------------------------------------------------- entitlements */

interface PriceInfo { kind: "plan" | "addon"; code: string }

async function priceMap(): Promise<Record<string, PriceInfo>> {
  const supabase = db();
  const [{ data: plans }, { data: addons }] = await Promise.all([
    supabase.from("plans").select("code,stripe_price_monthly,stripe_price_yearly"),
    supabase.from("addons").select("code,stripe_price_monthly,stripe_price_yearly"),
  ]);
  const map: Record<string, PriceInfo> = {};
  for (const p of plans ?? []) {
    if (p.stripe_price_monthly) map[p.stripe_price_monthly] = { kind: "plan", code: p.code };
    if (p.stripe_price_yearly) map[p.stripe_price_yearly] = { kind: "plan", code: p.code };
  }
  for (const a of addons ?? []) {
    if (a.stripe_price_monthly) map[a.stripe_price_monthly] = { kind: "addon", code: a.code };
    if (a.stripe_price_yearly) map[a.stripe_price_yearly] = { kind: "addon", code: a.code };
  }
  return map;
}

export interface Entitlements {
  planCode: string | null;
  suburbSlots: number;
  teamSlots: number;
  exclusive: boolean;
}

export async function readSubscription(sub: Stripe.Subscription): Promise<Entitlements> {
  const map = await priceMap();
  const out: Entitlements = { planCode: null, suburbSlots: 0, teamSlots: 0, exclusive: false };
  for (const item of sub.items.data) {
    const info = map[item.price.id];
    if (!info) continue;
    const qty = item.quantity ?? 1;
    if (info.kind === "plan") out.planCode = info.code;
    else if (info.code === "extra_suburb") out.suburbSlots += qty;
    else if (info.code === "team_profile") out.teamSlots += qty;
    else if (info.code === "exclusive") out.exclusive = true;
  }
  return out;
}

/**
 * Make the listing match what the subscription pays for. Stripe is the source
 * of truth: this runs after checkout, after every subscription change, and
 * after any change made in the billing portal.
 */
export async function syncEntitlements(sub: Stripe.Subscription, listingIdHint?: string) {
  const supabase = db();
  const listingId = listingIdHint || sub.metadata?.listing_id;
  if (!listingId) return;

  const { data: listing } = await supabase.from("lawyers")
    .select("id,full_name,suburb_id,extra_suburb_ids,tier,plan_code").eq("id", listingId).maybeSingle();
  if (!listing) return;

  const active = sub.status === "active" || sub.status === "trialing" || sub.status === "past_due";
  const ent = active ? await readSubscription(sub) : { planCode: null, suburbSlots: 0, teamSlots: 0, exclusive: false };
  const plan = ent.planCode;
  const tier = plan && RANK[plan] ? plan : "free";
  const included = INCLUDED[plan ?? ""] ?? { suburbs: 0, team: 0 };
  const suburbAllowance = included.suburbs + ent.suburbSlots;
  const teamAllowance = included.team + ent.teamSlots;

  await supabase.from("lawyers").update({
    tier,
    plan_code: plan,
    rank_score: RANK[plan ?? ""] ?? 50,
    extra_suburb_slots: ent.suburbSlots,
    team_slots: ent.teamSlots,
    extra_suburb_ids: ((listing.extra_suburb_ids as string[]) ?? []).slice(0, suburbAllowance),
  }).eq("id", listingId);

  // Lawyer profiles: keep the oldest ones up to the allowance, hide the rest.
  const { data: team } = await supabase.from("lawyers")
    .select("id,status").eq("parent_listing_id", listingId)
    .in("status", ["live", "hidden"]).order("created_at", { ascending: true });
  for (const [i, m] of (team ?? []).entries()) {
    const want = i < teamAllowance ? "live" : "hidden";
    await supabase.from("lawyers")
      .update({ tier, rank_score: Math.max(0, (RANK[plan ?? ""] ?? 50) - 1), ...(m.status !== want ? { status: want } : {}) })
      .eq("id", m.id);
  }

  // Suburb Exclusive: hold the position while the add-on is paid for.
  const { data: held } = await supabase.from("exclusivity")
    .select("id,practice_slug").eq("listing_id", listingId).is("ends_at", null).maybeSingle();
  const wantExclusive = ent.exclusive && plan === EXCLUSIVE_PLAN;
  const wantPractice = sub.metadata?.exclusive_practice || null;

  if (held && (!wantExclusive || (wantPractice && wantPractice !== held.practice_slug))) {
    await supabase.from("exclusivity").update({ ends_at: new Date().toISOString() }).eq("id", held.id);
  }
  if (wantExclusive && wantPractice && listing.suburb_id && (!held || held.practice_slug !== wantPractice)) {
    const { data: area } = await supabase.from("practice_areas").select("id").eq("slug", wantPractice).maybeSingle();
    const { error } = await supabase.from("exclusivity").insert({
      listing_id: listingId, suburb_id: listing.suburb_id,
      practice_slug: wantPractice, practice_area_id: area?.id ?? null,
    });
    if (error) {
      // Two firms paid for the same position inside the same few seconds. The
      // database refused the second; a person has to refund or re-home it.
      console.error("exclusive slot conflict", error);
      await send({
        to: ADMIN_ALERT_TO, template: "claim-needs-review", listingId,
        subject: `ACTION: Suburb Exclusive conflict for ${listing.full_name}`,
        html: `<p>${listing.full_name} paid for Suburb Exclusive on <strong>${wantPractice}</strong> but that position was already held. Refund the add-on or move it. Subscription ${sub.id}.</p>`,
      });
    }
  }

  await revalidateListing(listingId);
}

/** What the dashboard needs to show a listing's plan and add-ons. */
export async function getBilling(subscriptionId: string | null | undefined) {
  if (!subscriptionId || !stripeConfigured()) return null;
  try {
    const sub = await stripe().subscriptions.retrieve(subscriptionId);
    if (sub.status !== "active" && sub.status !== "trialing" && sub.status !== "past_due") return null;
    const ent = await readSubscription(sub);
    const interval = sub.items.data.some((i) => i.price.recurring?.interval === "year") ? "year" : "month";
    return {
      interval: interval as "month" | "year",
      extra_suburb: ent.suburbSlots,
      team_profile: ent.teamSlots,
      exclusive: ent.exclusive ? (sub.metadata?.exclusive_practice || null) : null,
      cancelling: sub.cancel_at_period_end,
    };
  } catch (e) {
    console.error("getBilling failed", e);
    return null;
  }
}
