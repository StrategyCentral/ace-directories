/**
 * Shared between the claim form and the claim API.
 *
 * This lives in one place on purpose. The form now tells people, as they type,
 * whether their address will verify instantly or drop into manual review — and
 * a hint that disagrees with the server's actual decision is worse than no hint
 * at all, because the person acts on it and then finds out it was wrong.
 *
 * Instant verification needs the claimant's email domain to be exactly the
 * firm's own registrable domain (from its website). Free mail, ISP mail, shared
 * hosting platforms and the scraped listing email never qualify: anyone can get
 * an address at those, so they go to manual review.
 */

/** Mail providers matched by name, in any country (gmail.com, yahoo.co.uk ...). */
const FREE_MAIL_NAMES = new Set([
  // global webmail
  "gmail", "googlemail", "google", "hotmail", "outlook", "live", "msn", "windowslive",
  "yahoo", "ymail", "rocketmail", "aol", "aim", "icloud", "me", "mac",
  "gmx", "proton", "protonmail", "pm", "tutanota", "tuta", "tutamail", "zoho",
  "zohomail", "fastmail", "fastmail.fm", "hushmail", "mail", "email", "inbox",
  "yandex", "hey", "mailfence", "runbox", "posteo", "duck", "simplelogin",
  "anonaddy", "addy", "qq", "163", "126",
  // Australian ISPs and telcos
  "bigpond", "telstra", "optusnet", "optus", "tpg", "iinet", "internode",
  "westnet", "iprimus", "primus", "dodo", "aapt", "exetel", "ozemail",
  "aussiebb", "adam", "people", "netspace", "chariot", "senet", "southernphone",
  "spin", "onthenet", "tadaust", "harboursat", "activ8me", "skymesh", "vodafone",
  "belong", "tpgi", "comcen", "dragnet", "tassie", "bordernet", "ncable",
  // New Zealand / UK common ISP mail
  "xtra", "slingshot", "orcon", "btinternet", "sky", "virginmedia", "talktalk",
]);

/** Full domains kept for callers that test membership directly. */
export const FREE_MAIL = new Set([
  "gmail.com", "googlemail.com", "hotmail.com", "hotmail.com.au", "outlook.com",
  "outlook.com.au", "yahoo.com", "yahoo.com.au", "ymail.com", "bigpond.com",
  "bigpond.net.au", "icloud.com", "live.com", "live.com.au", "msn.com", "me.com",
  "mac.com", "optusnet.com.au", "iinet.net.au", "internode.on.net", "westnet.com.au",
  "iprimus.com.au", "dodo.com.au", "tpg.com.au", "aapt.net.au", "exetel.com.au",
  "ozemail.com.au", "aol.com", "proton.me", "protonmail.com", "pm.me", "gmx.com",
  "zoho.com", "fastmail.com", "fastmail.fm",
]);

/** Website platforms where a firm's site is a subdomain anyone can also sign up for. */
const SHARED_HOSTS = new Set([
  "wixsite.com", "wix.com", "wordpress.com", "squarespace.com", "business.site",
  "google.com", "sites.google.com", "blogspot.com", "weebly.com", "webflow.io",
  "godaddysites.com", "site123.me", "jimdosite.com", "jimdo.com", "strikingly.com",
  "facebook.com", "linkedin.com", "instagram.com", "github.io", "netlify.app",
  "vercel.app", "up.railway.app", "railway.app", "herokuapp.com", "carrd.co",
  "yolasite.com", "webs.com", "tumblr.com", "medium.com", "mystrikingly.com",
]);

/** Second-level public suffixes we see in practice (Australia first). */
const TWO_LEVEL_SUFFIXES = new Set([
  "com.au", "net.au", "org.au", "asn.au", "id.au", "edu.au", "gov.au", "csiro.au",
  "co.nz", "net.nz", "org.nz", "govt.nz", "ac.nz", "geek.nz", "school.nz",
  "co.uk", "org.uk", "me.uk", "ltd.uk", "plc.uk", "net.uk", "ac.uk", "gov.uk",
  "com.sg", "com.hk", "co.za", "com.br", "co.jp", "co.in", "com.cn",
  "on.net", "fastmail.fm",
]);
/** Third-level public suffixes (state government and education in Australia). */
const THREE_LEVEL_SUFFIXES = new Set(
  ["act", "nsw", "nt", "qld", "sa", "tas", "vic", "wa"].flatMap((s) => [`${s}.gov.au`, `${s}.edu.au`]),
);

/** The registrable domain ("eTLD+1"): smithlaw.com.au for mail.smithlaw.com.au. */
export function registrableDomain(host: string): string | null {
  const h = host.toLowerCase().replace(/\.$/, "");
  if (!/^[a-z0-9.-]+$/.test(h) || !h.includes(".")) return null;
  const labels = h.split(".").filter(Boolean);
  const last = (n: number) => labels.slice(-n).join(".");
  let take = 2;
  if (labels.length >= 3 && THREE_LEVEL_SUFFIXES.has(last(3))) take = 4;
  else if (TWO_LEVEL_SUFFIXES.has(last(2))) take = 3;
  if (labels.length < take) return null;
  return last(take);
}

function isFreeMail(domain: string): boolean {
  if (FREE_MAIL.has(domain)) return true;
  const reg = registrableDomain(domain);
  if (!reg) return false;
  if (FREE_MAIL.has(reg)) return true;
  return FREE_MAIL_NAMES.has(reg.split(".")[0]);
}

function isSharedHost(host: string): boolean {
  const reg = registrableDomain(host);
  return Boolean(
    SHARED_HOSTS.has(host) || (reg && SHARED_HOSTS.has(reg)) ||
    [...SHARED_HOSTS].some((s) => host.endsWith(`.${s}`)),
  );
}

export const hostOf = (url: string | null | undefined): string | null => {
  if (!url) return null;
  try {
    return new URL(url.startsWith("http") ? url : `https://${url}`)
      .hostname.toLowerCase()
      .replace(/^www\./, "");
  } catch {
    return null;
  }
};

/**
 * The hostnames we accept as proof of control of a firm's own mail: the firm's
 * website only. The listing email was scraped and could be anyone's address, so
 * it never counts, and a site on a shared platform proves nothing.
 */
export function firmHosts(listing: { website?: string | null; email?: string | null }): string[] {
  const site = hostOf(listing.website);
  if (!site || isSharedHost(site) || isFreeMail(site)) return [];
  return [site];
}

export type ClaimLevel = "domain" | "manual";

export interface DomainVerdict {
  level: ClaimLevel;
  /** Why it landed there — drives the hint copy, never shown raw. */
  reason: "match" | "free-mail" | "different-domain" | "unknown-firm-domain" | "incomplete";
  domain: string | null;
}

export function assessEmail(email: string, hosts: string[]): DomainVerdict {
  const at = email.lastIndexOf("@");
  const domain = at > 0 ? email.slice(at + 1).trim().toLowerCase() : "";
  if (!domain || !domain.includes(".")) return { level: "manual", reason: "incomplete", domain: null };

  if (isFreeMail(domain)) return { level: "manual", reason: "free-mail", domain };
  if (hosts.length === 0) return { level: "manual", reason: "unknown-firm-domain", domain };

  const mine = registrableDomain(domain);
  const match = Boolean(mine) && hosts.some((h) => {
    if (isSharedHost(h)) return false;
    return registrableDomain(h) === mine;
  });
  return match
    ? { level: "domain", reason: "match", domain }
    : { level: "manual", reason: "different-domain", domain };
}
