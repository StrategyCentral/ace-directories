import { NextResponse } from "next/server";
import { db } from "@/lib/supabase";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Cheap end-to-end check: can the app actually read the directory?
 *
 * Returns 503 when it can't, so an uptime monitor catches a database outage
 * immediately rather than it being noticed a day later because listing pages
 * had quietly been serving 404s.
 */
export async function GET() {
  const started = Date.now();
  try {
    const { error, count } = await db()
      .from("lawyers")
      .select("id", { count: "exact", head: true })
      .eq("status", "live");

    if (error) throw new Error(error.message);

    return NextResponse.json(
      { ok: true, listings: count ?? 0, ms: Date.now() - started },
      { headers: { "cache-control": "no-store" } },
    );
  } catch (e) {
    return NextResponse.json(
      {
        ok: false,
        error: e instanceof Error ? e.message : "unknown",
        ms: Date.now() - started,
      },
      { status: 503, headers: { "cache-control": "no-store" } },
    );
  }
}
