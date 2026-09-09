import type { Metadata } from "next";
import Link from "next/link";
import PageHeader from "@/components/PageHeader";
import ClaimFinder from "@/components/ClaimFinder";
import { getStats } from "@/lib/queries";

export const revalidate = 3600;

export const metadata: Metadata = {
  title: "Claim Your Law Firm Listing",
  description:
    "Find your firm in the Aussie Lawyer Directory and take control of your listing — website link, practice areas, enquiry form and a verified badge.",
  alternates: { canonical: "/claim" },
};

export default async function ClaimIndexPage() {
  const stats = await getStats().catch(() => ({ listings: 5900, suburbs: 1000, practiceAreas: 34, states: 8 }));

  return (
    <>
      <PageHeader
        crumbs={[{ href: "/", label: "Home" }, { label: "Claim your listing" }]}
        eyebrow="For law firms"
        title="Find your firm. Take the page back."
        intro={`We hold ${stats.listings.toLocaleString("en-AU")} Australian practices on file. If yours is one of them, the page exists whether you manage it or not — search for it below.`}
      />

      <div className="mx-auto max-w-[1240px] px-5 pb-14">
        <ClaimFinder />

        <section className="mt-16 grid gap-4 md:grid-cols-3">
          {[
            {
              n: "01",
              t: "Find your listing",
              d: "Search by firm name or suburb. Every practice we hold is here, claimed or not.",
            },
            {
              n: "02",
              t: "Verify you're the firm",
              d: "Confirm your details and we email a verification link to your work address. Takes about two minutes.",
            },
            {
              n: "03",
              t: "Choose a plan and go live",
              d: "Pick Verified, Featured or Suburb Dominator. Your profile unlocks the moment payment clears.",
            },
          ].map((s) => (
            <div key={s.n} className="surface rounded-[var(--radius-card)] p-6">
              <p className="display text-[28px] text-brand-500/60">{s.n}</p>
              <h3 className="text-[15px] font-medium mt-3">{s.t}</h3>
              <p className="text-[13px] leading-relaxed text-paper-500 mt-2">{s.d}</p>
            </div>
          ))}
        </section>

        <section className="mt-10 surface rounded-2xl p-7 md:p-9 border-gold-500/20">
          <p className="eyebrow text-gold-400">Important</p>
          <h2 className="text-[17px] font-medium mt-3">Claims run on a 72-hour clock.</h2>
          <p className="text-[13.5px] leading-relaxed text-paper-400 mt-3 max-w-[680px]">
            Once you start a claim, the listing is reserved for you for three days. If the claim
            isn&apos;t completed in that window the reservation lapses and the unclaimed
            listing is removed from the directory — we don&apos;t keep half-finished profiles
            live. You can always start again later, but the page (and any search ranking it has
            built) goes with it.
          </p>
          <Link href="/pricing" className="inline-block mt-5 text-[13.5px] text-brand-400 hover:text-brand-200">
            See what each plan includes →
          </Link>
        </section>

        <p className="text-[12px] text-paper-600 mt-8 max-w-[680px]">
          Not your firm, or you&apos;d rather not be listed at all?{" "}
          <Link href="/remove-my-listing" className="underline hover:text-paper-400">
            Request removal
          </Link>{" "}
          — we action removals within two business days, free of charge.
        </p>
      </div>
    </>
  );
}
