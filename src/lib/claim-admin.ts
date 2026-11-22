import { createHmac, timingSafeEqual } from "node:crypto";
import { SITE } from "./site";

/** Where "a claim needs a human" alerts go. */
export const ADMIN_ALERT_TO = process.env.ADMIN_ALERT_EMAIL || "profitlab@acetradingbots.com";

/**
 * Signed link to one claim's review page, so the alert email can be acted on
 * straight from the inbox without a login. The signature only opens the page;
 * approving or declining is a button press (POST), so a mail scanner that
 * pre-fetches the link cannot decide a claim.
 */
export function claimSig(claimId: string): string | null {
  const secret = process.env.JWT_SECRET;
  if (!secret) return null;
  return createHmac("sha256", secret).update(`claim-review:${claimId}`).digest("hex").slice(0, 40);
}

export function validClaimSig(claimId: string, sig: string | null | undefined): boolean {
  const want = claimSig(claimId);
  if (!want || !sig || sig.length !== want.length) return false;
  return timingSafeEqual(Buffer.from(want), Buffer.from(sig));
}

export function claimReviewUrl(claimId: string): string {
  return `${SITE.url}/admin/claims/${claimId}?sig=${claimSig(claimId) ?? ""}`;
}

/** Same idea for testimonials: the link opens a page, a button press decides. */
export function testimonialSig(id: string): string | null {
  const secret = process.env.JWT_SECRET;
  if (!secret) return null;
  return createHmac("sha256", secret).update(`testimonial-review:${id}`).digest("hex").slice(0, 40);
}

export function validTestimonialSig(id: string, sig: string | null | undefined): boolean {
  const want = testimonialSig(id);
  if (!want || !sig || sig.length !== want.length) return false;
  return timingSafeEqual(Buffer.from(want), Buffer.from(sig));
}
