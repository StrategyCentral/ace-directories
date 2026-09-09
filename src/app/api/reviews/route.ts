import { NextResponse } from "next/server";
import { randomUUID } from "crypto";
import { db } from "@/lib/supabase";
import { reviewVerifyEmail, send } from "@/lib/email";

export const runtime = "nodejs";

/**
 * Accepts a review. Nothing written here is publicly visible: the review is
 * stored as `pending`, the author has to confirm their email, and a human still
 * has to approve it before it appears. Publishing criticism of a named lawyer
 * unattended is not a risk worth taking in Australian defamation law.
 */
export async function POST(req: Request) {
  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }

  const listingId = String(body.listing_id ?? "");
  const email = String(body.author_email ?? "").trim().toLowerCase();
  const name = String(body.author_name ?? "").trim();
  const rating = Number(body.rating);
  const reviewBody = String(body.body ?? "").trim();

  if (!/^[0-9a-f-]{36}$/i.test(listingId)) {
    return NextResponse.json({ error: "Unknown listing" }, { status: 400 });
  }
  if (!Number.isInteger(rating) || rating < 1 || rating > 5) {
    return NextResponse.json({ error: "Please choose a rating from 1 to 5" }, { status: 400 });
  }
  if (name.length < 2) {
    return NextResponse.json({ error: "Please add your name" }, { status: 400 });
  }
  if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) {
    return NextResponse.json({ error: "Please enter a valid email address" }, { status: 400 });
  }
  if (reviewBody.length < 40) {
    return NextResponse.json(
      { error: "Please write at least a couple of sentences about your experience" },
      { status: 400 },
    );
  }
  if (reviewBody.length > 5000) {
    return NextResponse.json({ error: "That review is too long" }, { status: 400 });
  }

  const supabase = db();

  const { data: listing } = await supabase
    .from("lawyers").select("id,slug,full_name,status").eq("id", listingId).maybeSingle();
  if (!listing || listing.status === "removed") {
    return NextResponse.json({ error: "Unknown listing" }, { status: 404 });
  }

  // One live review per person per firm — stops a single unhappy client (or a
  // competitor) stacking a profile.
  const { data: existing } = await supabase
    .from("reviews")
    .select("id")
    .eq("listing_id", listingId)
    .eq("author_email", email)
    .in("status", ["pending", "verifying", "approved"])
    .maybeSingle();
  if (existing) {
    return NextResponse.json(
      { error: "You've already left a review for this firm." },
      { status: 409 },
    );
  }

  const token = randomUUID();
  const { data: review, error } = await supabase
    .from("reviews")
    .insert({
      listing_id: listingId,
      author_name: name.slice(0, 80),
      author_email: email,
      rating,
      title: String(body.title ?? "").slice(0, 120) || null,
      body: reviewBody,
      matter_type: String(body.matter_type ?? "").slice(0, 80) || null,
      matter_year: Number(body.matter_year) || null,
      used_firm: body.used_firm !== false,
      status: "verifying",
      verify_token: token,
      is_published: false,
      ip: req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? null,
      user_agent: req.headers.get("user-agent")?.slice(0, 300) ?? null,
    })
    .select("id")
    .single();

  if (error || !review) {
    console.error("review insert failed", error);
    return NextResponse.json({ error: "Could not save that — please try again" }, { status: 500 });
  }

  const mail = reviewVerifyEmail({
    firstName: name.split(/\s+/)[0],
    firmName: listing.full_name,
    token,
  });
  await send({
    to: email, subject: mail.subject, html: mail.html,
    template: "review-verify", listingId: listing.id,
  });

  return NextResponse.json({ ok: true });
}
