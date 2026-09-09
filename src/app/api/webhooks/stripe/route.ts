import { NextResponse } from "next/server";
import type Stripe from "stripe";
import { db } from "@/lib/supabase";
import { stripe } from "@/lib/stripe";
import { claimCompletedEmail, send } from "@/lib/email";

export const runtime = "nodejs";

/** Tier granted by each plan — drives ranking and which profile fields unlock. */
const PLAN_TIER: Record<string, string> = {
  verified: "verified",
  featured: "featured",
  dominator: "dominator",
  firm: "firm",
};

export async function POST(req: Request) {
  const secret = process.env.STRIPE_WEBHOOK_SECRET;
  const signature = req.headers.get("stripe-signature");
  if (!secret || !signature) {
    return NextResponse.json({ error: "Webhook not configured" }, { status: 503 });
  }

  const raw = await req.text();
  let event: Stripe.Event;
  try {
    event = stripe().webhooks.constructEvent(raw, signature, secret);
  } catch (e) {
    console.error("stripe signature verification failed", e);
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }

  const supabase = db();

  try {
    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object as Stripe.Checkout.Session;
        const listingId = session.metadata?.listing_id;
        const planCode = session.metadata?.plan_code ?? "verified";
        const claimId = session.metadata?.claim_id || null;
        if (!listingId) break;

        const tier = PLAN_TIER[planCode] ?? "verified";
        const now = new Date().toISOString();

        await supabase
          .from("lawyers")
          .update({
            tier,
            plan_code: planCode,
            is_claimed: true,
            claimed_at: now,
            verified_at: now,
            status: "live",
            stripe_customer_id: typeof session.customer === "string" ? session.customer : null,
            stripe_subscription_id:
              typeof session.subscription === "string" ? session.subscription : null,
            rank_score:
              tier === "dominator" ? 1000 : tier === "featured" ? 500 : tier === "firm" ? 900 : 250,
          })
          .eq("id", listingId);

        await supabase.from("subscriptions").insert({
          listing_id: listingId,
          plan_code: planCode,
          status: "active",
          stripe_subscription_id:
            typeof session.subscription === "string" ? session.subscription : null,
          stripe_customer_id: typeof session.customer === "string" ? session.customer : null,
        });

        if (claimId) {
          await supabase
            .from("claims")
            .update({ status: "completed", completed_at: now })
            .eq("id", claimId);
        }

        const { data: listing } = await supabase
          .from("lawyers").select("full_name,slug").eq("id", listingId).maybeSingle();
        const to = session.customer_details?.email || session.customer_email;
        if (to && listing) {
          const { data: plan } = await supabase
            .from("plans").select("name").eq("code", planCode).maybeSingle();
          const mail = claimCompletedEmail({
            firstName: (session.customer_details?.name ?? "there").split(/\s+/)[0],
            firmName: listing.full_name,
            slug: listing.slug,
            planName: plan?.name ?? "Verified",
          });
          await send({
            to, subject: mail.subject, html: mail.html,
            template: "claim-completed", listingId, claimId: claimId ?? undefined,
          });
        }
        break;
      }

      case "customer.subscription.updated":
      case "customer.subscription.deleted": {
        const sub = event.data.object as Stripe.Subscription;
        const listingId = sub.metadata?.listing_id;
        const active = sub.status === "active" || sub.status === "trialing";

        await supabase
          .from("subscriptions")
          .update({
            status: sub.status,
            cancel_at_period_end: sub.cancel_at_period_end,
            current_period_end: sub.current_period_end
              ? new Date(sub.current_period_end * 1000).toISOString()
              : null,
          })
          .eq("stripe_subscription_id", sub.id);

        // Losing the subscription drops the listing back to a free profile —
        // it stays in the directory, it just loses the paid fields and ranking.
        if (!active && listingId) {
          await supabase
            .from("lawyers")
            .update({ tier: "free", plan_code: null, rank_score: 50 })
            .eq("id", listingId);
        }
        break;
      }

      default:
        break;
    }
  } catch (e) {
    console.error(`stripe webhook ${event.type} failed`, e);
    return NextResponse.json({ error: "Handler failed" }, { status: 500 });
  }

  return NextResponse.json({ received: true });
}
