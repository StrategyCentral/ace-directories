import { STATE_BY_CODE } from "./site";

export const money = (cents: number) =>
  `$${(cents / 100).toLocaleString("en-AU", { maximumFractionDigits: 0 })}`;

export const telHref = (phone: string | null) =>
  phone ? `tel:${phone.replace(/[^\d+]/g, "")}` : undefined;

export const stateName = (code: string | null | undefined) =>
  (code && STATE_BY_CODE[code]?.name) || code || "Australia";

export function suburbLabel(suburb: string | null, state: string | null) {
  if (suburb && state) return `${suburb}, ${state}`;
  return suburb || stateName(state);
}

/** Deterministic initials badge for listings with no logo. */
export function initials(name: string) {
  const words = name.replace(/[^A-Za-z0-9 &]/g, " ").split(/\s+/).filter(Boolean);
  const stop = new Set(["and", "the", "of", "pty", "ltd", "limited", "&"]);
  const useful = words.filter((w) => !stop.has(w.toLowerCase()));
  const src = useful.length ? useful : words;
  return (src[0]?.[0] ?? "L").toUpperCase() + (src[1]?.[0] ?? "").toUpperCase();
}

/** Stable hue per listing so cards feel individual without being random on rerender. */
export function hueFrom(seed: string) {
  let h = 0;
  for (let i = 0; i < seed.length; i++) h = (h * 31 + seed.charCodeAt(i)) % 360;
  return 200 + (h % 60); // keep it in the blue band
}

/**
 * Short human label for a practice-area slug, for use on cards where the full
 * category name ("Wills & Estates Lawyers") is too long to sit in a chip.
 */
const AREA_OVERRIDES: Record<string, string> = {
  "ip-lawyers": "Intellectual property",
  "wills-estates-lawyers": "Wills & estates",
  "planning-environment-lawyers": "Planning & environment",
  "workers-compensation-lawyers": "Workers comp",
  "estate-dispute-lawyers": "Contesting a will",
  "general-practice": "General practice",
  "notary-public": "Notary public",
  barristers: "Barrister",
  mediators: "Mediation",
  conveyancers: "Conveyancing",
};

export function areaLabel(slug: string) {
  if (AREA_OVERRIDES[slug]) return AREA_OVERRIDES[slug];
  const base = slug.replace(/-lawyers?$/, "").replace(/-law$/, "").replace(/-/g, " ");
  return base.charAt(0).toUpperCase() + base.slice(1);
}

export const titleCase = (s: string) =>
  s.replace(/\w\S*/g, (t) => t[0].toUpperCase() + t.slice(1).toLowerCase());

export function timeLeft(iso: string) {
  const ms = new Date(iso).getTime() - Date.now();
  if (ms <= 0) return { expired: true, hours: 0, minutes: 0, days: 0, seconds: 0 };
  const seconds = Math.floor(ms / 1000);
  return {
    expired: false,
    days: Math.floor(seconds / 86400),
    hours: Math.floor((seconds % 86400) / 3600),
    minutes: Math.floor((seconds % 3600) / 60),
    seconds: seconds % 60,
  };
}

export const cx = (...parts: (string | false | null | undefined)[]) =>
  parts.filter(Boolean).join(" ");
