import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { db } from "@/lib/supabase";
import { requireAdmin } from "@/lib/admin";
import { validTestimonialSig } from "@/lib/claim-admin";

export const runtime = "nodejs";

export async function POST(req: Request) {
  const body = await req.json().catch(() => ({}));
  const id = String(body.id ?? "");
  if (!validTestimonialSig(id, body.sig) && !(await requireAdmin())) {
    return NextResponse.json({ error: "Not allowed" }, { status: 403 });
  }
  const approve = body.action === "approve";
  const { error } = await db().from("testimonials").update({
    status: approve ? "approved" : "declined",
    approved_at: approve ? new Date().toISOString() : null,
  }).eq("id", id);
  if (error) return NextResponse.json({ error: "Could not save" }, { status: 500 });
  for (const p of ["/", "/pricing", "/list-your-firm"]) revalidatePath(p);
  return NextResponse.json({ ok: true });
}
