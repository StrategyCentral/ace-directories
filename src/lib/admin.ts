import { getSession } from "./auth";

/**
 * Admin access is an allow-list of email addresses in ADMIN_EMAILS, checked
 * against the signed session. Deliberately not a database role — moderation
 * powers should not be grantable by anything the app itself writes.
 */
export async function requireAdmin(): Promise<{ email: string } | null> {
  const session = await getSession();
  if (!session) return null;
  const allowed = (process.env.ADMIN_EMAILS ?? "")
    .split(",")
    .map((e) => e.trim().toLowerCase())
    .filter(Boolean);
  return allowed.includes(session.email.toLowerCase()) ? session : null;
}
