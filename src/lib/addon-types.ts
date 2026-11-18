/** Shared by server and client. No imports from server-only modules here. */
export type AddonCode = "exclusive" | "extra_suburb" | "team_profile";

export interface Addon {
  code: AddonCode;
  name: string;
  blurb: string;
  monthly_price: number;
  yearly_price: number;
  stripe_price_monthly: string | null;
  stripe_price_yearly: string | null;
}

/** What each plan includes before any add-on. */
export const INCLUDED: Record<string, { suburbs: number; team: number }> = {
  verified: { suburbs: 0, team: 0 },
  featured: { suburbs: 2, team: 3 },
};

export const MAX_QTY: Record<"extra_suburb" | "team_profile", number> = {
  extra_suburb: 10,
  team_profile: 20,
};

/** The plan a firm must be on to hold a Suburb Exclusive. */
export const EXCLUSIVE_PLAN = "featured";

export interface Founder {
  active: boolean;
  remaining: number;
  cap: number;
  percent: number;
  months: number;
  coupon: string;
}

export const founderPrice = (cents: number, f: Founder | null | undefined) =>
  f?.active ? Math.round((cents * (100 - f.percent)) / 100) : cents;

export interface AddonSelection {
  /** Practice area slug to lock, or null. */
  exclusive?: string | null;
  extra_suburb?: number;
  team_profile?: number;
}
