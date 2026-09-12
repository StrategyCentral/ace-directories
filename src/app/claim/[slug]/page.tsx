import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import { getListing, getPlans } from "@/lib/queries";
import { db } from "@/lib/supabase";
import PageHeader from "@/components/PageHeader";
import ClaimFlow from "@/components/ClaimFlow";
import { firmHosts } from "@/lib/claim-domain";
import Countdown from "@/components/Countdown";
import { CLAIM_WINDOW_HOURS } from "@/lib/site";
import { CLAIM_CHECKLIST } from "@/content/onboarding";

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
    .select("id,status,expires_at,email,selected_plan,emails_sent,verification_level")
    .eq("listing_id", listingId)
    .in("status", ["started", "verifying", "awaiting_payment", "manual_review"])
    .order("started_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  return data as
    | { id: string; status: string; expires_at: string | null; email: string; selected_plan: string | null; emails_sent: number; verification_level: string }
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
        <div className="space-y-6">
          <ClaimFlow
            listing={{
              id: listing.id,
              slug: listing.slug,
              name: listing.full_name,
              suburb: listing.suburb,
              state: listing.state,
              phone: listing.phone,
              firmHosts: firmHosts(listing),
            }}
            plans={plans}
            existingClaim={claim}
          />

          {/* Sits under the form, across the full column, so the page doesn't
              run on past the fold. */}
          <div className="surface rounded-2xl p-6">
            <p className="eyebrow mb-4">What you unlock</p>
            <ul className="grid gap-x-6 gap-y-2.5 sm:grid-cols-2 lg:grid-cols-3">
              {[
                "Your website link (currently hidden)",
                "Up to 8 practice areas instead of 1",
                "Firm description, logo and photos",
                "An enquiry form that emails you directly",
                "Verified badge and higher placement",
                "Client reviews on your profile",
              ].map((f) => (
                <li key={f} className="flex gap-2.5 text-[13px] text-paper-400">
                  <span className="text-brand-400 shrink-0 mt-0.5" aria-hidden="true">✓</span>
                  <span>{f}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <aside className="lg:sticky lg:top-24 space-y-4">
          {claim && claim.expires_at ? (
            <div className="surface rounded-2xl p-6 border-gold-500/25">
              <p className="eyebrow text-gold-400">Reserved for you</p>
              <p className="text-[13px] leading-relaxed text-paper-400 mt-3">
                Held for {claim.email} while you choose a plan. We&apos;ll email you once a day
                so it can&apos;t lapse by accident.
              </p>
              <div className="mt-5">
                <Countdown expiresAt={claim.expires_at} />
              </div>
            </div>
          ) : claim ? (
            <div className="surface rounded-2xl p-6">
              <p className="eyebrow">Awaiting confirmation</p>
              <p className="text-[13px] leading-relaxed text-paper-400 mt-3">
                We&apos;ve emailed {claim.email} a confirmation link. Nothing on this listing
                changes until someone clicks it.
              </p>
            </div>
          ) : (
            <div className="surface rounded-2xl p-6">
              <p className="eyebrow">Have these ready</p>
              <p className="text-[12.5px] leading-relaxed text-paper-500 mt-2.5">
                None of it is needed to start — but having it to hand means you can finish the
                whole profile in one sitting.
              </p>
              <ul className="mt-4 space-y-3">
                {CLAIM_CHECKLIST.map((c) => (
                  <li key={c.item} className="flex gap-2.5">
                    <span className="text-brand-400 text-[12px] mt-0.5" aria-hidden="true">✓</span>
                    <span>
                      <span className="block text-[13px] text-paper-200">{c.item}</span>
                      <span className="block text-[11.5px] text-paper-600 mt-0.5">{c.note}</span>
                    </span>
                  </li>
                ))}
              </ul>
              <p className="text-[11.5px] leading-relaxed text-paper-600 mt-5 pt-4 border-t border-white/[0.06]">
                We email a link to confirm the address is yours — that check is what stops anyone
                but your firm taking control of this page.
              </p>
            </div>
          )}

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
