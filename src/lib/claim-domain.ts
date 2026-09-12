/**
 * Shared between the claim form and the claim API.
 *
 * This lives in one place on purpose. The form now tells people, as they type,
 * whether their address will verify instantly or drop into manual review — and
 * a hint that disagrees with the server's actual decision is worse than no hint
 * at all, because the person acts on it and then finds out it was wrong.
 */

export const FREE_MAIL = new Set([
  "gmail.com", "hotmail.com", "hotmail.com.au", "outlook.com", "outlook.com.au",
  "yahoo.com", "yahoo.com.au", "bigpond.com", "bigpond.net.au", "icloud.com",
  "live.com", "live.com.au", "me.com", "optusnet.com.au", "iinet.net.au",
  "tpg.com.au", "aol.com", "proton.me", "protonmail.com", "gmx.com",
]);

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

/** The hostnames we accept as proof of control of a firm's own mail. */
export function firmHosts(listing: { website?: string | null; email?: string | null }): string[] {
  const fromEmail = listing.email?.includes("@")
    ? hostOf(`https://${listing.email.split("@")[1]}`)
    : null;
  return [hostOf(listing.website), fromEmail].filter(Boolean) as string[];
}

export type ClaimLevel = "domain" | "manual";

export interface DomainVerdict {
  level: ClaimLevel;
  /** Why it landed there — drives the hint copy, never shown raw. */
  reason: "match" | "free-mail" | "different-domain" | "unknown-firm-domain" | "incomplete";
  domain: string | null;
}

export function assessEmail(email: string, hosts: string[]): DomainVerdict {
  const at = email.indexOf("@");
  const domain = at > 0 ? email.slice(at + 1).trim().toLowerCase() : "";
  if (!domain || !domain.includes(".")) return { level: "manual", reason: "incomplete", domain: null };

  if (FREE_MAIL.has(domain)) return { level: "manual", reason: "free-mail", domain };
  if (hosts.length === 0) return { level: "manual", reason: "unknown-firm-domain", domain };

  const match = hosts.some(
    (h) => h === domain || h.endsWith(`.${domain}`) || domain.endsWith(`.${h}`),
  );
  return match
    ? { level: "domain", reason: "match", domain }
    : { level: "manual", reason: "different-domain", domain };
}
