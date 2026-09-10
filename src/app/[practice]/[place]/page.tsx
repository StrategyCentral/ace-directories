import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import {
  getPracticeArea, getSuburb, listingsForCategoryPlace, nearbySuburbs,
  paSuburbCounts, suburbPaCounts,
} from "@/lib/queries";
import PageHeader from "@/components/PageHeader";
import ListingCard from "@/components/ListingCard";
import LinkCloud from "@/components/LinkCloud";
import Reveal from "@/components/Reveal";
import EnquiryPanel from "@/components/EnquiryPanel";
import { SITE, STATE_BY_SLUG, STATES } from "@/lib/site";
import { PRACTICE_CONTENT, fallbackContent } from "@/content/practice-content";
import { stateContext } from "@/content/states";
import { FaqSchema, PracticeArticle } from "@/components/ContentSections";

export const revalidate = 86400;

/**
 * `place` is either a state slug ("vic") or a suburb slug ("richmond-vic").
 * One route serves both levels of the geography silo.
 */
async function resolvePlace(place: string) {
  const state = STATE_BY_SLUG[place];
  if (state) return { kind: "state" as const, state, suburb: null };
  const suburb = await getSuburb(place);
  if (suburb) return { kind: "suburb" as const, state: null, suburb };
  return null;
}

export async function generateMetadata({
  params,
}: { params: Promise<{ practice: string; place: string }> }): Promise<Metadata> {
  const { practice, place } = await params;
  const [area, resolved] = await Promise.all([getPracticeArea(practice), resolvePlace(place)]);
  if (!area || !resolved) return {};

  const where = resolved.kind === "state"
    ? resolved.state.name
    : `${resolved.suburb.name}, ${resolved.suburb.state}`;
  const singular = area.singular ?? area.name;
  const title = `${singular}s in ${where} — Compare & Contact`;

  return {
    title,
    description: `Find a ${singular.toLowerCase()} in ${where}. Compare local firms, see contact details and get in touch directly. Free to search.`,
    alternates: { canonical: `/${practice}/${place}` },
    openGraph: { title, url: `/${practice}/${place}` },
  };
}

