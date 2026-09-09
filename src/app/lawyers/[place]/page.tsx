import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import {
  getSuburb, getTopSuburbs, nearbySuburbs, searchListings, statePaCounts, suburbPaCounts,
} from "@/lib/queries";
import PageHeader from "@/components/PageHeader";
import ListingCard from "@/components/ListingCard";
import LinkCloud from "@/components/LinkCloud";
import EnquiryPanel from "@/components/EnquiryPanel";
import { SITE, STATE_BY_SLUG, STATES } from "@/lib/site";
import { stateContext } from "@/content/states";
import { Prose, SectionHead } from "@/components/ContentSections";
import Reveal from "@/components/Reveal";

export const revalidate = 86400;

export async function generateStaticParams() {
  return STATES.map((s) => ({ place: s.slug }));
}

export async function generateMetadata({
  params,
}: { params: Promise<{ place: string }> }): Promise<Metadata> {
  const { place } = await params;
  const state = STATE_BY_SLUG[place];
  const suburb = state ? null : await getSuburb(place);
  if (!state && !suburb) return {};
  const where = state ? state.name : `${suburb!.name}, ${suburb!.state}`;
  const title = `Lawyers in ${where} — Every Practice Area`;
  return {
    title,
    description: `Every law firm and solicitor listed in ${where}, sorted by practice area. Search, compare and contact them directly.`,
    alternates: { canonical: `/lawyers/${place}` },
    openGraph: { title, url: `/lawyers/${place}` },
  };
}

