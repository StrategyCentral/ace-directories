import { cache } from "react";
import { db } from "./supabase";
import type { Listing, Plan, PracticeArea, Suburb } from "./types";

const LISTING_FIELDS =
  "id,slug,full_name,entity_type,status,tier,is_claimed,address,suburb,suburb_id,state,postcode," +
  "full_address,lat,lng,phone,email,website,practice_areas,languages,tagline,bio,logo_url,photo_url," +
  "founded_year,team_size,accreditations,socials,review_count,review_avg,profile_score,rank_score," +
  "view_count,verified_at,original_url";

/* ------------------------------------------------------------------ taxonomy */

export const getPracticeAreas = cache(async (): Promise<PracticeArea[]> => {
  const { data } = await db()
    .from("practice_areas")
    .select("id,slug,name,singular,blurb,hero_question,intent_terms,tier,sort_order,listing_count")
    .order("tier", { ascending: true })
    .order("listing_count", { ascending: false })
    .order("sort_order", { ascending: true });
  return (data as PracticeArea[]) ?? [];
});

export const getPracticeArea = cache(async (slug: string): Promise<PracticeArea | null> => {
  const { data } = await db()
    .from("practice_areas")
    .select("id,slug,name,singular,blurb,hero_question,intent_terms,tier,sort_order,listing_count")
    .eq("slug", slug)
    .maybeSingle();
  return (data as PracticeArea) ?? null;
});

/* ----------------------------------------------------------------- geography */

export const getSuburb = cache(async (slug: string): Promise<Suburb | null> => {
  const { data } = await db().from("suburbs").select("*").eq("slug", slug).maybeSingle();
  return (data as Suburb) ?? null;
});

export const getTopSuburbs = cache(async (state?: string, limit = 24): Promise<Suburb[]> => {
  let q = db().from("suburbs").select("*").gt("listing_count", 0)
    .order("listing_count", { ascending: false }).limit(limit);
  if (state) q = q.eq("state", state);
  const { data } = await q;
  return (data as Suburb[]) ?? [];
});

export const searchSuburbs = cache(async (term: string, limit = 8): Promise<Suburb[]> => {
  if (!term.trim()) return [];
  const { data } = await db()
    .from("suburbs")
    .select("*")
    .ilike("name", `${term}%`)
    .order("listing_count", { ascending: false })
    .limit(limit);
  return (data as Suburb[]) ?? [];
});

/* ------------------------------------------------------------------ listings */

export interface SearchArgs {
  q?: string;
  practice?: string;
  suburbId?: string;
  state?: string;
  page?: number;
  perPage?: number;
}

export async function searchListings(args: SearchArgs): Promise<{ rows: Listing[]; total: number }> {
  const perPage = args.perPage ?? 20;
  const page = Math.max(1, args.page ?? 1);
  const from = (page - 1) * perPage;

  let query = db()
    .from("lawyers")
    .select(LISTING_FIELDS, { count: "exact" })
    .eq("status", "live");

  if (args.practice) query = query.contains("practice_areas", [args.practice]);
  if (args.suburbId) query = query.eq("suburb_id", args.suburbId);
  if (args.state) query = query.eq("state", args.state);
  if (args.q?.trim()) query = query.ilike("search_text", `%${args.q.trim().toLowerCase()}%`);

  const { data, count } = await query
    .order("rank_score", { ascending: false })
    .order("review_count", { ascending: false })
    .order("full_name", { ascending: true })
    .range(from, from + perPage - 1);

  return { rows: (data as unknown as Listing[]) ?? [], total: count ?? 0 };
}

/**
 * Category pages need bodies on the page even in suburbs where no firm has
 * self-identified with that specialty yet. Exact matches always rank first;
 * general practices in the same suburb fill the rest and are labelled honestly.
 */
export async function listingsForCategoryPlace(
  practice: string,
  opts: { suburbId?: string; state?: string; limit?: number },
): Promise<{ exact: Listing[]; general: Listing[]; exactTotal: number }> {
  const limit = opts.limit ?? 20;
  const { rows: exact, total: exactTotal } = await searchListings({
    practice, suburbId: opts.suburbId, state: opts.state, perPage: limit,
  });

  let general: Listing[] = [];
  if (exact.length < limit) {
    const { rows } = await searchListings({
      practice: "general-practice",
      suburbId: opts.suburbId,
      state: opts.suburbId ? undefined : opts.state,
      perPage: limit - exact.length,
    });
    const seen = new Set(exact.map((r) => r.id));
    general = rows.filter((r) => !seen.has(r.id));
  }
  return { exact, general, exactTotal };
}

export const getListing = cache(async (slug: string): Promise<Listing | null> => {
  const { data } = await db().from("lawyers").select(LISTING_FIELDS).eq("slug", slug).maybeSingle();
  return (data as unknown as Listing) ?? null;
});

