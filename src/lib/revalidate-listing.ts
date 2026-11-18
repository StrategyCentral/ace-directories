import { revalidatePath } from "next/cache";
import { db } from "./supabase";

/**
 * Refresh every cached page a listing appears on, right after it changes.
 *
 * The long-tail SEO pages are ISR-cached for seven days to keep database egress
 * down. Without this, a firm that pays, gets its Verified badge and edits its
 * profile would see none of it on the public site for up to a week — which
 * reads as "I paid and nothing happened".
 *
 * Best-effort: a failure here must never fail the write that triggered it.
 */
export async function revalidateListing(listingId: string): Promise<void> {
  try {
    const { data } = await db()
      .from("lawyers")
      .select("slug,state,practice_areas,extra_suburb_ids,parent_listing_id,suburbs(slug)")
      .eq("id", listingId)
      .maybeSingle();
    const l = data as unknown as {
      slug: string;
      state: string | null;
      practice_areas: string[] | null;
      suburbs: { slug: string } | null;
      extra_suburb_ids: string[] | null;
      parent_listing_id: string | null;
    } | null;
    if (!l) return;

    const places = [l.suburbs?.slug, l.state?.toLowerCase()].filter(Boolean) as string[];
    if (l.extra_suburb_ids?.length) {
      const { data: extra } = await db().from("suburbs").select("slug").in("id", l.extra_suburb_ids);
      for (const s of extra ?? []) places.push(s.slug);
    }
    const paths = new Set<string>([`/firm/${l.slug}`]);
    for (const place of places) {
      paths.add(`/lawyers/${place}`);
      for (const pa of l.practice_areas ?? []) paths.add(`/${pa}/${place}`);
    }
    for (const pa of l.practice_areas ?? []) paths.add(`/${pa}`);

    if (l.parent_listing_id) {
      const { data: parent } = await db().from("lawyers").select("slug").eq("id", l.parent_listing_id).maybeSingle();
      if (parent?.slug) paths.add(`/firm/${parent.slug}`);
    }

    for (const p of paths) revalidatePath(p);
  } catch (e) {
    console.error("revalidateListing failed", listingId, e);
  }
}
