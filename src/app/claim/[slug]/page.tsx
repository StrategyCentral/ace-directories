import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import { getListing, getPlans } from "@/lib/queries";
import { db } from "@/lib/supabase";
import PageHeader from "@/components/PageHeader";
import ClaimFlow from "@/components/ClaimFlow";
import Countdown from "@/components/Countdown";
import { CLAIM_WINDOW_HOURS } from "@/lib/site";

export const dynamic = "force-dynamic";

export async function generateMetadata({
  params,
}: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const l = await getListing(slug);
  return {
    title: l ? `Claim ${l.full_name}` : "Claim your listing",
    robots: { index: false, follow: false },
  };
}

/** The most recent claim that is still running, if any. */
async function activeClaim(listingId: string) {
  const { data } = await db()
    .from("claims")
    .select("id,status,expires_at,email,selected_plan,emails_sent")
    .eq("listing_id", listingId)
    .in("status", ["started", "verifying", "awaiting_payment"])
    .gt("expires_at", new Date().toISOString())
    .order("started_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  return data as
    | { id: string; status: string; expires_at: string; email: string; selected_plan: string | null; emails_sent: number }
    | null;
}

export default async function ClaimListingPage({
  params,
}: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const listing = await getListing(slug);
  if (!listing || listing.status === "removed") notFound();

  const [plans, claim] = await Promise.all([getPlans(), activeClaim(listing.id)]);

  if (listing.is_claimed) {
    return (
      <PageHeader
        crumbs={[{ href: "/", label: "Home" }, { href: "/claim", label: "Claim" }, { label: listing.full_name }]}
        title="This listing is already claimed"
        intro={`${listing.full_name} is managed by its firm. If you believe that's wrong, contact us and we'll investigate.`}
      >
        <div className="mt-7 flex gap-3">
          <Link href={`/firm/${listing.slug}`} className="btn btn-ghost">View the profile</Link>
          <Link href="/contact" className="btn btn-primary">Dispute this claim</Link>
        </div>
      </PageHeader>
    );
  }

  const where = [listing.suburb, listing.state].filter(Boolean).join(", ");

  return (
    <>
      <PageHeader
        crumbs={[{ href: "/", label: "Home" }, { href: "/claim", label: "Claim" }, { label: listing.full_name }]}
        eyebrow="Claim listing"
        title={listing.full_name}
        intro={`${where} · currently ${listing.profile_score}% complete. Complete the steps below and this page becomes yours to control.`}
      />

      <div className="mx-auto max-w-[1240px] px-5 pb-16 grid gap-8 lg:grid-cols-[1fr_360px] lg:items-start">
        <ClaimFlow
          listing={{
            id: listing.id,
            slug: listing.slug,
            name: listing.full_name,
            suburb: listing.suburb,
            state: listing.state,
            phone: listing.phone,
          }}
          plans={plans}
          existingClaim={claim}
        />

        <aside className="lg:sticky lg:top-24 space-y-4">
          {claim ? (
            <div className="surface rounded-2xl p-6 border-gold-500/25">
              <p className="eyebrow text-gold-400">Claim in progress</p>
              <p className="text-[13px] leading-relaxed text-paper-400 mt-3">
                Reserved for {claim.email}. Finish before the clock runs out or the listing is
                removed from the directory.
              </p>
              <div className="mt-5">
                <Countdown expiresAt={claim.expires_at} />
              </div>
            </div>
          ) : (
            <div className="surface rounded-2xl p-6">
              <p className="eyebrow">Before you start</p>
              <p className="text-[13px] leading-relaxed text-paper-400 mt-3">
                Starting a claim reserves this listing for{" "}
                <strong className="text-paper-200">{CLAIM_WINDOW_HOURS} hours</strong>. If it
                isn&apos;t completed in that window the reservation lapses and the unclaimed
                listing is removed from the directory.
              </p>
              <p className="text-[12px] leading-relaxed text-paper-600 mt-4">
                We&apos;ll email you once a day while the clock is running so it can&apos;t
                lapse by accident.
              </p>
            </div>
          )}

          <div className="surface rounded-2xl p-6">
            <p className="eyebrow mb-3">What you unlock</p>
            <ul className="space-y-2 text-[13px] text-paper-400">
              {[
                "Your website link (currently hidden)",
                "Up to 8 practice areas instead of 1",
                "Firm description, logo and photos",
                "An enquiry form that emails you directly",
                "Verified badge and higher placement",
                "Client reviews on your profile",
              ].map((f) => (
                <li key={f} className="flex gap-2.5">
                  <span className="text-brand-400 mt-0.5">✓</span>
                  {f}
                </li>
              ))}
            </ul>
          </div>

          <p className="text-[11.5px] leading-relaxed text-paper-600">
            Rather not be listed at all?{" "}
            <Link href="/remove-my-listing" className="underline hover:text-paper-400">
              Request removal
            </Link>{" "}
            — free, no plan required.
          </p>
        </aside>
      </div>
    </>
  );
}
