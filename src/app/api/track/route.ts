import { NextResponse } from "next/server";
import { createHash } from "crypto";
import { db } from "@/lib/supabase";

export const runtime = "nodejs";

const KINDS = new Set(["view", "call", "website", "enquiry", "directions"]);

/**
 * Records a listing interaction. Deliberately fire-and-forget: it always
 * answers 204 so a tracking failure can never block a visitor from calling a
 * lawyer, and it stores a coarse hash rather than an IP or user agent.
 */
export async function POST(req: Request) {
  try {
    const body = await req.json();
    const kind = String(body.kind ?? "");
    const listingId = String(body.listing_id ?? "");
    if (!KINDS.has(kind) || !/^[0-9a-f-]{36}$/i.test(listingId)) {
      return new NextResponse(null, { status: 204 });
    }

    // Obvious crawlers shouldn't inflate the numbers we put in a sales email.
    const ua = req.headers.get("user-agent") ?? "";
    if (/bot|crawl|spider|slurp|headless|preview|lighthouse/i.test(ua)) {
      return new NextResponse(null, { status: 204 });
    }

    const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "";
    const uaHash = createHash("sha256")
      .update(`${ip}|${ua}|${new Date().toISOString().slice(0, 10)}`)
      .digest("hex")
      .slice(0, 16);

    await db().from("listing_events").insert({
      listing_id: listingId,
      kind,
      source: String(body.source ?? "").slice(0, 200) || null,
      referrer: (req.headers.get("referer") ?? "").slice(0, 300) || null,
      ua_hash: uaHash,
    });
  } catch {
    /* never surface tracking errors to the visitor */
  }
  return new NextResponse(null, { status: 204 });
}