export default async function PracticePlacePage({
  params,
}: { params: Promise<{ practice: string; place: string }> }) {
  const { practice, place } = await params;
  const [area, resolved] = await Promise.all([getPracticeArea(practice), resolvePlace(place)]);
  if (!area || !resolved) notFound();

  const singular = area.singular ?? area.name;
  const isState = resolved.kind === "state";
  const where = isState ? resolved.state!.name : `${resolved.suburb!.name}, ${resolved.suburb!.state}`;
  const shortWhere = isState ? resolved.state!.name : resolved.suburb!.name;

  const { exact, general, exactTotal } = await listingsForCategoryPlace(practice, {
    suburbId: isState ? undefined : resolved.suburb!.id,
    state: isState ? resolved.state!.code : undefined,
    limit: 24,
  });

  const stateCode = isState ? resolved.state!.code : resolved.suburb!.state;
  const ctx = stateContext(stateCode);
  const content =
    PRACTICE_CONTENT[area.slug] ?? fallbackContent(area.name, singular, area.blurb);

  const [otherAreas, nearby, otherSuburbs] = await Promise.all([
    isState ? Promise.resolve([]) : suburbPaCounts(resolved.suburb!.id),
    isState ? Promise.resolve([]) : nearbySuburbs(resolved.suburb!.id, 12),
    paSuburbCounts(practice, 24),
  ]);

  return (
    <>
      <PageHeader
        crumbs={[
          { href: "/", label: "Home" },
          { href: `/${area.slug}`, label: area.name },
          { label: where },
        ]}
        eyebrow={`${area.name} · ${where}`}
        title={`${singular}s in ${shortWhere}`}
        intro={
          exactTotal > 0
            ? `${exactTotal} ${exactTotal === 1 ? "practice" : "practices"} in ${where} list ${area.name.toLowerCase()} as a specialty. Compare them below and contact whoever fits — we don't sell your enquiry on.`
            : `No firm in ${where} has yet listed ${area.name.toLowerCase()} as a specialty. The general practices below are local and many handle this kind of matter — call and ask.`
        }
      />

      <div className="mx-auto max-w-[1240px] px-5 pb-10 grid gap-10 lg:grid-cols-[1fr_320px] lg:items-start">
        <div>
          {exact.length > 0 && (
            <div className="grid gap-3">
              {exact.map((l, i) => (
                <Reveal key={l.id} delay={Math.min(i, 8) * 0.03}>
                  <ListingCard listing={l} rank={i + 1} />
                </Reveal>
              ))}
            </div>
          )}

          {general.length > 0 && (
            <div className="mt-10">
              <p className="eyebrow mb-1">Also in {shortWhere}</p>
              <p className="text-[13px] text-paper-500 mb-4 max-w-[560px]">
                General practices in the area. They haven&apos;t nominated{" "}
                {area.name.toLowerCase()} as a specialty, so check before you engage them.
              </p>
              <div className="grid gap-3">
                {general.map((l) => (
                  <ListingCard key={l.id} listing={l} context="General practice — confirm they handle this matter" />
                ))}
              </div>
            </div>
          )}

          {exact.length === 0 && general.length === 0 && (
            <p className="surface rounded-[var(--radius-card)] p-8 text-[14px] text-paper-400">
              Nothing listed in {where} yet.{" "}
              <Link href={`/${area.slug}`} className="text-brand-400 hover:text-brand-200">
                See {area.name.toLowerCase()} nationally →
              </Link>
            </p>
          )}
        </div>

        <aside className="lg:sticky lg:top-24 space-y-4">
          <EnquiryPanel practiceArea={area.slug} practiceName={area.name} place={where} />
          <div className="surface rounded-[var(--radius-card)] p-5">
            <p className="eyebrow mb-3">Is your firm in {shortWhere}?</p>
            <p className="text-[13px] leading-relaxed text-paper-400">
              Unclaimed listings on this page show a phone number and nothing else. Claiming
              yours adds your website, practice areas and an enquiry button.
            </p>
            <Link href="/claim" className="btn btn-primary w-full mt-4 !text-[13px]">
              Claim your listing
            </Link>
          </div>
        </aside>
      </div>

      <div className="mx-auto max-w-[1240px] px-5 pb-10">
        <section className="mt-6 pt-14 edge-t">
          <PracticeArticle
            content={content}
            name={area.name}
            singular={singular}
            state={ctx}
          />
        </section>

        {!isState && otherAreas.length > 0 && (
          <LinkCloud
            title={`Other legal help in ${shortWhere}`}
            links={otherAreas
              .filter((a) => a.slug !== area.slug)
              .slice(0, 18)
              .map((a) => ({
                href: `/${a.slug}/${resolved.suburb!.slug}`,
                label: `${a.name} in ${shortWhere}`,
                count: Number(a.n),
              }))}
            columns
          />
        )}

        {!isState && nearby.length > 0 && (
          <LinkCloud
            title={`${singular}s near ${shortWhere}`}
            links={nearby.map((s) => ({
              href: `/${area.slug}/${s.slug}`,
              label: `${s.name}, ${s.state}`,
              count: s.n,
            }))}
          />
        )}

        {isState && (
          <LinkCloud
            title={`${singular}s by suburb in ${where}`}
            columns
            links={otherSuburbs
              .filter((s) => s.state === resolved.state!.code)
              .map((s) => ({ href: `/${area.slug}/${s.slug}`, label: s.name, count: s.n }))}
          />
        )}

        <LinkCloud
          title={`${area.name} in other states`}
          links={STATES.filter((s) => isState ? s.code !== resolved.state!.code : true).map((s) => ({
            href: `/${area.slug}/${s.slug}`,
            label: s.name,
          }))}
        />
      </div>

      <FaqSchema faqs={content.faqs} />

      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "ItemList",
            name: `${singular}s in ${where}`,
            numberOfItems: exact.length,
            itemListElement: exact.slice(0, 10).map((l, i) => ({
              "@type": "ListItem",
              position: i + 1,
              item: {
                "@type": "LegalService",
                name: l.full_name,
                url: `${SITE.url}/firm/${l.slug}`,
                telephone: l.phone ?? undefined,
                address: {
                  "@type": "PostalAddress",
                  addressLocality: l.suburb ?? undefined,
                  addressRegion: l.state ?? undefined,
                  postalCode: l.postcode ?? undefined,
                  addressCountry: "AU",
                },
              },
            })),
          }),
        }}
      />
    </>
  );
}
