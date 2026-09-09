import { NextResponse } from "next/server";
import { db } from "@/lib/supabase";
import { signToken } from "@/lib/auth";
import { send } from "@/lib/email";
import { SITE } from "@/lib/site";

export const runtime = "nodejs";

/**
 * Magic-link sign in. We always answer the same way whether or not the address
 * is known, so the endpoint can't be used to enumerate which firms have paid.
 */
export async function POST(req: Request) {
  let email = "";
  try {
    email = String((await req.json()).email ?? "").trim().toLowerCase();
  } catch {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }
  if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) {
    return NextResponse.json({ error: "Please enter a valid email address" }, { status: 400 });
  }

  const { data: claims } = await db()
    .from("claims")
    .select("id")
    .eq("email", email)
    .eq("status", "completed")
    .limit(1);

  if (claims && claims.length > 0) {
    const token = await signToken({ email }, "20m");
    const url = `${SITE.url}/api/auth/callback?token=${encodeURIComponent(token)}`;
    await send({
      to: email,
      subject: "Your sign-in link",
      template: "magic-link",
      html: `<p>Click below to sign in to your ${SITE.name} dashboard. The link works once and expires in 20 minutes.</p>
             <p><a href="${url}" style="display:inline-block;padding:12px 24px;background:#2f63f0;color:#fff;border-radius:999px;text-decoration:none;font-weight:600;">Sign in</a></p>
             <p style="color:#697586;font-size:13px;">If you didn't request this, ignore it — nothing happens.</p>`,
    });
  }

  return NextResponse.json({ ok: true });
}
