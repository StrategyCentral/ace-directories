import { NextResponse } from "next/server";
import { randomUUID } from "crypto";
import { db } from "@/lib/supabase";
import { claimVerifyEmail, send } from "@/lib/email";

export const runtime = "nodejs";

const FREE_MAIL = new Set([
  "gmail.com", "hotmail.com", "hotmail.com.au", "outlook.com", "outlook.com.au",
  "yahoo.com", "yahoo.com.au", "bigpond.com", "bigpond.net.au", "icloud.com",
  "live.com", "live.com.au", "me.com", "optusnet.com.au", "iinet.net.au",
  "tpg.com.au", "aol.com", "proton.me", "protonmail.com", "gmx.com",
]);

/** Max claims we'll accept from one IP in 24h — blunt, but stops mass abuse. */
const IP_LIMIT = 5;

const hostOf = (url: string | null) => {
  if (!url) return null;
  try {
    return new URL(url.startsWith("http") ? url : `https://${url}`)
      .hostname.toLowerCase().replace(/^www\./, "");
  } catch {
    return null;
  }
};

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
  const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? null;

  if (ip) {
    const { data: recent } = await supabase.rpc("claims_from_ip", { addr: ip, window_hours: 24 });
    if (Number(recent ?? 0) >= IP_LIMIT) {
      return NextResponse.json(
        { error: "Too many claims from this connection today. Contact us and we'll sort it out." },
        { status: 429 },
      );
    }
  }

  const { data: listing } = await supabase
    .from("lawyers")
    .select("id,slug,full_name,is_claimed,status,suburb,state,website,email")
    .eq("id", listingId)
    .maybeSingle();

  if (!listing || listing.status === "removed") {
    return NextResponse.json({ error: "That listing is no longer available" }, { status: 404 });
  }
  if (listing.is_claimed) {
    return NextResponse.json({ error: "This listing has already been claimed" }, { status: 409 });
  }

  // A listing is only reserved by a *verified* claim. An unverified submission
  // reserves nothing, so a stranger can't lock the real firm out of its page.
  const { data: reserved } = await supabase.rpc("listing_is_reserved", { target: listingId });
  if (reserved) {
    const { data: holder } = await supabase
      .from("claims").select("email").eq("listing_id", listingId)
      .not("verified_at", "is", null)
      .in("status", ["verifying", "awaiting_payment"]).maybeSingle();
    if (holder && holder.email !== email) {
      return NextResponse.json(
        { error: "Someone at this firm has already verified a claim. Contact us if that wasn't authorised." },
        { status: 409 },
      );
    }
  }

  // Resume rather than duplicate if this person already started one.
  const { data: mine } = await supabase
    .from("claims")
    .select("id,status,expires_at,verify_token")
    .eq("listing_id", listingId)
    .eq("email", email)
    .in("status", ["verifying", "awaiting_payment"])
    .maybeSingle();
  if (mine) {
    return NextResponse.json({
      claim_id: mine.id, expires_at: mine.expires_at,
      resumed: true, needs_verification: mine.status === "verifying",
    });
  }

  // Does the work email belong to the firm's own domain? That, once confirmed
  // by clicking the emailed link, is what separates the firm from an impostor —
  // and it is the only thing that lets the clock run at all.
  const domain = email.split("@")[1];
  const firmHosts = [hostOf(listing.website), hostOf(listing.email ? `https://${listing.email.split("@")[1]}` : null)]
    .filter(Boolean) as string[];
  const domainMatch =
    !FREE_MAIL.has(domain) &&
    firmHosts.some((h) => h === domain || h.endsWith(`.${domain}`) || domain.endsWith(`.${h}`));

  const token = randomUUID();
  const { data: claim, error } = await supabase
    .from("claims")
    .insert({
      listing_id: listingId,
      email,
      full_name: fullName,
      phone: String(body.phone ?? "").slice(0, 40) || null,
      role_at_firm: String(body.role_at_firm ?? "").slice(0, 120) || null,
      status: "verifying",
      verification_level: domainMatch ? "domain" : "manual",
      verify_token: token,
      expires_at: null,          // the clock starts at verification, not here
      emails_sent: 1,
      last_email_at: new Date().toISOString(),
      ip,
      user_agent: req.headers.get("user-agent")?.slice(0, 300) ?? null,
    })
    .select("id")
    .single();

  if (error || !claim) {
    console.error("claim insert failed", error);
    return NextResponse.json({ error: "Could not start the claim — please try again" }, { status: 500 });
  }

  const mail = claimVerifyEmail({
    firstName: fullName.split(/\s+/)[0],
    firmName: listing.full_name,
    token,
    domainMatch,
  });
  await send({
    to: email, subject: mail.subject, html: mail.html,
    template: "claim-verify", listingId, claimId: claim.id,
  });

  return NextResponse.json({
    claim_id: claim.id,
    needs_verification: true,
    verification_level: domainMatch ? "domain" : "manual",
  });
}
