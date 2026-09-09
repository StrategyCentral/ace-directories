import type { Metadata } from "next";
import Link from "next/link";
import { getPlans, getStats } from "@/lib/queries";
import PageHeader from "@/components/PageHeader";
import PricingTable from "@/components/PricingTable";
import Reveal from "@/components/Reveal";

export const revalidate = 3600;

export const metadata: Metadata = {
  title: "Pricing for Law Firms",
  description:
    "Verified from $89/mo, Featured from $199/mo, Suburb Dominator from $499/mo. Cheaper than a single acquired client, with no setup fee and no lock-in contract.",
  alternates: { canonical: "/pricing" },
};

const FAQ = [
  {
    q: "Is there a free listing?",
    a: "Not for new firms. The free listings you see in the directory are legacy records we hold from public sources — a name, a suburb and a phone number. Anyone joining today starts on a paid plan. It keeps the directory free of abandoned profiles, which is what made every other Australian directory unusable.",
  },
  {
    q: "How does this compare to Google Ads?",
    a: "Australian legal keywords run roughly $8–$45 a click, and agencies report $200–$550 per booked consultation. Featured costs $199 a month. If the directory sends you one matter a year it has paid for itself several times over.",
  },
  {
    q: "Is there a setup fee or a lock-in contract?",
    a: "No to both. Yellow Pages charges a setup fee of up to $3,999 and a 12-month minimum. We charge neither — cancel from your dashboard and billing stops at the end of the period.",
  },
  {
    q: "What is suburb exclusivity?",
    a: "On the Suburb Dominator plan you hold the top position for one practice area in one suburb, and no competing firm appears above you on that page. One firm per suburb per category — when it's taken, it's taken.",
  },
  {
    q: "Do you sell my enquiries to other firms?",
    a: "No. An enquiry made on your profile goes to you. We are not a lead-bidding platform and we don't auction the same matter to four firms.",
  },
  {
    q: "What happens if I cancel?",
    a: "Your listing reverts to a basic record — name, suburb, phone — and the paid fields are hidden. Nothing is deleted, and you can restart any time.",
  },
];

export default async function PricingPage() {
  const [plans, stats] = await Promise.all([getPlans(), getStats()]);

  return (
    <>
      <PageHeader
        crumbs={[{ href: "/", label: "Home" }, { label: "Pricing" }]}
        eyebrow="For law firms"
        title="One matter pays for a decade of this."
        intro={`Australian legal clicks cost $8–$45 on Google and a booked consultation runs $200–$550. A Featured listing in front of ${stats.listings.toLocaleString("en-AU")} of your peers costs $199 a month. No setup fee, no lock-in.`}
      />

      <div className="mx-auto max-w-[1240px] px-5 pb-8">
        <PricingTable plans={plans} />
      </div>

      {/* ---------------------------------------------------------- add-ons */}
      <section className="mx-auto max-w-[1240px] px-5 py-14">
        <Reveal>
          <p className="eyebrow">Add-ons</p>
          <h2 className="display text-[clamp(1.7rem,3.2vw,2.4rem)] mt-3">Extend any plan.</h2>
        </Reveal>
        <div className="mt-8 grid gap-3 sm:grid-cols-3">
          {[
            ["Extra suburb", "$39/mo", "Rank in another suburb's pages beyond your plan's allowance."],
            ["Extra practice area", "$25/mo", "Add a specialty beyond your plan's limit."],
            ["Extra exclusivity", "$299/mo", "Lock a second suburb × category combination."],
          ].map(([t, p, d]) => (
            <Reveal key={t}>
              <div className="surface rounded-[var(--radius-card)] p-6 h-full">
                <p className="text-[14.5px] font-medium">{t}</p>
                <p className="display text-[24px] text-brand-400 mt-2">{p}</p>
                <p className="text-[13px] leading-relaxed text-paper-500 mt-3">{d}</p>
              </div>
            </Reveal>
          ))}
        </div>
      </section>

      {/* -------------------------------------------------------------- FAQ */}
      <section className="mx-auto max-w-[1240px] px-5 py-14 edge-t">
        <Reveal>
          <p className="eyebrow">Questions</p>
          <h2 className="display text-[clamp(1.7rem,3.2vw,2.4rem)] mt-3">Straight answers.</h2>
        </Reveal>
        <div className="mt-8 grid gap-3 lg:grid-cols-2">
          {FAQ.map((f, i) => (
            <Reveal key={f.q} delay={i * 0.04}>
              <div className="surface rounded-[var(--radius-card)] p-6 h-full">
                <p className="text-[14.5px] font-medium">{f.q}</p>
                <p className="text-[13px] leading-relaxed text-paper-500 mt-2.5">{f.a}</p>
              </div>
            </Reveal>
          ))}
        </div>

        <div className="mt-12 flex flex-wrap gap-3">
          <Link href="/claim" className="btn btn-gold">Find &amp; claim your listing</Link>
          <Link href="/list-your-firm" className="btn btn-ghost">List a new firm</Link>
        </div>
      </section>

      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "FAQPage",
            mainEntity: FAQ.map((f) => ({
              "@type": "Question",
              name: f.q,
              acceptedAnswer: { "@type": "Answer", text: f.a },
            })),
          }),
        }}
      />
    </>
  );
}
