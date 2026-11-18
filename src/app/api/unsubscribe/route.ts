import { NextResponse } from "next/server";
import { suppress, unsuppress, validUnsubSig } from "@/lib/unsubscribe";

export const runtime = "nodejs";

/**
 * POST with ?e=&s= — used by the button on /unsubscribe and by mail clients'
 * one-click unsubscribe (RFC 8058), which posts to the List-Unsubscribe URL.
 * `action=resubscribe` undoes it.
 */
export async function POST(req: Request) {
  const url = new URL(req.url);
  let e = url.searchParams.get("e") ?? "";
  let s = url.searchParams.get("s") ?? "";
  let action = url.searchParams.get("action") ?? "unsubscribe";
  const type = req.headers.get("content-type") ?? "";
  if (type.includes("application/json")) {
    const body = await req.json().catch(() => ({}));
    e = body.e ?? e; s = body.s ?? s; action = body.action ?? action;
  }
  if (!e || !validUnsubSig(e, s)) {
    return NextResponse.json({ error: "This link is not valid" }, { status: 400 });
  }
  if (action === "resubscribe") await unsuppress(e);
  else await suppress(e);
  return NextResponse.json({ ok: true, action });
}
