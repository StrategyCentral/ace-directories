import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { db } from "@/lib/supabase";
import { requireOwner } from "@/lib/ownership";
import { revalidateListing } from "@/lib/revalidate-listing";
import { INCLUDED } from "@/lib/addon-types";

export const runtime = "nodejs";

/** Set the extra suburbs a listing appears in. PUT { listing_id, suburb_ids: [] } */
export async function PUT(req: Request) {
  const body = await req.json().catch(() => ({}));
  const listingId = String(body.listing_id ?? "");
  if (!(await requireOwner(listingId))) {
    return NextResponse.json({ error: "You don't manage that listing" }, { status: 403 });
  }
  const supabase = db();
  const { data: listing } = await supabase.from("lawyers")
    .select("suburb_id,plan_code,extra_suburb_slots,extra_suburb_ids,practice_areas").eq("id", listingId).maybeSingle();
  if (!listing) return NextResponse.json({ error: "Listing not found" }, { status: 404 });

  const allowance = (INCLUDED[listing.plan_code ?? ""]?.suburbs ?? 0) + (listing.extra_suburb_slots ?? 0);
  const ids = [...new Set((Array.isArray(body.suburb_ids) ? body.suburb_ids : []).map(String))]
    .filter((id) => id !== listing.suburb_id);
  if (ids.length > allowance) {
    return NextResponse.json({ error: `Your plan covers ${allowance} extra suburb${allowance === 1 ? "" : "s"}. Add more from the add-ons panel.` }, { status: 400 });
  }
  const { data: found } = ids.length
    ? await supabase.from("suburbs").select("id,slug").in("id", ids)
    : { data: [] as { id: string; slug: string }[] };
  if ((found ?? []).length !== ids.length) return NextResponse.json({ error: "Unknown suburb" }, { status: 400 });

  // Pages for suburbs being dropped need refreshing too, so read the old set first.
  const before = (listing.extra_suburb_ids as string[]) ?? [];
  const dropped = before.filter((id) => !ids.includes(id));
  const { error } = await supabase.from("lawyers").update({ extra_suburb_ids: ids }).eq("id", listingId);
  if (error) return NextResponse.json({ error: "Could not save" }, { status: 500 });

  await revalidateListing(listingId);
  if (dropped.length) {
    const { data: old } = await supabase.from("suburbs").select("slug").in("id", dropped);
    for (const s of old ?? []) {
      revalidatePath(`/lawyers/${s.slug}`);
      for (const pa of (listing.practice_areas as string[]) ?? []) revalidatePath(`/${pa}/${s.slug}`);
    }
  }
  return NextResponse.json({ ok: true });
}
