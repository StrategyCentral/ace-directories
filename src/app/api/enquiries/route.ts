import { NextResponse } from "next/server";
import { db } from "@/lib/supabase";
import { enquiryEmail, send } from "@/lib/email";
import { ADMIN_ALERT_TO } from "@/lib/claim-admin";

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

    // Deliver it. A claimed firm gets the enquiry at its account address; anything
    // else (an unclaimed firm, or a general "find me a lawyer" request) goes to us,
    // so no enquiry ever sits unread in the database.
    const supabase = db();
    let to: string = ADMIN_ALERT_TO;
    let firmName = "the directory (no firm selected)";
    if (body.listing_id) {
      const { data: l } = await supabase.from("lawyers")
        .select("full_name,is_claimed,owner_user_id").eq("id", String(body.listing_id)).maybeSingle();
      if (l) {
        firmName = l.full_name;
        if (l.is_claimed && l.owner_user_id) {
          const { data: u } = await supabase.from("users")
            .select("email").eq("id", l.owner_user_id).maybeSingle();
          if (u?.email) to = u.email;
        }
        if (to === ADMIN_ALERT_TO) firmName = `${l.full_name} (unclaimed, not delivered to the firm)`;
      }
    }
    const esc = (v: string) => v.replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]!));
    const mail = enquiryEmail({
      firmName: esc(firmName),
      name: esc(String(body.name ?? "").slice(0, 120) || "Not given"),
      email: esc(email),
      phone: body.phone ? esc(String(body.phone).slice(0, 40)) : null,
      matter: esc(matter.slice(0, 4000)),
      urgency: esc(urgency),
    });
    const sent = await send({
      to, subject: mail.subject, html: mail.html, template: "enquiry",
      listingId: body.listing_id ? String(body.listing_id) : undefined,
    });
    if ("error" in sent && sent.error) console.error("enquiry email failed", sent.error);
  } catch (e) {
    console.error("enquiry insert failed", e);
    return NextResponse.json({ error: "Could not send right now — please try again" }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
