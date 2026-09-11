import { createClient, type SupabaseClient } from "@supabase/supabase-js";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

let cached: SupabaseClient | null = null;

/**
 * Server-only Supabase client using the service role key.
 * Never import this into a "use client" module.
 */
export function db(): SupabaseClient {
  if (!url || !serviceKey) {
    throw new Error(
      "Supabase is not configured — set NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY",
    );
  }
  if (!cached) {
    cached = createClient(url, serviceKey, {
      auth: { persistSession: false, autoRefreshToken: false },
      global: { headers: { "x-application-name": "ald-web" } },
    });
  }
  return cached;
}

export const dbConfigured = Boolean(url && serviceKey);

/**
 * Thrown when a read fails because the database is unreachable, as distinct
 * from the row genuinely not existing.
 *
 * The difference matters more than it looks. A page that cannot reach the
 * database and calls notFound() serves a hard 404, and Google treats a 404 as
 * "this page is gone" and starts dropping it from the index. A 5xx says "try
 * again later" and it retries. During a 17-hour outage on 2026-09-10 every
 * firm and suburb page answered 404 for exactly this reason.
 */
export class DatabaseUnavailableError extends Error {
  constructor(cause?: string) {
    super(`Database unavailable${cause ? `: ${cause}` : ""}`);
    this.name = "DatabaseUnavailableError";
  }
}

/** Postgres/PostgREST codes that mean "gone", not "empty". */
export function assertReachable(error: { message?: string; code?: string } | null) {
  if (!error) return;
  const code = error.code ?? "";
  // PGRST116 is "no rows" from maybeSingle — a legitimate empty result.
  if (code === "PGRST116") return;
  throw new DatabaseUnavailableError(error.message ?? code);
}
