import type { Metadata } from "next";
import Link from "next/link";
import { getPlans, getStats } from "@/lib/queries";
import { getAddons, getFounder } from "@/lib/addons";
import { money } from "@/lib/format";
import Testimonials from "@/components/Testimonials";
import PageHeader from "@/components/PageHeader";
import PricingTable from "@/components/PricingTable";
import Reveal from "@/components/Reveal";

export const revalidate = 3600;

export const metadata: Metadata = {
  title: "Pricing for Law Firms",
  description:
    "Verified from $89 a month, Featured from $199 a month. One new client covers the cost. No setup fee and no minimum term.",
  alternates: { canonical: "/pricing" },
};

const FAQ = [
  {
    q: "Is there a free listing?",
    a: "Not for new firms. The free listings you see in the directory are legacy records we hold from public sources — a name, a suburb and a phone number. Anyone joining today starts on a paid plan. It keeps the directory free of abandoned profiles.",
  },
  {
    q: "How does this compare to Google Ads?",
    a: "A click on a legal keyword in Google Ads costs money whether or not that person ever calls you. Your listing costs the same flat amount every month however many people view it, call you or enquire. Just one new client from your ALD listing would cover months of the cost.",
  },
  {
    q: "Is there a setup fee or a lock-in contract?",
    a: "No to both. There is no setup fee and no minimum term. Cancel from your dashboard and billing stops at the end of the period.",
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
  const [plans, stats, founder, addons] = await Promise.all([getPlans(), getStats(), getFounder(), getAddons()]);

  return (
    <>
      <PageHeader
        crumbs={[{ href: "/", label: "Home" }, { label: "Pricing" }]}
        eyebrow="For law firms"
        title="One new client covers the cost."
        intro={`Your firm is already one of ${stats.listings.toLocaleString("en-AU")} practices in the directory. A plan turns that bare record into a profile that brings you enquiries. Flat price, no setup fee, no minimum term.`}
      />

      <div className="mx-auto max-w-[1240px] px-5 pb-8">
        <PricingTable plans={plans} founder={founder} />

        {addons.length > 0 && (
          <div className="mt-12">
            <p className="eyebrow text-center">Add to any plan</p>
            <div className="mt-5 grid gap-3 md:grid-cols-3">
              {addons.map((a) => (
                <div key={a.code} className={"surface rounded-[var(--radius-card)] p-6 " + (a.code === "exclusive" ? "border-gold-500/35 bg-gradient-to-b from-gold-500/[0.07] to-transparent" : "")}>
                  <p className="text-[14.5px] font-medium">
                    {a.code === "exclusive" && <span className="text-gold-400">★ </span>}{a.name}
                  </p>
                  <p className="display text-[26px] mt-2 tabular">
                    {money(a.monthly_price)}<span className="text-[12.5px] text-paper-600 font-sans"> /mo{a.code === "exclusive" ? "" : " each"}</span>
                  </p>
                  <p className="text-[13px] leading-relaxed text-paper-500 mt-2.5">{a.blurb}</p>
                  {a.code === "exclusive" && (
                    <p className="text-[12px] text-gold-300 mt-3">Featured plan only. Not part of the founding rate.</p>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>


      <Testimonials />

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
          <Link href="/claim" className="btn btn-primary">Find &amp; claim your listing</Link>
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
