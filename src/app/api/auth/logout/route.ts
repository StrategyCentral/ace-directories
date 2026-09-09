import { NextResponse } from "next/server";
import { clearSession } from "@/lib/auth";
import { SITE } from "@/lib/site";

export const runtime = "nodejs";

export async function POST() {
  await clearSession();
  return NextResponse.redirect(`${SITE.url}/`, { status: 303 });
}
