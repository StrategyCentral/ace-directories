import type { Metadata } from "next";
import Link from "next/link";
import PageHeader from "@/components/PageHeader";
import { getPracticeAreas } from "@/lib/queries";

export const revalidate = 86400;

export const metadata: Metadata = {
  title: "Legal Guides",
  description:
    "Plain-English guides to common Australian legal situations — what the process looks like, what it costs, and when you actually need a lawyer.",
  alternates: { canonical: "/guides" },
};

export default async function GuidesPage() {
  const areas = (await getPracticeAreas()).filter((a) => a.tier === 1);

  return (
    <>
      <PageHeader
        crumbs={[{ href: "/", label: "Home" }, { label: "Guides" }]}
        eyebrow="Plain English"
        title="Understand it before you pay for it."
        intro="Guides are being written now, one practice area at a time. In the meantime, each practice area page explains what that kind of lawyer does and lists the firms handling it near you."
      />
      <div className="mx-auto max-w-[1240px] px-5 pb-16">
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {areas.map((a) => (
            <Link key={a.slug} href={`/${a.slug}`} className="surface lift rounded-[var(--radius-card)] p-6 group">
              <p className="text-[15px] font-medium group-hover:text-brand-400 transition-colors">{a.name}</p>
              {a.hero_question && <p className="text-[12.5px] text-brand-400/80 mt-2">{a.hero_question}</p>}
              <p className="text-[13px] leading-relaxed text-paper-500 mt-3 line-clamp-3">{a.blurb}</p>
            </Link>
          ))}
        </div>
      </div>
    </>
  );
}
