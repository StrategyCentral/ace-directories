import { Resend } from "resend";
import { SITE } from "./site";
import { db } from "./supabase";

const key = process.env.RESEND_API_KEY;
const from = process.env.RESEND_FROM || `${SITE.name} <hello@${SITE.domain}>`;

let client: Resend | null = null;
function resend() {
  if (!key) return null;
  if (!client) client = new Resend(key);
  return client;
}

interface SendArgs {
  to: string;
  subject: string;
  html: string;
  template: string;
  listingId?: string;
  claimId?: string;
}

export async function send({ to, subject, html, template, listingId, claimId }: SendArgs) {
  const r = resend();
  if (!r) {
    console.warn(`[email] RESEND_API_KEY missing — skipped "${template}" to ${to}`);
    return { skipped: true };
  }

  const { data, error } = await r.emails.send({ from, to, subject, html });
  if (error) {
    console.error(`[email] ${template} to ${to} failed:`, error);
    return { error };
  }

  try {
    await db().from("email_log").insert({
      to_email: to,
      template,
      listing_id: listingId ?? null,
      claim_id: claimId ?? null,
      provider_id: data?.id ?? null,
    });
  } catch (e) {
    console.error("[email] log write failed", e);
  }

  return { id: data?.id };
}

/* --------------------------------------------------------------- templates */

const shell = (body: string, preheader: string) => `
<!doctype html>
<html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width">
<title>${SITE.name}</title></head>
<body style="margin:0;padding:0;background:#f4f6f9;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;">
<span style="display:none;font-size:1px;color:#f4f6f9;">${preheader}</span>
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f4f6f9;padding:32px 16px;">
<tr><td align="center">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;background:#ffffff;border-radius:14px;overflow:hidden;border:1px solid #e3e8ef;">
<tr><td style="background:#0b1220;padding:20px 28px;">
  <span style="color:#ffffff;font-size:15px;font-weight:600;letter-spacing:-0.2px;">Aussie Lawyer Directory</span>
</td></tr>
<tr><td style="padding:32px 28px;color:#1b2434;font-size:15px;line-height:1.62;">
${body}
</td></tr>
<tr><td style="padding:20px 28px;background:#f8fafc;border-top:1px solid #e3e8ef;color:#697586;font-size:11.5px;line-height:1.6;">
  ${SITE.name} · ${SITE.postal}<br>
  You received this because your practice is listed in our public directory.
  <a href="${SITE.url}/remove-my-listing" style="color:#2f63f0;">Request removal</a> ·
  <a href="${SITE.url}/privacy" style="color:#2f63f0;">Privacy</a>
</td></tr>
</table>
</td></tr></table>
</body></html>`;

const button = (href: string, label: string) => `
<table role="presentation" cellpadding="0" cellspacing="0" style="margin:24px 0;">
<tr><td style="background:#2f63f0;border-radius:999px;">
<a href="${href}" style="display:inline-block;padding:13px 26px;color:#ffffff;text-decoration:none;font-size:14px;font-weight:600;">${label}</a>
</td></tr></table>`;

const hoursLeft = (expiresAt: string) =>
  Math.max(0, Math.round((new Date(expiresAt).getTime() - Date.now()) / 3_600_000));

export function claimStartedEmail(opts: {
  firstName: string;
  firmName: string;
  slug: string;
  expiresAt: string;
}) {
  const url = `${SITE.url}/claim/${opts.slug}`;
  return {
    subject: `Your claim on ${opts.firmName} is open for 72 hours`,
    html: shell(
      `<p>Hi ${opts.firstName},</p>
       <p>You've started a claim on <strong>${opts.firmName}</strong>. The listing is now reserved
       for you and no one else can claim it.</p>
       <p>You have <strong>${hoursLeft(opts.expiresAt)} hours</strong> to finish. If the claim
       isn't completed in that window, the reservation lapses and the unclaimed listing is
       removed from the directory along with any search ranking it has built.</p>
       ${button(url, "Finish my claim")}
       <p style="color:#697586;font-size:13px;">Didn't start this? Ignore this email and the
       claim expires on its own, or <a href="${SITE.url}/contact" style="color:#2f63f0;">tell us</a>.</p>`,
      `${hoursLeft(opts.expiresAt)} hours to complete your listing claim`,
    ),
  };
}

