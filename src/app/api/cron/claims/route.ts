import { NextResponse } from "next/server";
import { db } from "@/lib/supabase";
import { claimExpiredEmail, claimReminderEmail, send } from "@/lib/email";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Runs the 72-hour claim clock: one reminder a day while a claim is open, and
 * removal of the unclaimed listing when the window closes.
 *
 * Schedule hourly. Reminders only fire ~20h after the last one, so an hourly
 * cadence never double-sends.
 */
const OPEN = ["started", "verifying", "awaiting_payment"];
// A claim can only put a listing at risk if the claimant proved control of an
// inbox at the firm's own domain. Everything else has no clock and is never
// removed — otherwise a stranger with a throwaway address could delete any
// firm in the directory.
const CAN_EXPIRE_LISTING = "domain";
const REMINDER_GAP_MS = 20 * 3_600_000;

export async function GET(req: Request) {
  const secret = process.env.CRON_SECRET;
  const auth = req.headers.get("authorization");
  const token = new URL(req.url).searchParams.get("token");
  if (!secret || (auth !== `Bearer ${secret}` && token !== secret)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const supabase = db();
  const now = new Date();
  const result = { expired: 0, released: 0, waiting: 0, reminded: 0, errors: [] as string[] };

  const { data: claims, error } = await supabase
    .from("claims")
    .select("id,listing_id,email,full_name,status,expires_at,emails_sent,last_email_at,verification_level")
    .in("status", OPEN);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  for (const claim of claims ?? []) {
    const { data: listing } = await supabase
      .from("lawyers")
      .select("id,slug,full_name,suburb,is_claimed")
      .eq("id", claim.listing_id)
      .maybeSingle();
    if (!listing) continue;

    // A claim that completed out of band (manual upgrade) needs no clock.
    if (listing.is_claimed) {
      await supabase.from("claims")
        .update({ status: "completed", completed_at: now.toISOString() })
        .eq("id", claim.id);
      continue;
    }

    const firstName = (claim.full_name ?? "there").split(/\s+/)[0];

    // No clock set means the claim is unverified or in manual review. Those sit
    // harmlessly until a human deals with them.
    if (!claim.expires_at) {
      result.waiting++;
      continue;
    }

    const expired = new Date(claim.expires_at).getTime() <= now.getTime();

    if (expired) {
      await supabase.from("claims")
        .update({ status: "expired", expired_at: now.toISOString() })
        .eq("id", claim.id);

      if (claim.verification_level === CAN_EXPIRE_LISTING) {
        // Soft removal: the row survives so the claim can be reinstated by hand,
        // but the page 404s and drops out of the sitemap and every listing query.
        await supabase.from("lawyers").update({ status: "removed" }).eq("id", listing.id);
      } else {
        // Reservation lapses, listing stays exactly as it was.
        result.released++;
        continue;
      }

      const mail = claimExpiredEmail({ firstName, firmName: listing.full_name });
      const sent = await send({
        to: claim.email, subject: mail.subject, html: mail.html,
        template: "claim-expired", listingId: listing.id, claimId: claim.id,
      });
      if ("error" in sent && sent.error) result.errors.push(`expire-mail ${claim.id}`);
      result.expired++;
      continue;
    }

    const lastEmail = claim.last_email_at ? new Date(claim.last_email_at).getTime() : 0;
    if (now.getTime() - lastEmail < REMINDER_GAP_MS) continue;

    const mail = claimReminderEmail({
      firstName,
      firmName: listing.full_name,
      slug: listing.slug,
      suburb: listing.suburb,
      expiresAt: claim.expires_at,
    });
    const sent = await send({
      to: claim.email, subject: mail.subject, html: mail.html,
      template: `claim-reminder-${(claim.emails_sent ?? 0) + 1}`,
      listingId: listing.id, claimId: claim.id,
    });
    if ("error" in sent && sent.error) {
      result.errors.push(`reminder-mail ${claim.id}`);
      continue;
    }

    await supabase.from("claims")
      .update({ emails_sent: (claim.emails_sent ?? 0) + 1, last_email_at: now.toISOString() })
      .eq("id", claim.id);
    result.reminded++;
  }

  return NextResponse.json({ ok: true, ...result, checked: claims?.length ?? 0 });
}
