import type { Metadata } from "next";
import Link from "next/link";
import { getPracticeAreas } from "@/lib/queries";
import PageHeader from "@/components/PageHeader";
import Reveal from "@/components/Reveal";

export const revalidate = 86400;

export const metadata: Metadata = {
  title: "All Practice Areas",
  description:
    "Every area of Australian law covered by the directory — family, criminal, property, immigration, employment, wills and estates and more.",
  alternates: { canonical: "/practice-areas" },
};

export default async function PracticeAreasPage() {
  const areas = await getPracticeAreas();
  const primary = areas.filter((a) => a.tier === 1);
  const rest = areas.filter((a) => a.tier !== 1);

  return (
    <>
      <PageHeader
        crumbs={[{ href: "/", label: "Home" }, { label: "Practice areas" }]}
        eyebrow="Browse"
        title="Every area of law we cover"
        intro="Not sure which one you need? Start with the situation that sounds closest — the page will tell you what that kind of lawyer actually does."
      />

      <div className="mx-auto max-w-[1240px] px-5 pb-16">
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {primary.map((a, i) => (
            <Reveal key={a.slug} delay={Math.min(i, 9) * 0.035}>
              <Link href={`/${a.slug}`} className="surface lift rounded-[var(--radius-card)] p-6 h-full flex flex-col group">
                <div className="flex items-start justify-between gap-3">
                  <h2 className="text-[15.5px] font-medium group-hover:text-brand-400 transition-colors">
                    {a.name}
                  </h2>
                  <span className="text-[11px] tabular text-paper-600 mt-1">{a.listing_count || "—"}</span>
                </div>
                {a.hero_question && <p className="text-[12.5px] text-brand-400/80 mt-2">{a.hero_question}</p>}
                <p className="text-[13px] leading-relaxed text-paper-500 mt-3 line-clamp-3">{a.blurb}</p>
              </Link>
            </Reveal>
          ))}
        </div>

        <section className="mt-14">
          <p className="eyebrow mb-4">More specialisations</p>
          <div className="grid gap-x-6 sm:grid-cols-2 lg:grid-cols-3">
            {rest.map((a) => (
              <Link
                key={a.slug}
                href={`/${a.slug}`}
                className="flex items-baseline justify-between gap-3 py-2.5 border-b border-white/[0.05]
                           text-[13.5px] text-paper-400 hover:text-paper-100 hover:border-brand-500/40 transition-colors"
              >
                <span>{a.name}</span>
                <span className="text-[11px] tabular text-paper-600">{a.listing_count || ""}</span>
              </Link>
            ))}
          </div>
        </section>
      </div>
    </>
  );
}