export function claimReminderEmail(opts: {
  firstName: string;
  firmName: string;
  slug: string;
  expiresAt: string;
  suburb: string | null;
}) {
  const url = `${SITE.url}/claim/${opts.slug}`;
  const h = hoursLeft(opts.expiresAt);
  const urgent = h <= 24;
  return {
    subject: urgent
      ? `${h} hours left — ${opts.firmName} listing closes soon`
      : `Reminder: your ${opts.firmName} listing claim is still open`,
    html: shell(
      `<p>Hi ${opts.firstName},</p>
       <p>Your claim on <strong>${opts.firmName}</strong>${
         opts.suburb ? ` in ${opts.suburb}` : ""
       } hasn't been completed yet.</p>
       <p style="${urgent ? "color:#b42318;font-weight:600;" : ""}">
       ${h} hours remain. When the clock runs out the listing is removed from the directory.</p>
       <p>While it sits unclaimed, anyone searching for your firm sees a name and a phone
       number — no website link, no practice areas, no way to enquire.</p>
       ${button(url, "Complete my claim")}`,
      `${h} hours left on your listing claim`,
    ),
  };
}

export function claimExpiredEmail(opts: { firstName: string; firmName: string }) {
  return {
    subject: `${opts.firmName} has been removed from the directory`,
    html: shell(
      `<p>Hi ${opts.firstName},</p>
       <p>The 72-hour claim window on <strong>${opts.firmName}</strong> has closed and the
       unclaimed listing has been removed from the directory.</p>
       <p>You can still list the firm again from scratch — it just starts as a new profile
       rather than the existing page.</p>
       ${button(`${SITE.url}/list-your-firm`, "List my firm")}`,
      "Your listing claim window has closed",
    ),
  };
}

export function claimCompletedEmail(opts: {
  firstName: string;
  firmName: string;
  slug: string;
  planName: string;
}) {
  return {
    subject: `${opts.firmName} is verified — your profile is live`,
    html: shell(
      `<p>Hi ${opts.firstName},</p>
       <p><strong>${opts.firmName}</strong> is now a verified listing on the ${opts.planName} plan.
       Your profile is live and the verified badge is showing.</p>
       <p>Next: add your firm description, logo and practice areas. A complete profile gets
       markedly more enquiries than a bare one.</p>
       ${button(`${SITE.url}/dashboard`, "Complete my profile")}
       <p style="color:#697586;font-size:13px;">Your public page:
       <a href="${SITE.url}/firm/${opts.slug}" style="color:#2f63f0;">${SITE.domain}/firm/${opts.slug}</a></p>`,
      "Your listing is live",
    ),
  };
}

export function enquiryEmail(opts: {
  firmName: string;
  name: string;
  email: string;
  phone: string | null;
  matter: string;
  urgency: string;
}) {
  return {
    subject: `New enquiry for ${opts.firmName} via ${SITE.shortName}`,
    html: shell(
      `<p>You have a new enquiry from the Aussie Lawyer Directory.</p>
       <table role="presentation" cellpadding="0" cellspacing="0" style="width:100%;font-size:14px;">
         <tr><td style="padding:6px 0;color:#697586;width:90px;">Name</td><td>${opts.name}</td></tr>
         <tr><td style="padding:6px 0;color:#697586;">Email</td><td><a href="mailto:${opts.email}" style="color:#2f63f0;">${opts.email}</a></td></tr>
         ${opts.phone ? `<tr><td style="padding:6px 0;color:#697586;">Phone</td><td>${opts.phone}</td></tr>` : ""}
         <tr><td style="padding:6px 0;color:#697586;">Urgency</td><td>${opts.urgency}</td></tr>
       </table>
       <p style="margin-top:18px;padding:16px;background:#f8fafc;border-radius:10px;white-space:pre-line;">${opts.matter}</p>
       <p style="color:#697586;font-size:12.5px;">Reply directly to the enquirer — we don't sit in the middle.</p>`,
      `New enquiry for ${opts.firmName}`,
    ),
  };
}
