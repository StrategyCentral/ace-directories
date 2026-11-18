import { NextResponse } from "next/server";
import { setSession, verifyMagicToken } from "@/lib/auth";
import { db } from "@/lib/supabase";
import { SITE } from "@/lib/site";

export const runtime = "nodejs";

export async function GET(req: Request) {
  const token = new URL(req.url).searchParams.get("token");
  const magic = token ? await verifyMagicToken(token) : null;
  if (!magic) {
    return NextResponse.redirect(`${SITE.url}/dashboard/login?error=expired`);
  }

  // Single use: the first click consumes the link id; a replay finds nothing.
  const { data: used, error } = await db()
    .from("auth_magic_links")
    .update({ used_at: new Date().toISOString() })
    .eq("jti", magic.jti)
    .eq("email", magic.email)
    .is("used_at", null)
    .select("jti")
    .maybeSingle();
  if (error || !used) {
    if (error) console.error("magic link consume failed", error);
    return NextResponse.redirect(`${SITE.url}/dashboard/login?error=expired`);
  }

  await setSession(magic.email);
  return NextResponse.redirect(`${SITE.url}/dashboard`);
}
