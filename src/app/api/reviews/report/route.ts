import { NextResponse } from "next/server";
import { createHash } from "node:crypto";
import { db } from "@/lib/supabase";
import { clientIp } from "@/lib/client-ip";
import { rateLimited } from "@/lib/rate-limit";

export const runtime = "nodejs";

/** Distinct reporters needed before a review comes down on its own. */
const UNPUBLISH_AT = 3;

/**
 * Anyone can report a review. Every report puts it in front of a moderator
 * (the admin queue shows flagged reviews), but a single report no longer
 * unpublishes it: one person could otherwise take down every bad review of
 * their firm. Once UNPUBLISH_AT different connections have reported it, it
 * comes down and waits for a decision.
 */
export async function POST(req: Request) {
  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }

  const id = String(body.review_id ?? "");
  const reason = String(body.reason ?? "").trim().slice(0, 1000);
  if (!/^[0-9a-f-]{36}$/i.test(id) || reason.length < 10) {
    return NextResponse.json({ error: "Please tell us what's wrong with it" }, { status: 400 });
  }

  const ip = clientIp(req);
  if (rateLimited(`report:${ip}`, 5, 3_600_000)) {
    return NextResponse.json({ error: "Too many reports from this connection. Try again later." }, { status: 429 });
  }
  const secret = process.env.JWT_SECRET;
  if (!secret) return NextResponse.json({ error: "Not configured" }, { status: 500 });
  const reporter = createHash("sha256").update(`${ip}|${secret}`).digest("hex").slice(0, 32);

  const supabase = db();
  const { data: review } = await supabase
    .from("reviews").select("id,status,report_count").eq("id", id).maybeSingle();
  if (!review) return NextResponse.json({ error: "Not found" }, { status: 404 });

  // One row per reporter per review (unique index), so repeats don't count.
  const { error: insertError } = await supabase
    .from("review_reports").insert({ review_id: id, reporter_hash: reporter, reason });
  if (insertError?.code === "23505") return NextResponse.json({ ok: true });

  let distinct = 0;
  if (!insertError) {
    const { count } = await supabase
      .from("review_reports").select("id", { count: "exact", head: true }).eq("review_id", id);
    distinct = count ?? 0;
  } else {
    // Table not there yet (migration 015): flag for moderation, never unpublish.
    console.error("review_reports insert failed", insertError);
  }

  const now = new Date().toISOString();
  await supabase.from("reviews").update({
    reported_at: now,
    report_reason: reason,
    report_count: (review.report_count ?? 0) + 1,
    ...(distinct >= UNPUBLISH_AT ? { status: "reported", is_published: false } : {}),
  }).eq("id", id);

  return NextResponse.json({ ok: true });
}
