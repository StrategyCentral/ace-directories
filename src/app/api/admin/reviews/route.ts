import { NextResponse } from "next/server";
import { db } from "@/lib/supabase";
import { requireAdmin } from "@/lib/admin";
import { reviewLiveEmail, send } from "@/lib/email";

export const runtime = "nodejs";

/** Approve or reject a review. Approval is the only path to publication. */
export async function POST(req: Request) {
  const admin = await requireAdmin();
  if (!admin) return NextResponse.json({ error: "Not authorised" }, { status: 403 });

  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }

  const id = String(body.review_id ?? "");
  const action = String(body.action ?? "");
  if (!["approve", "reject"].includes(action)) {
    return NextResponse.json({ error: "Unknown action" }, { status: 400 });
  }

  const supabase = db();
  const { data: review } = await supabase
    .from("reviews").select("id,listing_id,rating,author_name,status").eq("id", id).maybeSingle();
  if (!review) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const now = new Date().toISOString();
  const approved = action === "approve";

  await supabase.from("reviews").update({
    status: approved ? "approved" : "rejected",
    is_published: approved,
    published_at: approved ? now : null,
    moderated_at: now,
    moderated_by: admin.email,
    rejection_reason: approved ? null : String(body.reason ?? "").slice(0, 500) || null,
  }).eq("id", id);

  // Tell the firm, so the right of reply is real rather than theoretical.
  if (approved) {
    const { data: listing } = await supabase
      .from("lawyers").select("full_name,slug,email,is_claimed").eq("id", review.listing_id).maybeSingle();
    if (listing?.is_claimed && listing.email) {
      const mail = reviewLiveEmail({
        firmName: listing.full_name,
        slug: listing.slug,
        rating: review.rating,
        authorName: review.author_name,
      });
      await send({
        to: listing.email, subject: mail.subject, html: mail.html,
        template: "review-live", listingId: review.listing_id,
      });
    }
  }

  return NextResponse.json({ ok: true });
}
