import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import {
  getPracticeArea, getPracticeAreas, paStateCounts, paSuburbCounts, searchListings,
} from "@/lib/queries";
import PageHeader from "@/components/PageHeader";
import ListingCard from "@/components/ListingCard";
import LinkCloud from "@/components/LinkCloud";
import Reveal from "@/components/Reveal";
import { SITE, STATE_BY_CODE, STATES } from "@/lib/site";

export const revalidate = 86400;
export const dynamicParams = true;

export async function generateStaticParams() {
  try {
    const areas = await getPracticeAreas();
    return areas.filter((a) => a.tier === 1).map((a) => ({ practice: a.slug }));
  } catch {
    return [];
  }
}

async function load(practice: string) {
  const area = await getPracticeArea(practice);
  if (!area) return null;
  const [{ rows, total }, suburbs, states] = await Promise.all([
    searchListings({ practice, perPage: 24 }),
    paSuburbCounts(practice, 40),
    paStateCounts(practice),
  ]);
  return { area, rows, total, suburbs, states };
}

export async function generateMetadata({
  params,
}: { params: Promise<{ practice: string }> }): Promise<Metadata> {
  const { practice } = await params;
  const area = await getPracticeArea(practice);
  if (!area) return {};
  const title = `${area.name} in Australia — Compare Firms by Suburb`;
  return {
    title,
    description:
      area.blurb ??
      `Find ${area.name.toLowerCase()} across Australia. Compare firms by suburb and contact them directly.`,
    alternates: { canonical: `/${area.slug}` },
    openGraph: { title, description: area.blurb ?? SITE.description, url: `/${area.slug}` },
  };
}

export default async function PracticePage({
  params,
}: { params: Promise<{ practice: string }> }) {
  const { practice } = await params;
  const data = await load(practice);
  if (!data) notFound();
  const { area, rows, total, suburbs, states } = data;

  const singular = area.singular ?? area.name;

  return (
    <>
      <PageHeader
        crumbs={[{ href: "/", label: "Home" }, { href: "/practice-areas", label: "Practice areas" }, { label: area.name }]}
        eyebrow="Practice area"
        title={`${area.name} in Australia`}
        intro={area.blurb}
        meta={
          <div className="flex flex-wrap gap-2">
            <span className="text-[12px] px-3 py-1.5 rounded-full edge text-paper-400">
              {total.toLocaleString("en-AU")} listed nationally
            </span>
            {states.slice(0, 8).map((s) => (
              <Link
                key={s.state}
                href={`/${area.slug}/${STATE_BY_CODE[s.state]?.slug ?? s.state.toLowerCase()}`}
                className="text-[12px] px-3 py-1.5 rounded-full edge text-paper-400 hover:text-paper-100 hover:border-brand-500/50 transition-colors"
              >
                {s.state} <span className="text-paper-600 tabular">{s.n}</span>
              </Link>
            ))}
          </div>
        }
      />

      <div className="mx-auto max-w-[1240px] px-5 pb-10">
        <div className="grid gap-3 lg:grid-cols-2">
          {rows.map((l, i) => (
            <Reveal key={l.id} delay={Math.min(i, 8) * 0.03}>
              <ListingCard listing={l} rank={i + 1} />
            </Reveal>
          ))}
        </div>

        {rows.length === 0 && (
          <p className="surface rounded-[var(--radius-card)] p-8 text-[14px] text-paper-400">
            No firms have listed under {area.name.toLowerCase()} yet.{" "}
            <Link href="/list-your-firm" className="text-brand-400 hover:text-brand-200">
              Be the first in this category →
            </Link>
          </p>
        )}

        <LinkCloud
          title={`${singular}s by suburb`}
          columns
          links={suburbs.map((s) => ({
            href: `/${area.slug}/${s.slug}`,
            label: `${singular}s in ${s.name}, ${s.state}`,
            count: s.n,
          }))}
        />

        <LinkCloud
          title="By state and territory"
          links={STATES.map((s) => ({
            href: `/${area.slug}/${s.slug}`,
            label: `${area.name} in ${s.name}`,
            count: states.find((x) => x.state === s.code)?.n,
          }))}
        />
      </div>

      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "CollectionPage",
            name: `${area.name} in Australia`,
            description: area.blurb,
            url: `${SITE.url}/${area.slug}`,
            breadcrumb: {
              "@type": "BreadcrumbList",
              itemListElement: [
                { "@type": "ListItem", position: 1, name: "Home", item: SITE.url },
                { "@type": "ListItem", position: 2, name: area.name, item: `${SITE.url}/${area.slug}` },
              ],
            },
          }),
        }}
      />
    </>
  );
}
