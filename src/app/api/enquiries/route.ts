import { NextResponse } from "next/server";
import { db } from "@/lib/supabase";

export const runtime = "nodejs";

const URGENCY_SCORE: Record<string, number> = { urgent: 40, soon: 25, planning: 10 };

export async function POST(req: Request) {
  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }

  const email = String(body.email ?? "").trim();
  const matter = String(body.matter ?? "").trim();
  if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) {
    return NextResponse.json({ error: "Please enter a valid email address" }, { status: 400 });
  }
  if (matter.length < 10) {
    return NextResponse.json({ error: "Please add a little more detail" }, { status: 400 });
  }

  const urgency = String(body.urgency ?? "soon");
  const leadScore =
    (URGENCY_SCORE[urgency] ?? 10) +
    (body.phone ? 25 : 0) +
    Math.min(35, Math.floor(matter.length / 12));

  try {
    const { error } = await db().from("enquiries").insert({
      listing_id: body.listing_id ?? null,
      practice_area: body.practice_area ?? null,
      name: String(body.name ?? "").slice(0, 120) || null,
      email,
      phone: String(body.phone ?? "").slice(0, 40) || null,
      matter: matter.slice(0, 4000),
      urgency,
      source: String(body.source ?? "match"),
      lead_score: leadScore,
    });
    if (error) throw new Error(error.message);
  } catch (e) {
    console.error("enquiry insert failed", e);
    return NextResponse.json({ error: "Could not send right now — please try again" }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
