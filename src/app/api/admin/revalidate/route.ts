import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";

export const runtime = "nodejs";

/**
 * Refresh cached pages after a change made straight in the database (plan
 * copy, prices). POST { paths: ["/pricing", ...] } with the cron secret.
 */
export async function POST(req: Request) {
  const secret = process.env.CRON_SECRET;
  if (!secret || req.headers.get("authorization") !== `Bearer ${secret}`) {
    return NextResponse.json({ error: "Unauthorised" }, { status: 401 });
  }
  const body = await req.json().catch(() => ({}));
  const paths: string[] = Array.isArray(body.paths) ? body.paths.slice(0, 50).map(String) : [];
  for (const p of paths) revalidatePath(p);
  return NextResponse.json({ ok: true, revalidated: paths });
}
