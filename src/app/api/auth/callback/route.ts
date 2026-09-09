import { NextResponse } from "next/server";
import { setSession, verifyToken } from "@/lib/auth";
import { SITE } from "@/lib/site";

export const runtime = "nodejs";

export async function GET(req: Request) {
  const token = new URL(req.url).searchParams.get("token");
  const session = token ? await verifyToken(token) : null;
  if (!session) {
    return NextResponse.redirect(`${SITE.url}/dashboard/login?error=expired`);
  }
  await setSession(session.email);
  return NextResponse.redirect(`${SITE.url}/dashboard`);
}
