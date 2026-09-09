import type { Metadata } from "next";
import Link from "next/link";
import PageHeader from "@/components/PageHeader";
import PricingTable from "@/components/PricingTable";
import { getPlans, getStats } from "@/lib/queries";

export const revalidate = 3600;

export const metadata: Metadata = {
  title: "List Your Law Firm",
  description:
    "Add your Australian law practice to the directory. Verified profiles from $89/mo — no setup fee, no lock-in, and no free listings cluttering the results.",
  alternates: { canonical: "/list-your-firm" },
};

export default async function ListYourFirmPage() {
  const [plans, stats] = await Promise.all([getPlans(), getStats()]);

  return (
    <>
      <PageHeader
        crumbs={[{ href: "/", label: "Home" }, { label: "List your firm" }]}
        eyebrow="For law firms"
        title="Get in front of people already looking."
        intro={`Someone searching “family lawyer Richmond” has a matter today. We put ${stats.listings.toLocaleString("en-AU")} practices in front of that search across ${stats.suburbs.toLocaleString("en-AU")} suburbs — and unlike an ad, the page keeps working after you stop paying attention to it.`}
      >
        <div className="mt-8 flex flex-wrap gap-3">
          <Link href="/claim" className="btn btn-gold">Already listed? Claim it</Link>
          <Link href="#plans" className="btn btn-ghost">See plans</Link>
        </div>
      </PageHeader>

      <section className="mx-auto max-w-[1240px] px-5 py-10 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {[
          ["No free tier", "New firms start paid. That's why our results aren't 80% dead listings like every other AU directory."],
          ["No lead auctions", "An enquiry on your profile goes to you, not to four competitors bidding on it."],
          ["Silo SEO", "Your listing appears on the suburb and practice-area pages that actually rank, not just a profile nobody links to."],
          ["No lock-in", "No setup fee, no 12-month minimum. Cancel from the dashboard."],
        ].map(([t, d]) => (
          <div key={t} className="surface rounded-[var(--radius-card)] p-6">
            <p className="text-[14.5px] font-medium">{t}</p>
            <p className="text-[13px] leading-relaxed text-paper-500 mt-2">{d}</p>
          </div>
        ))}
      </section>

      <section id="plans" className="mx-auto max-w-[1240px] px-5 py-10">
        <PricingTable plans={plans} />
      </section>

      <section className="mx-auto max-w-[1240px] px-5 py-14 edge-t">
        <div className="surface rounded-2xl p-8 md:p-10 max-w-[720px]">
          <p className="eyebrow">New firm?</p>
          <h2 className="display text-[clamp(1.6rem,3vw,2.2rem)] mt-3">Tell us about your practice.</h2>
          <p className="text-[13.5px] leading-relaxed text-paper-400 mt-4">
            Search the directory first — most established Australian practices are already on
            file and claiming an existing listing keeps whatever ranking that page has built.
            If you genuinely aren&apos;t listed, get in touch and we&apos;ll set you up.
          </p>
          <div className="flex flex-wrap gap-3 mt-7">
            <Link href="/claim" className="btn btn-primary">Search the directory</Link>
            <Link href="/contact" className="btn btn-ghost">Contact us</Link>
          </div>
        </div>
      </section>
    </>
  );
}
