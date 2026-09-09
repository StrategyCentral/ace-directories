export type Tier = "free" | "verified" | "featured" | "dominator" | "firm";

export interface Listing {
  id: string;
  slug: string;
  full_name: string;
  entity_type: string | null;
  status: string;
  tier: Tier;
  is_claimed: boolean;
  address: string | null;
  suburb: string | null;
  suburb_id: string | null;
  state: string | null;
  postcode: string | null;
  full_address: string | null;
  lat: number | null;
  lng: number | null;
  phone: string | null;
  email: string | null;
  website: string | null;
  practice_areas: string[] | null;
  languages: string[] | null;
  tagline: string | null;
  bio: string | null;
  logo_url: string | null;
  photo_url: string | null;
  founded_year: number | null;
  team_size: number | null;
  accreditations: string[] | null;
  socials: Record<string, string> | null;
  review_count: number;
  review_avg: number;
  profile_score: number;
  rank_score: number;
  view_count: number;
  verified_at: string | null;
  original_url: string | null;
}

export interface PracticeArea {
  id: string;
  slug: string;
  name: string;
  singular: string | null;
  blurb: string | null;
  hero_question: string | null;
  intent_terms: string[] | null;
  tier: number;
  sort_order: number;
  listing_count: number;
}

export interface Suburb {
  id: string;
  slug: string;
  name: string;
  state: string;
  postcode: string | null;
  lat: number | null;
  lng: number | null;
  is_major: boolean;
  listing_count: number;
}

export interface Plan {
  code: string;
  name: string;
  tagline: string | null;
  monthly_price: number;
  yearly_price: number;
  tier: Tier;
  max_practice_areas: number;
  max_suburbs: number;
  features: string[];
  sort_order: number;
  is_popular: boolean;
}

export interface Claim {
  id: string;
  listing_id: string;
  email: string;
  full_name: string | null;
  status: string;
  started_at: string;
  expires_at: string;
  emails_sent: number;
  selected_plan: string | null;
}

/** Paid tiers unlock contact fields and long-form profile content. */
export const PAID_TIERS: Tier[] = ["verified", "featured", "dominator", "firm"];
export const isPaid = (t: Tier | string | null | undefined) =>
  PAID_TIERS.includes((t || "free") as Tier);
