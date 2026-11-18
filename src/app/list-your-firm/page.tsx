import type { Metadata } from "next";
import Link from "next/link";
import PageHeader from "@/components/PageHeader";
import PricingTable from "@/components/PricingTable";
import Reveal from "@/components/Reveal";
import ValueCalculator from "@/components/ValueCalculator";
import { getPlans, getStats } from "@/lib/queries";
import { money } from "@/lib/format";

export const revalidate = 3600;

export const metadata: Metadata = {
  title: "For Law Firms: Claim Your Listing",
  description:
    "Your firm is already in the Aussie Lawyer Directory. Claim the page, add your website, profile and enquiry form, and rank above unclaimed firms in your suburb. No setup fee, no lock in.",
  alternates: { canonical: "/list-your-firm" },
};

const BEFORE = ["Firm name", "Suburb", "Phone number", "Nothing else. No website link, no way to enquire"];
const AFTER = [
  "Your website link and direct phone number",
  "Your own headline, profile, logo and photos",
  "An enquiry form that emails you straight away",
  "Client reviews, with your right of reply",
  "A Verified badge and a place above unclaimed firms",
  "A dashboard that shows views, phone taps and enquiries",
];

const STEPS: [string, string][] = [
  ["Find your firm", "Search the directory. Most established Australian practices are already on file."],
  ["Confirm it is yours", "Use your work email. We send one link to prove the address belongs to the firm."],
  ["Choose a plan", "Pay by card through Stripe. Your profile goes live the moment payment clears."],
  ["Build your profile", "A guided setup walks you through the parts of a profile that win enquiries."],
];

const FAQ: [string, string][] = [
  ["Why is my firm already listed?", "Listings are compiled from public business records: a name, a suburb and a phone number. Claiming the page is how you take control of what it says."],
  ["What if I do nothing?", "Nothing changes. Your basic listing stays in the directory. It just stays basic, and claimed firms in your suburb appear above it."],
  ["Is there a contract?", "No. There is no setup fee and no minimum term. Cancel from your dashboard and billing stops at the end of the period you have paid for."],
  ["Does paying buy good reviews or remove bad ones?", "No. Reviews are confirmed by email and read by a person before they are published. No plan can remove a genuine review. Every claimed firm gets a right of reply."],
  ["Do you sell my enquiries to other firms?", "No. An enquiry sent from your profile goes to you and only you."],
  ["Can I take my page down for a while?", "Yes. Your dashboard has a switch that hides the listing and brings it back whenever you like. You can also ask us to remove it completely, free."],
];

