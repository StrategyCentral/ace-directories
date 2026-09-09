import { NextResponse } from "next/server";
import { db } from "@/lib/supabase";
import { getSession } from "@/lib/auth";

export const runtime = "nodejs";

/**
 * A firm replying to a review of itself. Replies publish immediately — the
 * right of reply is worth little if it sits in a queue while the review is up.
 */
export async function POST(req: Request) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Not signed in" }, { status: 401 });

  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }

  const id = String(body.review_id ?? "");
  const reply = String(body.reply ?? "").trim();
  if (!reply || reply.length > 3000) {
    return NextResponse.json({ error: "Reply must be between 1 and 3000 characters" }, { status: 400 });
  }

  const supabase = db();
  const { data: review } = await supabase
    .from("reviews").select("id,listing_id").eq("id", id).maybeSingle();
  if (!review) return NextResponse.json({ error: "Not found" }, { status: 404 });

  // Only the firm that owns the listing may reply to reviews of it.
  const { data: claim } = await supabase
    .from("claims")
    .select("id")
    .eq("listing_id", review.listing_id)
    .eq("email", session.email)
    .eq("status", "completed")
    .maybeSingle();
  if (!claim) return NextResponse.json({ error: "You don't manage that listing" }, { status: 403 });

  await supabase.from("reviews")
    .update({ reply, replied_at: new Date().toISOString() })
    .eq("id", id);

  return NextResponse.json({ ok: true });
}
