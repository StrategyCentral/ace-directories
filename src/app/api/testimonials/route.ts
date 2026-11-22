import { NextResponse } from "next/server";
import { db } from "@/lib/supabase";
import { requireOwner } from "@/lib/ownership";
import { send } from "@/lib/email";
import { ADMIN_ALERT_TO, testimonialSig } from "@/lib/claim-admin";
import { SITE } from "@/lib/site";

export const runtime = "nodejs";

const esc = (v: string) => v.replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]!));

/** A firm reviews the directory itself. Held until a person approves it. */
export async function POST(req: Request) {
  const body = await req.json().catch(() => ({}));
  const listingId = String(body.listing_id ?? "");
  if (!(await requireOwner(listingId))) {
    return NextResponse.json({ error: "You don't manage that listing" }, { status: 403 });
  }
  const rating = Math.round(Number(body.rating));
  const text = String(body.body ?? "").trim().slice(0, 1200);
  const name = String(body.author_name ?? "").trim().slice(0, 80);
  const role = String(body.author_role ?? "").trim().slice(0, 80) || null;
  if (!(rating >= 1 && rating <= 5)) return NextResponse.json({ error: "Pick a star rating" }, { status: 400 });
  if (text.length < 20) return NextResponse.json({ error: "Add a sentence or two" }, { status: 400 });
  if (name.length < 2) return NextResponse.json({ error: "Add your name" }, { status: 400 });

  const supabase = db();
  const { data: l } = await supabase.from("lawyers").select("full_name,suburb,state").eq("id", listingId).maybeSingle();
  const { data, error } = await supabase.from("testimonials").insert({
    listing_id: listingId, author_name: name, author_role: role,
    firm_name: l?.full_name ?? null,
    place: [l?.suburb, l?.state].filter(Boolean).join(", ") || null,
    rating, body: text,
  }).select("id").single();
  if (error) return NextResponse.json({ error: "Could not save" }, { status: 500 });

  await send({
    to: ADMIN_ALERT_TO, template: "claim-needs-review", listingId,
    subject: `New ${rating}-star review of ALD from ${l?.full_name ?? "a firm"}`,
    html: `<p><strong>${esc(name)}</strong>${role ? `, ${esc(role)}` : ""} at ${esc(l?.full_name ?? "")} left ${rating} stars:</p>
           <p style="padding:14px;background:#f8fafc;border-radius:10px;white-space:pre-line;">${esc(text)}</p>
           <p><a href="${SITE.url}/admin/testimonials/${data.id}?sig=${testimonialSig(data.id)}">Approve or decline</a></p>`,
  });
  return NextResponse.json({ ok: true });
}
