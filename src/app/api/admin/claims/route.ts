import { NextResponse } from "next/server";
import { db } from "@/lib/supabase";
import { requireAdmin } from "@/lib/admin";
import { validClaimSig } from "@/lib/claim-admin";
import { claimApprovedEmail, send } from "@/lib/email";
import { CLAIM_WINDOW_HOURS } from "@/lib/site";

export const runtime = "nodejs";

/**
 * Approve or decline a claim that is waiting in manual review.
 *
 * Approval opens the same 72-hour window a domain-verified claim gets, but the
 * claim keeps verification_level "manual" — so if the window lapses the hold is
 * released and the listing is left alone, never removed.
 */
export async function POST(req: Request) {
  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }

  const id = String(body.claim_id ?? "");
  const action = String(body.action ?? "");
  if (!["approve", "decline"].includes(action)) {
    return NextResponse.json({ error: "Unknown action" }, { status: 400 });
  }

  const allowed = validClaimSig(id, String(body.sig ?? "")) || Boolean(await requireAdmin());
  if (!allowed) return NextResponse.json({ error: "Not authorised" }, { status: 403 });

  const supabase = db();
  const { data: claim } = await supabase
    .from("claims").select("id,listing_id,email,full_name,status").eq("id", id).maybeSingle();
  if (!claim) return NextResponse.json({ error: "Not found" }, { status: 404 });
  if (claim.status !== "manual_review") {
    return NextResponse.json({ error: `Already ${claim.status.replace("_", " ")}` }, { status: 409 });
  }

  if (action === "decline") {
    const { error } = await supabase.from("claims").update({ status: "declined" }).eq("id", id);
    if (error) return NextResponse.json({ error: "Could not save" }, { status: 500 });
    return NextResponse.json({ ok: true, status: "declined" });
  }

  const now = new Date();
  const expiresAt = new Date(now.getTime() + CLAIM_WINDOW_HOURS * 3_600_000).toISOString();
  const { error } = await supabase.from("claims").update({
    status: "awaiting_payment",
    clock_started_at: now.toISOString(),
    expires_at: expiresAt,
    emails_sent: 1,
    last_email_at: now.toISOString(),
  }).eq("id", id);
  if (error) return NextResponse.json({ error: "Could not save" }, { status: 500 });

  const { data: listing } = await supabase
    .from("lawyers").select("full_name,slug").eq("id", claim.listing_id).maybeSingle();
  let emailed = false;
  if (listing) {
    const mail = claimApprovedEmail({
      firstName: (claim.full_name ?? "there").split(/\s+/)[0],
      firmName: listing.full_name,
      slug: listing.slug,
      expiresAt,
    });
    const sent = await send({
      to: claim.email, subject: mail.subject, html: mail.html,
      template: "claim-approved", listingId: claim.listing_id, claimId: id,
    });
    emailed = "id" in sent && Boolean(sent.id);
  }
  return NextResponse.json({ ok: true, status: "awaiting_payment", emailed });
}