export const getNearbyListings = cache(
  async (listing: Listing, limit = 6): Promise<Listing[]> => {
    let q = db()
      .from("lawyers")
      .select(LISTING_FIELDS)
      .eq("status", "live")
      .neq("id", listing.id)
      .order("rank_score", { ascending: false })
      .limit(limit);
    if (listing.suburb_id) q = q.eq("suburb_id", listing.suburb_id);
    else if (listing.state) q = q.eq("state", listing.state);
    const { data } = await q;
    return (data as unknown as Listing[]) ?? [];
  },
);

/* ---------------------------------------------------------------- aggregates */

export const getStats = cache(async () => {
  const [listings, suburbs, areas] = await Promise.all([
    db().from("lawyers").select("id", { count: "exact", head: true }).eq("status", "live"),
    db().from("suburbs").select("id", { count: "exact", head: true }).gt("listing_count", 0),
    db().from("practice_areas").select("id", { count: "exact", head: true }),
  ]);
  return {
    listings: listings.count ?? 0,
    suburbs: suburbs.count ?? 0,
    practiceAreas: areas.count ?? 0,
    states: 8,
  };
});

/** Coordinates for the hero point cloud — one dot per real listing. */
export const getMapPoints = cache(async (): Promise<[number, number][]> => {
  // Supabase caps a single response at 1,000 rows, so page through the set.
  const PAGE = 1000;
  const out: [number, number][] = [];
  for (let page = 0; page < 6; page++) {
    const { data } = await db()
      .from("lawyers")
      .select("lat,lng")
      .eq("status", "live")
      .not("lat", "is", null)
      .range(page * PAGE, page * PAGE + PAGE - 1);
    const rows = (data as { lat: number; lng: number }[]) ?? [];
    for (const p of rows) {
      if (p.lat < -9 && p.lat > -45 && p.lng > 110 && p.lng < 155) out.push([p.lng, p.lat]);
    }
    if (rows.length < PAGE) break;
  }
  return out;
});

/* ------------------------------------------------- internal-linking blocks */

export const paSuburbCounts = cache(
  async (pa: string, limit = 40): Promise<{ slug: string; name: string; state: string; n: number }[]> => {
    const { data } = await db().rpc("pa_suburb_counts", { pa, lim: limit });
    return (data as { slug: string; name: string; state: string; n: number }[]) ?? [];
  },
);

export const paStateCounts = cache(async (pa: string): Promise<{ state: string; n: number }[]> => {
  const { data } = await db().rpc("pa_state_counts", { pa });
  return (data as { state: string; n: number }[]) ?? [];
});

export const suburbPaCounts = cache(
  async (sub: string): Promise<{ slug: string; name: string; n: number }[]> => {
    const { data } = await db().rpc("suburb_pa_counts", { sub });
    return (data as { slug: string; name: string; n: number }[]) ?? [];
  },
);

export const statePaCounts = cache(
  async (st: string): Promise<{ slug: string; name: string; n: number }[]> => {
    const { data } = await db().rpc("state_pa_counts", { st });
    return (data as { slug: string; name: string; n: number }[]) ?? [];
  },
);

export const nearbySuburbs = cache(
  async (sub: string, limit = 12): Promise<{ slug: string; name: string; state: string; n: number }[]> => {
    const { data } = await db().rpc("nearby_suburbs", { sub, lim: limit });
    return (data as { slug: string; name: string; state: string; n: number }[]) ?? [];
  },
);

/* ------------------------------------------------------------- activity */

export interface Activity {
  views_30: number;
  calls_30: number;
  website_30: number;
  enquiries_30: number;
  views_90: number;
  calls_90: number;
  first_seen: string | null;
}

export async function getListingActivity(listingId: string): Promise<Activity> {
  const empty: Activity = {
    views_30: 0, calls_30: 0, website_30: 0, enquiries_30: 0,
    views_90: 0, calls_90: 0, first_seen: null,
  };
  try {
    const { data } = await db().rpc("listing_activity", { listing: listingId });
    const row = (data as Activity[] | null)?.[0];
    return row ? { ...empty, ...row } : empty;
  } catch {
    return empty;
  }
}

export async function getListingDaily(
  listingId: string,
  days = 30,
): Promise<{ day: string; views: number; calls: number }[]> {
  try {
    const { data } = await db().rpc("listing_daily_views", { listing: listingId, days });
    return (data as { day: string; views: number; calls: number }[]) ?? [];
  } catch {
    return [];
  }
}

export const getPlans = cache(async (): Promise<Plan[]> => {
  const { data } = await db().from("plans").select("*").eq("is_public", true)
    .order("sort_order", { ascending: true });
  return ((data as Plan[]) ?? []).map((p) => ({
    ...p,
    features: Array.isArray(p.features) ? p.features : [],
  }));
});

export const getPlan = cache(async (code: string): Promise<Plan | null> => {
  const { data } = await db().from("plans").select("*").eq("code", code).maybeSingle();
  if (!data) return null;
  const p = data as Plan;
  return { ...p, features: Array.isArray(p.features) ? p.features : [] };
});
