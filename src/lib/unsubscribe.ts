import { createHmac, timingSafeEqual } from "node:crypto";
import { SITE } from "./site";
import { db } from "./supabase";

/**
 * Opt-outs. Every email we send carries a signed link for its recipient, so
 * unsubscribing never needs a login. Suppression blocks everything except the
 * messages a person has just asked for or that their account depends on.
 */
const secret = () => process.env.JWT_SECRET || "dev-secret";

export const normalise = (email: string) => email.trim().toLowerCase();

export function unsubSig(email: string) {
  return createHmac("sha256", secret()).update(`unsub:${normalise(email)}`).digest("hex").slice(0, 32);
}

export function validUnsubSig(email: string, sig: string) {
  const want = Buffer.from(unsubSig(email));
  const got = Buffer.from(String(sig));
  return want.length === got.length && timingSafeEqual(want, got);
}

export function unsubUrl(email: string) {
  return `${SITE.url}/unsubscribe?e=${encodeURIComponent(normalise(email))}&s=${unsubSig(email)}`;
}

/** Sent even to an unsubscribed address: replies to something they just did. */
export const ESSENTIAL = new Set([
  "claim-verify", "claim-approved", "claim-completed", "review-verify", "enquiry",
  "magic-link", "claim-needs-review",
]);

export async function isSuppressed(email: string) {
  const { data } = await db().from("email_suppressions")
    .select("email").eq("email", normalise(email)).maybeSingle();
  return Boolean(data);
}

export async function suppress(email: string, reason = "unsubscribe") {
  await db().from("email_suppressions").upsert({ email: normalise(email), reason });
}

export async function unsuppress(email: string) {
  await db().from("email_suppressions").delete().eq("email", normalise(email));
}
