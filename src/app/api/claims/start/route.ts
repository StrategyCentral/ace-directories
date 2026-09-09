import { NextResponse } from "next/server";
import { randomUUID } from "crypto";
import { db } from "@/lib/supabase";
import { claimStartedEmail, send } from "@/lib/email";
import { CLAIM_WINDOW_HOURS } from "@/lib/site";

export const runtime = "nodejs";

const FREE_MAIL = new Set([
  "gmail.com", "hotmail.com", "outlook.com", "yahoo.com", "yahoo.com.au",
  "bigpond.com", "icloud.com", "live.com", "me.com", "optusnet.com.au",
]);

export async function POST(req: Request) {
  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }

  const listingId = String(body.listing_id ?? "");
  const email = String(body.email ?? "").trim().toLowerCase();
  const fullName = String(body.full_name ?? "").trim();

  if (!listingId || !fullName) {
    return NextResponse.json({ error: "Missing details" }, { status: 400 });
  }
  if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) {
    return NextResponse.json({ error: "Please use a valid email address" }, { status: 400 });
  }

  const supabase = db();

  const { data: listing } = await supabase
    .from("lawyers")
    .select("id,slug,full_name,is_claimed,status,suburb,state")
    .eq("id", listingId)
    .maybeSingle();

  if (!listing || listing.status === "removed") {
    return NextResponse.json({ error: "That listing is no longer available" }, { status: 404 });
  }
  if (listing.is_claimed) {
    return NextResponse.json({ error: "This listing has already been claimed" }, { status: 409 });
  }

  // Someone else may already hold the reservation.
  const { data: open } = await supabase
    .from("claims")
    .select("id,email,expires_at")
    .eq("listing_id", listingId)
    .in("status", ["started", "verifying", "awaiting_payment"])
    .gt("expires_at", new Date().toISOString())
    .maybeSingle();

  if (open && open.email !== email) {
    return NextResponse.json(
      { error: "Someone from this firm has already started a claim. Contact us if that wasn't authorised." },
      { status: 409 },
    );
  }
  if (open) {
    return NextResponse.json({ claim_id: open.id, expires_at: open.expires_at, resumed: true });
  }

  const expiresAt = new Date(Date.now() + CLAIM_WINDOW_HOURS * 3_600_000).toISOString();

  const { data: claim, error } = await supabase
    .from("claims")
    .insert({
      listing_id: listingId,
      email,
      full_name: fullName,
      phone: String(body.phone ?? "").slice(0, 40) || null,
      role_at_firm: String(body.role_at_firm ?? "").slice(0, 120) || null,
      status: "awaiting_payment",
      verify_token: randomUUID(),
      expires_at: expiresAt,
      emails_sent: 1,
      last_email_at: new Date().toISOString(),
      ip: req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? null,
      user_agent: req.headers.get("user-agent")?.slice(0, 300) ?? null,
    })
    .select("id,expires_at")
    .single();

  if (error || !claim) {
    console.error("claim insert failed", error);
    return NextResponse.json({ error: "Could not start the claim — please try again" }, { status: 500 });
  }

  // The listing stays `live` while a claim runs — pulling it from search would
  // cost rankings for a claim that may never complete. The claim row is the
  // record that a reservation is in force.
  const domain = email.split("@")[1];
  const firstName = fullName.split(/\s+/)[0];
  const mail = claimStartedEmail({
    firstName,
    firmName: listing.full_name,
    slug: listing.slug,
    expiresAt: claim.expires_at,
  });
  await send({
    to: email,
    subject: mail.subject,
    html: mail.html,
    template: "claim-started",
    listingId,
    claimId: claim.id,
  });

  return NextResponse.json({
    claim_id: claim.id,
    expires_at: claim.expires_at,
    work_email: !FREE_MAIL.has(domain),
  });
}
