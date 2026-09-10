import Link from "next/link";
import type { Metadata } from "next";
import { getMapPoints, getPracticeAreas, getStats, getTopSuburbs } from "@/lib/queries";
import SearchBar from "@/components/SearchBar";
import HeroCanvas from "@/components/HeroCanvas";
import Reveal from "@/components/Reveal";
import CountUp from "@/components/CountUp";
import { SITE, STATES } from "@/lib/site";

export const revalidate = 3600;

export const metadata: Metadata = {
  title: "Find a Lawyer Anywhere in Australia — Aussie Lawyer Directory",
  description: SITE.description,
  alternates: { canonical: "/" },
};

export default async function HomePage() {
  const [areas, stats, points, suburbs] = await Promise.all([
    getPracticeAreas(),
    getStats(),
    getMapPoints(),
    getTopSuburbs(undefined, 18),
  ]);

  const money = areas.filter((a) => a.tier === 1);

  return (
    <>
      {/* ═══════════════════════════════════════════════════════════ hero */}
      <section className="relative min-h-[92vh] flex items-center overflow-hidden">
        <div className="aurora" />
        <HeroCanvas points={points} />
        <div className="absolute inset-0 bg-gradient-to-b from-ink-950/30 via-transparent to-ink-950/85 pointer-events-none" />

        <div className="relative mx-auto max-w-[1240px] px-5 w-full py-28">
          <div className="max-w-[820px]">
            <p className="eyebrow reveal" style={{ animationDelay: "0.05s" }}>
              National legal directory · Est. 2013
            </p>

            <h1
              className="display text-[clamp(2.9rem,7.4vw,5.6rem)] mt-5 reveal"
              style={{ animationDelay: "0.15s" }}
            >
              The right lawyer,
              <br />
              <span className="text-brand-400">before it gets worse.</span>
            </h1>

            <p
              className="mt-6 text-[16.5px] leading-relaxed text-paper-400 max-w-[560px] reveal"
              style={{ animationDelay: "0.28s" }}
            >
              Describe what&apos;s happened in plain English. We&apos;ll point you at the
              solicitors near you who handle exactly that — across every state and
              territory in Australia.
            </p>

            <div className="mt-9 reveal" style={{ animationDelay: "0.4s" }}>
              <SearchBar areas={areas} />
            </div>
          </div>
        </div>

        {/* stat rail */}
        <div className="absolute bottom-0 inset-x-0 edge-t glass">
          <div className="mx-auto max-w-[1240px] px-5 py-5 grid grid-cols-2 md:grid-cols-4 gap-6">
            <Stat value={stats.listings} label="Law firms &amp; solicitors" />
            <Stat value={stats.suburbs} label="Suburbs covered" />
            <Stat value={stats.practiceAreas} label="Practice areas" />
            <Stat value={8} label="States &amp; territories" />
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════ what happened */}
      <section className="relative py-24">
        <div className="absolute inset-0 grid-lines pointer-events-none" />
        <div className="relative mx-auto max-w-[1240px] px-5">
          <Reveal>
            <p className="eyebrow">Step one</p>
            <h2 className="display text-[clamp(2rem,4vw,3.2rem)] mt-3 max-w-[640px]">
              Start with what happened, not with legal jargon.
            </h2>
            <p className="mt-4 text-[15px] text-paper-500 max-w-[520px]">
              Most people don&apos;t know whether they need a solicitor, a barrister or a
              conveyancer. That&apos;s fine — pick the situation that sounds like yours.
            </p>
          </Reveal>

          <div className="mt-12 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {money.map((a, i) => (
              <Reveal key={a.slug} delay={i * 0.045}>
                <Link
                  href={`/${a.slug}`}
                  className="surface lift rounded-[var(--radius-card)] p-6 h-full flex flex-col group"
                >
                  <div className="flex items-start justify-between gap-3">
                    <h3 className="text-[16px] font-medium text-paper-100 group-hover:text-brand-400 transition-colors">
                      {a.name}
                    </h3>
                    <span className="text-[11px] tabular text-paper-600 shrink-0 mt-1">
                      {a.listing_count || "—"}
                    </span>
                  </div>
                  {a.hero_question && (
                    <p className="text-[13px] text-brand-400/80 mt-2">{a.hero_question}</p>
                  )}
                  <p className="text-[13px] leading-relaxed text-paper-500 mt-3 line-clamp-3 flex-1">
                    {a.blurb}
                  </p>
                  <span className="mt-4 text-[12.5px] text-paper-600 group-hover:text-paper-200 transition-colors">
                    Browse {a.name.toLowerCase()} →
                  </span>
                </Link>
              </Reveal>
            ))}
          </div>

          <Reveal delay={0.1}>
            <Link href="/practice-areas" className="inline-block mt-8 text-[13.5px] text-brand-400 hover:text-brand-200">
              See all {stats.practiceAreas} practice areas →
            </Link>
          </Reveal>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════ locations */}
      <section className="py-24 edge-t bg-ink-900/40">
        <div className="mx-auto max-w-[1240px] px-5">
          <Reveal>
            <p className="eyebrow">Step two</p>
            <h2 className="display text-[clamp(2rem,4vw,3.2rem)] mt-3">Then narrow it to your suburb.</h2>
          </Reveal>

          <div className="mt-11 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {STATES.map((s, i) => (
              <Reveal key={s.slug} delay={i * 0.04}>
                <Link
                  href={`/lawyers/${s.slug}`}
                  className="surface lift rounded-[var(--radius-card)] p-5 flex items-center justify-between group h-full"
                >
                  <span>
                    <span className="block text-[14.5px] text-paper-100 group-hover:text-brand-400 transition-colors">
                      {s.name}
                    </span>
                    <span className="block text-[11.5px] text-paper-600 mt-1">{s.capital}</span>
                  </span>
                  <span className="text-[11px] tracking-[0.12em] text-paper-600">{s.code}</span>
                </Link>
              </Reveal>
            ))}
          </div>

          <Reveal delay={0.08}>
            <p className="eyebrow mt-14 mb-4">Busiest suburbs right now</p>
            <div className="flex flex-wrap gap-2">
              {suburbs.map((s) => (
                <Link
                  key={s.slug}
                  href={`/lawyers/${s.slug}`}
                  className="text-[12.5px] px-3.5 py-2 rounded-full edge text-paper-400
                             hover:text-paper-100 hover:border-brand-500/50 transition-colors"
                >
                  {s.name}, {s.state}
                  <span className="text-paper-600 ml-1.5 tabular">{s.listing_count}</span>
                </Link>
              ))}
            </div>
          </Reveal>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════════ trust */}
      <section className="py-24 edge-t">
        <div className="mx-auto max-w-[1240px] px-5 grid gap-14 lg:grid-cols-2 lg:items-center">
          <Reveal>
            <p className="eyebrow">Why us</p>
            <h2 className="display text-[clamp(2rem,4vw,3.2rem)] mt-3">
              Independent. National.
              <br />
              No pay-to-win search.
            </h2>
            <p className="mt-5 text-[15px] leading-relaxed text-paper-400 max-w-[480px]">
              We&apos;ve been listing Australian law firms since 2013. Paid listings get a
              bigger card and a higher slot — and we say so on the card. What we never do
              is hide a firm from you because they haven&apos;t paid us.
            </p>
            <div className="mt-8 flex gap-3">
              <Link href="/search" className="btn btn-primary">Search the directory</Link>
              <Link href="/about" className="btn btn-ghost">How ALD works</Link>
            </div>
          </Reveal>

          <Reveal delay={0.12}>
            <div className="grid sm:grid-cols-2 gap-3">
              {[
                { t: "Every listing is a real practice", d: "Sourced from public records and firm submissions, not scraped social profiles." },
                { t: "Contact them directly", d: "No lead auctions, no middleman taking a cut of your matter." },
                { t: "Plain-English guides", d: "Understand the process before you pick up the phone." },
                { t: "Legal Aid always visible", d: "If you can't afford a lawyer, we show you who can help — free." },
              ].map((c) => (
                <div key={c.t} className="surface rounded-[var(--radius-card)] p-5">
                  <p className="text-[14px] font-medium text-paper-100">{c.t}</p>
                  <p className="text-[12.5px] leading-relaxed text-paper-500 mt-2">{c.d}</p>
                </div>
              ))}
            </div>
          </Reveal>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════ for lawyers */}
      <section className="relative py-24 edge-t overflow-hidden">
        <div className="aurora opacity-60" />
        <div className="relative mx-auto max-w-[1240px] px-5">
          <div className="surface rounded-2xl p-9 md:p-14 grid gap-10 lg:grid-cols-[1.25fr_1fr] lg:items-center">
            <div>
              <p className="eyebrow text-gold-400">For law firms</p>
              <h2 className="display text-[clamp(1.9rem,3.6vw,3rem)] mt-3">
                Your firm is probably already listed.
              </h2>
              <p className="mt-5 text-[15px] leading-relaxed text-paper-400 max-w-[520px]">
                We hold {stats.listings.toLocaleString("en-AU")} Australian practices on file.
                Unclaimed listings show a name, a suburb and a phone number — nothing else.
                No website link, no practice areas, no profile. Claim yours and it becomes a
                page that actually wins you work.
              </p>
              <div className="mt-8 flex flex-wrap gap-3">
                <Link href="/claim" className="btn btn-primary">Find &amp; claim your listing</Link>
                <Link href="/pricing" className="btn btn-ghost">See pricing</Link>
              </div>
              <p className="mt-5 text-[12px] text-paper-600">
                One matter typically covers a decade of directory fees.
              </p>
            </div>

            <div className="space-y-3">
              {[
                ["Unclaimed", "Name, suburb, phone. 25% complete.", false],
                ["Verified", "Full profile, website link, enquiry form.", true],
                ["Featured", "Top of your suburb, priority in matching.", true],
              ].map(([label, desc, good]) => (
                <div
                  key={label as string}
                  className={`rounded-[var(--radius-card)] p-4 border flex items-start gap-3 ${
                    good ? "border-brand-500/30 bg-brand-500/[0.06]" : "border-white/[0.07] bg-white/[0.02]"
                  }`}
                >
                  <span
                    className={`mt-0.5 size-4 rounded-full grid place-items-center text-[9px] shrink-0 ${
                      good ? "bg-brand-500 text-white" : "bg-white/10 text-paper-600"
                    }`}
                  >
                    {good ? "✓" : "—"}
                  </span>
                  <span>
                    <span className="block text-[13.5px] text-paper-100">{label as string}</span>
                    <span className="block text-[12px] text-paper-500 mt-0.5">{desc as string}</span>
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>
    </>
  );
}

function Stat({ value, label }: { value: number; label: string }) {
  return (
    <div>
      <p className="display text-[clamp(1.6rem,3vw,2.3rem)] text-paper-100">
        <CountUp to={value} />
        {value > 1000 ? "+" : ""}
      </p>
      <p className="text-[11.5px] text-paper-600 mt-1" dangerouslySetInnerHTML={{ __html: label }} />
    </div>
  );
}