export default async function ListYourFirmPage() {
  const [plans, stats] = await Promise.all([getPlans(), getStats()]);
  const from = plans[0];

  return (
    <>
      <PageHeader
        crumbs={[{ href: "/", label: "Home" }, { label: "For law firms" }]}
        eyebrow="For law firms"
        title="Your firm is already here. Make the page work for you."
        intro={`People search this directory by suburb and practice area when they need a lawyer now. ${stats.listings.toLocaleString("en-AU")} practices across ${stats.suburbs.toLocaleString("en-AU")} suburbs are listed. The firms that claim their page are the ones a searcher can actually contact.`}
      >
        <div className="mt-8 flex flex-wrap gap-3">
          <Link href="/claim" className="btn btn-primary btn-shine">Find and claim my listing</Link>
          <Link href="#plans" className="btn btn-ghost">See plans{from ? ` from ${money(from.monthly_price)} a month` : ""}</Link>
        </div>
      </PageHeader>

      {/* ------------------------------------------------ before and after */}
      <section className="mx-auto max-w-[1240px] px-5 py-10">
        <Reveal>
          <p className="eyebrow">The difference</p>
          <h2 className="display text-[clamp(1.7rem,3.2vw,2.4rem)] mt-3 max-w-[760px]">
            An unclaimed page tells people you exist. A claimed page lets them hire you.
          </h2>
        </Reveal>
        <div className="mt-8 grid gap-3 md:grid-cols-2">
          <Reveal>
            <div className="surface rounded-2xl p-7 h-full">
              <p className="text-[12px] uppercase tracking-[0.1em] text-paper-600">Your page today</p>
              <ul className="mt-5 space-y-3 text-[14px] text-paper-500">
                {BEFORE.map((t) => (
                  <li key={t} className="flex gap-3"><span className="text-paper-600">○</span>{t}</li>
                ))}
              </ul>
            </div>
          </Reveal>
          <Reveal delay={0.08}>
            <div className="surface rounded-2xl p-7 h-full border-brand-500/40 bg-gradient-to-b from-brand-500/[0.08] to-transparent plan-glow">
              <p className="text-[12px] uppercase tracking-[0.1em] text-brand-200">Your page once you claim it</p>
              <ul className="mt-5 space-y-3 text-[14px] text-paper-100">
                {AFTER.map((t) => (
                  <li key={t} className="flex gap-3"><span className="text-brand-400">✓</span>{t}</li>
                ))}
              </ul>
            </div>
          </Reveal>
        </div>
      </section>

      {/* ------------------------------------------------------- the maths */}
      <section className="mx-auto max-w-[1240px] px-5 py-10">
        <Reveal>
          <ValueCalculator
            plans={plans.map((p) => ({
              code: p.code, name: p.name, yearly_price: p.yearly_price, monthly_price: p.monthly_price,
            }))}
          />
        </Reveal>
      </section>

      {/* -------------------------------------------------------- why here */}
      <section className="mx-auto max-w-[1240px] px-5 py-10 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {[
          ["A flat price", "You pay the same every month however many people view your page, call you or enquire. No cost per click, no cost per lead."],
          ["Your enquiries stay yours", "An enquiry on your profile goes to you. We never pass it to another firm or sell it."],
          ["Found where people look", "Your listing appears on the suburb and practice area pages people search, not only on a profile page nobody finds."],
          ["No lock in", "No setup fee and no minimum term. Cancel from the dashboard in two clicks."],
        ].map(([t, d], i) => (
          <Reveal key={t} delay={i * 0.05}>
            <div className="surface lift rounded-[var(--radius-card)] p-6 h-full">
              <p className="text-[14.5px] font-medium">{t}</p>
              <p className="text-[13px] leading-relaxed text-paper-500 mt-2">{d}</p>
            </div>
          </Reveal>
        ))}
      </section>

      {/* ----------------------------------------------------------- plans */}
      <section id="plans" className="mx-auto max-w-[1240px] px-5 py-12 scroll-mt-24">
        <Reveal className="text-center">
          <p className="eyebrow">Plans</p>
          <h2 className="display text-[clamp(1.7rem,3.2vw,2.4rem)] mt-3">Two plans. Pick how visible you want to be.</h2>
        </Reveal>
        <div className="mt-8">
          <PricingTable plans={plans} />
        </div>
      </section>

      {/* ---------------------------------------------------- how it works */}
      <section className="mx-auto max-w-[1240px] px-5 py-12 edge-t">
        <Reveal>
          <p className="eyebrow">How it works</p>
          <h2 className="display text-[clamp(1.7rem,3.2vw,2.4rem)] mt-3">Live in about ten minutes.</h2>
        </Reveal>
        <ol className="mt-8 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {STEPS.map(([t, d], i) => (
            <Reveal key={t} delay={i * 0.06}>
              <li className="surface rounded-[var(--radius-card)] p-6 h-full list-none">
                <span className="size-7 rounded-full bg-brand-500/15 text-brand-200 grid place-items-center text-[12px]">{i + 1}</span>
                <p className="text-[14.5px] font-medium mt-4">{t}</p>
                <p className="text-[13px] leading-relaxed text-paper-500 mt-2">{d}</p>
              </li>
            </Reveal>
          ))}
        </ol>
      </section>

      {/* ------------------------------------------------------------- FAQ */}
      <section className="mx-auto max-w-[1240px] px-5 py-12 edge-t">
        <Reveal>
          <p className="eyebrow">Questions</p>
          <h2 className="display text-[clamp(1.7rem,3.2vw,2.4rem)] mt-3">Straight answers.</h2>
        </Reveal>
        <div className="mt-8 grid gap-3 lg:grid-cols-2">
          {FAQ.map(([q, a], i) => (
            <Reveal key={q} delay={i * 0.04}>
              <div className="surface rounded-[var(--radius-card)] p-6 h-full">
                <p className="text-[14.5px] font-medium">{q}</p>
                <p className="text-[13px] leading-relaxed text-paper-500 mt-2.5">{a}</p>
              </div>
            </Reveal>
          ))}
        </div>
      </section>

      {/* ------------------------------------------------------------- CTA */}
      <section className="mx-auto max-w-[1240px] px-5 pb-20">
        <Reveal>
          <div className="surface rounded-2xl p-8 md:p-12 text-center bg-gradient-to-b from-brand-500/[0.09] to-transparent">
            <h2 className="display text-[clamp(1.8rem,3.6vw,2.7rem)]">Just one new client would cover it.</h2>
            <p className="text-[14px] leading-relaxed text-paper-400 mt-4 max-w-[560px] mx-auto">
              Find your firm, confirm your work email and choose a plan. If your practice is not
              in the directory yet, tell us and we will add it.
            </p>
            <div className="flex flex-wrap justify-center gap-3 mt-8">
              <Link href="/claim" className="btn btn-primary btn-shine">Find and claim my listing</Link>
              <Link href="/contact" className="btn btn-ghost">My firm is not listed</Link>
            </div>
          </div>
        </Reveal>
      </section>
    </>
  );
}