export default async function PlacePage({ params }: { params: Promise<{ place: string }> }) {
  const { place } = await params;
  const state = STATE_BY_SLUG[place];
  const suburb = state ? null : await getSuburb(place);
  if (!state && !suburb) notFound();

  const where = state ? state.name : `${suburb!.name}, ${suburb!.state}`;
  const shortWhere = state ? state.name : suburb!.name;

  const ctx = stateContext(state ? state.code : suburb!.state);

  const [{ rows, total }, areas, nearby, stateSuburbs] = await Promise.all([
    searchListings({
      state: state?.code,
      suburbId: suburb?.id,
      perPage: 24,
    }),
    state ? statePaCounts(state.code) : suburbPaCounts(suburb!.id),
    suburb ? nearbySuburbs(suburb.id, 14) : Promise.resolve([]),
    state ? getTopSuburbs(state.code, 40) : Promise.resolve([]),
  ]);

  return (
    <>
      <PageHeader
        crumbs={[
          { href: "/", label: "Home" },
          ...(suburb
            ? [{
                href: `/lawyers/${STATES.find((s) => s.code === suburb.state)?.slug ?? ""}`,
                label: suburb.state,
              }]
            : []),
          { label: shortWhere },
        ]}
        eyebrow={state ? "State & territory" : "Suburb"}
        title={`Lawyers in ${shortWhere}`}
        intro={`${total.toLocaleString("en-AU")} law ${
          total === 1 ? "practice" : "practices"
        } listed in ${where}. Pick the area of law that matches your situation, or browse everyone below.`}
        meta={
          areas.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {areas.slice(0, 12).map((a) => (
                <Link
                  key={a.slug}
                  href={`/${a.slug}/${place}`}
                  className="text-[12px] px-3 py-1.5 rounded-full edge text-paper-400
                             hover:text-paper-100 hover:border-brand-500/50 transition-colors"
                >
                  {a.name} <span className="text-paper-600 tabular">{Number(a.n)}</span>
                </Link>
              ))}
            </div>
          )
        }
      />

      <div className="mx-auto max-w-[1240px] px-5 pb-10 grid gap-10 lg:grid-cols-[1fr_320px] lg:items-start">
        <div className="grid gap-3">
          {rows.map((l, i) => (
            <Reveal key={l.id} delay={Math.min(i, 8) * 0.03}>
              <ListingCard listing={l} rank={i + 1} />
            </Reveal>
          ))}
          {rows.length === 0 && (
            <p className="surface rounded-[var(--radius-card)] p-8 text-[14px] text-paper-400">
              Nothing listed in {where} yet.
            </p>
          )}
          {total > rows.length && (
            <Link
              href={`/search?place=${place}`}
              className="btn btn-ghost w-full mt-3"
            >
              See all {total.toLocaleString("en-AU")} listings in {shortWhere}
            </Link>
          )}
        </div>

        <aside className="lg:sticky lg:top-24 space-y-4">
          <EnquiryPanel place={where} />
        </aside>
      </div>

      <div className="mx-auto max-w-[1240px] px-5 pb-10">
        {ctx && (
          <section className="mt-6 pt-14 edge-t space-y-12">
            <Reveal>
              <div>
                <SectionHead
                  eyebrow={ctx.name}
                  title={`Getting legal help in ${shortWhere}`}
                />
                <Prose paragraphs={[
                  `${shortWhere} is served by ${ctx.name}'s court system, and which court hears a matter depends on how serious it is. Most people never see the inside of one — the majority of legal work is advice, documents and negotiation — but it is worth knowing where a matter would go if it escalated.`,
                  ...ctx.quirks,
                ]} />
              </div>
            </Reveal>

            <Reveal>
              <div>
                <SectionHead title={`Courts and tribunals serving ${shortWhere}`} />
                <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 max-w-[980px]">
                  {ctx.courts.map((c) => (
                    <div key={c.name} className="surface rounded-[var(--radius-card)] p-5">
                      <p className="text-[14px] font-medium text-paper-100">{c.name}</p>
                      <p className="text-[12.5px] leading-relaxed text-paper-500 mt-2">
                        Handles {c.handles}.
                      </p>
                    </div>
                  ))}
                  <div className="surface rounded-[var(--radius-card)] p-5">
                    <p className="text-[14px] font-medium text-paper-100">
                      {ctx.tribunal.name}{" "}
                      <span className="text-paper-600">({ctx.tribunal.abbr})</span>
                    </p>
                    <p className="text-[12.5px] leading-relaxed text-paper-500 mt-2">
                      Handles {ctx.tribunal.handles}.
                    </p>
                  </div>
                </div>
              </div>
            </Reveal>

            <Reveal>
              <div className="surface rounded-2xl p-6 max-w-[820px]">
                <p className="eyebrow mb-2.5">Check before you engage anyone</p>
                <p className="text-[14px] leading-relaxed text-paper-300">
                  Every solicitor practising in {ctx.name} must hold a current practising
                  certificate, and the register is public. It takes a minute and is the
                  single best check you can make.
                </p>
                <a href={ctx.regulator.register} target="_blank" rel="noopener noreferrer"
                   className="inline-block mt-4 text-[13.5px] text-brand-400 hover:text-brand-200">
                  Search the {ctx.regulator.name} register ↗
                </a>
              </div>
            </Reveal>

            <p className="text-[12px] leading-relaxed text-paper-600 max-w-[68ch]">
              General information only, not legal advice. If you cannot afford a lawyer,{" "}
              <Link href="/legal-aid" className="underline hover:text-paper-400">
                Legal Aid operates in every state and territory
              </Link>.
            </p>
          </section>
        )}

        <LinkCloud
          title={`Legal help in ${shortWhere} by practice area`}
          columns
          links={areas.map((a) => ({
            href: `/${a.slug}/${place}`,
            label: `${a.name} in ${shortWhere}`,
            count: Number(a.n),
          }))}
        />

        {state && stateSuburbs.length > 0 && (
          <LinkCloud
            title={`Suburbs and towns across ${state.name}`}
            links={stateSuburbs.map((s) => ({
              href: `/lawyers/${s.slug}`,
              label: s.name,
              count: s.listing_count,
            }))}
          />
        )}

        {nearby.length > 0 && (
          <LinkCloud
            title={`Near ${shortWhere}`}
            links={nearby.map((s) => ({
              href: `/lawyers/${s.slug}`,
              label: `${s.name}, ${s.state}`,
              count: s.n,
            }))}
          />
        )}

        <LinkCloud
          title="Other states and territories"
          links={STATES.filter((s) => s.slug !== place).map((s) => ({
            href: `/lawyers/${s.slug}`,
            label: s.name,
          }))}
        />
      </div>

      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "CollectionPage",
            name: `Lawyers in ${where}`,
            url: `${SITE.url}/lawyers/${place}`,
          }),
        }}
      />
    </>
  );
}
