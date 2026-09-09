import { NextResponse } from "next/server";
import { db } from "@/lib/supabase";
import { SITE } from "@/lib/site";

export const runtime = "nodejs";

/** Author confirms their address. The review still waits on moderation. */
export async function GET(req: Request) {
  const token = new URL(req.url).searchParams.get("token");
  if (!token) return NextResponse.redirect(`${SITE.url}/reviews/thanks?state=invalid`);

  const supabase = db();
  const { data: review } = await supabase
    .from("reviews")
    .select("id,status,listing_id")
    .eq("verify_token", token)
    .maybeSingle();

  if (!review) return NextResponse.redirect(`${SITE.url}/reviews/thanks?state=invalid`);
  if (review.status === "approved") {
    return NextResponse.redirect(`${SITE.url}/reviews/thanks?state=live`);
  }

  await supabase
    .from("reviews")
    .update({ status: "pending", verified_at: new Date().toISOString(), verify_token: null })
    .eq("id", review.id);

  return NextResponse.redirect(`${SITE.url}/reviews/thanks?state=verified`);
}
