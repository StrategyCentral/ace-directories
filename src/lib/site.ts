export const SITE = {
  name: "Aussie Lawyer Directory",
  shortName: "ALD",
  domain: "aussielawyerdirectory.com.au",
  url: process.env.NEXT_PUBLIC_SITE_URL || "https://aussielawyerdirectory.com.au",
  tagline: "Australia's legal directory",
  description:
    "Find the right Australian lawyer in seconds. Search 5,900+ law firms and solicitors by practice area and suburb, across every state and territory.",
  email: "hello@aussielawyerdirectory.com.au",
  supportEmail: "support@aussielawyerdirectory.com.au",
  abn: "",
  postal: "Aussie Lawyer Directory, PO Box 1, Melbourne VIC 3000",
} as const;

export const STATES = [
  { code: "NSW", name: "New South Wales", slug: "nsw", capital: "Sydney" },
  { code: "VIC", name: "Victoria", slug: "vic", capital: "Melbourne" },
  { code: "QLD", name: "Queensland", slug: "qld", capital: "Brisbane" },
  { code: "WA", name: "Western Australia", slug: "wa", capital: "Perth" },
  { code: "SA", name: "South Australia", slug: "sa", capital: "Adelaide" },
  { code: "TAS", name: "Tasmania", slug: "tas", capital: "Hobart" },
  { code: "ACT", name: "Australian Capital Territory", slug: "act", capital: "Canberra" },
  { code: "NT", name: "Northern Territory", slug: "nt", capital: "Darwin" },
] as const;

export const STATE_BY_CODE = Object.fromEntries(STATES.map((s) => [s.code, s]));
export const STATE_BY_SLUG = Object.fromEntries(STATES.map((s) => [s.slug, s]));

/** Legal Aid contacts surfaced whenever someone describes an urgent situation. */
export const LEGAL_AID: Record<string, { name: string; phone: string; url: string }> = {
  NATIONAL: { name: "National Legal Aid", phone: "1300 888 529", url: "https://www.nationallegalaid.org" },
  NSW: { name: "Legal Aid NSW", phone: "1300 888 529", url: "https://www.legalaid.nsw.gov.au" },
  VIC: { name: "Victoria Legal Aid", phone: "1300 792 387", url: "https://www.legalaid.vic.gov.au" },
  QLD: { name: "Legal Aid Queensland", phone: "1300 65 11 88", url: "https://www.legalaid.qld.gov.au" },
  WA: { name: "Legal Aid WA", phone: "1300 650 579", url: "https://www.legalaid.wa.gov.au" },
  SA: { name: "Legal Services Commission SA", phone: "1300 366 424", url: "https://lsc.sa.gov.au" },
  TAS: { name: "Legal Aid Tasmania", phone: "1300 366 611", url: "https://www.legalaid.tas.gov.au" },
  ACT: { name: "Legal Aid ACT", phone: "1300 654 314", url: "https://www.legalaidact.org.au" },
  NT: { name: "NT Legal Aid Commission", phone: "1800 019 343", url: "https://www.ntlac.com.au" },
};

/** How long a lawyer has to finish claiming a listing before it is pulled down. */
export const CLAIM_WINDOW_HOURS = 72;
