import { NextResponse } from "next/server";
import { db } from "@/lib/supabase";
import { requireOwner } from "@/lib/ownership";
import { revalidateListing } from "@/lib/revalidate-listing";
import { INCLUDED } from "@/lib/addon-types";

export const runtime = "nodejs";

const slugify = (v: string) =>
  v.toLowerCase().normalize("NFKD").replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 70);

const clean = (v: unknown, max: number) => {
  const s = String(v ?? "").trim().slice(0, max);
  return s || null;
};
const httpUrl = (v: unknown) => {
  const s = clean(v, 500);
  return s && /^https:\/\//i.test(s) ? s : null;
};

const PARENT_FIELDS =
  "id,slug,full_name,plan_code,tier,rank_score,team_slots,practice_areas,suburb,suburb_id,state,postcode," +
  "address,full_address,lat,lng,phone,phone_display,website";

type Parent = Record<string, unknown> & {
  id: string; full_name: string; plan_code: string | null; tier: string; rank_score: number;
  team_slots: number; practice_areas: string[] | null; suburb: string | null;
};

async function loadParent(listingId: string): Promise<Parent | null> {
  const { data } = await db().from("lawyers").select(PARENT_FIELDS).eq("id", listingId).maybeSingle();
  return (data as unknown as Parent) ?? null;
}

function fieldsFrom(body: Record<string, unknown>, parent: Parent) {
  const allowed = new Set(parent.practice_areas ?? []);
  const areas = (Array.isArray(body.practice_areas) ? body.practice_areas.map(String) : [])
    .filter((a) => allowed.has(a));
  return {
    role_title: clean(body.role_title, 80),
    bio: clean(body.bio, 3000),
    photo_url: httpUrl(body.photo_url),
    practice_areas: areas.length ? areas : (parent.practice_areas ?? []).slice(0, 1),
  };
}

/** Add a lawyer profile under a firm. POST { listing_id, full_name, role_title, bio, photo_url, practice_areas } */
export async function POST(req: Request) {
  const body = await req.json().catch(() => ({}));
  const parentId = String(body.listing_id ?? "");
  if (!(await requireOwner(parentId))) return NextResponse.json({ error: "You don't manage that listing" }, { status: 403 });
  const parent = await loadParent(parentId);
  if (!parent) return NextResponse.json({ error: "Listing not found" }, { status: 404 });

  const name = clean(body.full_name, 120);
  if (!name || name.length < 3) return NextResponse.json({ error: "Enter the lawyer's full name" }, { status: 400 });

  const supabase = db();
  const allowance = (INCLUDED[parent.plan_code ?? ""]?.team ?? 0) + (parent.team_slots ?? 0);
  const { count } = await supabase.from("lawyers").select("id", { count: "exact", head: true })
    .eq("parent_listing_id", parentId).in("status", ["live", "hidden"]);
  if ((count ?? 0) >= allowance) {
    return NextResponse.json({ error: allowance === 0
      ? "Lawyer profiles come with Featured, or add them one at a time from the add-ons panel."
      : `Your plan covers ${allowance} lawyer profile${allowance === 1 ? "" : "s"}. Add more from the add-ons panel.` }, { status: 400 });
  }

  let slug = slugify(`${name} ${parent.suburb ?? ""}`);
  const { data: clash } = await supabase.from("lawyers").select("id").eq("slug", slug).maybeSingle();
  if (clash) slug = `${slug}-${Math.random().toString(36).slice(2, 6)}`;

  const { data, error } = await supabase.from("lawyers").insert({
    full_name: name, slug, entity_type: "individual", parent_listing_id: parentId,
    firm_name: parent.full_name, status: "live", is_claimed: true, tier: parent.tier,
    rank_score: Math.max(0, (parent.rank_score ?? 0) - 1), source: "firm_team",
    suburb: parent.suburb, suburb_id: parent.suburb_id, state: parent.state, postcode: parent.postcode,
    address: parent.address, full_address: parent.full_address, lat: parent.lat, lng: parent.lng,
    phone: parent.phone, phone_display: parent.phone_display, website: parent.website,
    claimed_at: new Date().toISOString(),
    ...fieldsFrom(body, parent),
  }).select("id,slug").single();
  if (error) {
    console.error("team insert failed", error);
    return NextResponse.json({ error: "Could not add that profile" }, { status: 500 });
  }
  await revalidateListing(data.id);
  return NextResponse.json({ ok: true, id: data.id, slug: data.slug });
}

/** Edit or remove one. PATCH { id, ...fields }  ·  DELETE { id } */
async function ownedMember(id: string) {
  const { data: m } = await db().from("lawyers").select("id,parent_listing_id").eq("id", id).maybeSingle();
  if (!m?.parent_listing_id) return null;
  if (!(await requireOwner(m.parent_listing_id))) return null;
  return m as { id: string; parent_listing_id: string };
}

export async function PATCH(req: Request) {
  const body = await req.json().catch(() => ({}));
  const m = await ownedMember(String(body.id ?? ""));
  if (!m) return NextResponse.json({ error: "You don't manage that profile" }, { status: 403 });
  const parent = await loadParent(m.parent_listing_id);
  if (!parent) return NextResponse.json({ error: "Listing not found" }, { status: 404 });
  const name = clean(body.full_name, 120);
  const patch = { ...fieldsFrom(body, parent), ...(name && name.length >= 3 ? { full_name: name } : {}), updated_at: new Date().toISOString() };
  const { error } = await db().from("lawyers").update(patch).eq("id", m.id);
  if (error) return NextResponse.json({ error: "Could not save" }, { status: 500 });
  await revalidateListing(m.id);
  return NextResponse.json({ ok: true });
}

export async function DELETE(req: Request) {
  const body = await req.json().catch(() => ({}));
  const m = await ownedMember(String(body.id ?? ""));
  if (!m) return NextResponse.json({ error: "You don't manage that profile" }, { status: 403 });
  await db().from("lawyers").update({ status: "removed" }).eq("id", m.id);
  await revalidateListing(m.id);
  return NextResponse.json({ ok: true });
}
