import { db } from "./supabase";
import { getSession } from "./auth";

/**
 * The signed-in person manages a listing when they hold a completed claim on
 * it. Returns the session email, or null.
 */
export async function requireOwner(listingId: string): Promise<string | null> {
  const session = await getSession();
  if (!session || !listingId) return null;
  const { data } = await db().from("claims")
    .select("id").eq("listing_id", listingId).eq("email", session.email)
    .eq("status", "completed").limit(1).maybeSingle();
  return data ? session.email : null;
}
