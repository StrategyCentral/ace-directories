import { NextResponse } from "next/server";
import { db } from "@/lib/supabase";

export const runtime = "nodejs";

/**
 * Anyone can report a review. A reported review comes down immediately and goes
 * back into the moderation queue — leaving something up while it is disputed is
 * exactly how a platform ends up carrying the liability for it.
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

  const supabase = db();
  const { data: review } = await supabase
    .from("reviews").select("id,report_count").eq("id", id).maybeSingle();
  if (!review) return NextResponse.json({ error: "Not found" }, { status: 404 });

  await supabase.from("reviews").update({
    status: "reported",
    is_published: false,
    reported_at: new Date().toISOString(),
    report_reason: reason,
    report_count: (review.report_count ?? 0) + 1,
  }).eq("id", id);

  return NextResponse.json({ ok: true });
}
