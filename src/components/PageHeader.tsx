import Link from "next/link";

export interface Crumb {
  href?: string;
  label: string;
}

export function Breadcrumbs({ items }: { items: Crumb[] }) {
  return (
    <nav aria-label="Breadcrumb" className="flex flex-wrap items-center gap-2 text-[12px] text-paper-600">
      {items.map((c, i) => (
        <span key={i} className="flex items-center gap-2">
          {i > 0 && <span aria-hidden="true" className="text-paper-600/60">/</span>}
          {c.href ? (
            <Link href={c.href} className="hover:text-paper-300 transition-colors">{c.label}</Link>
          ) : (
            <span className="text-paper-400">{c.label}</span>
          )}
        </span>
      ))}
    </nav>
  );
}

export default function PageHeader({
  eyebrow,
  title,
  intro,
  crumbs,
  meta,
  children,
}: {
  eyebrow?: string;
  title: string;
  intro?: string | null;
  crumbs?: Crumb[];
  meta?: React.ReactNode;
  children?: React.ReactNode;
}) {
  return (
    <section className="relative pt-10 pb-10 overflow-hidden">
      <div className="absolute inset-0 grid-lines pointer-events-none" />
      <div className="absolute inset-x-0 top-0 h-px hairline-glow" />
      <div className="relative mx-auto max-w-[1240px] px-5">
        {crumbs && <Breadcrumbs items={crumbs} />}
        {eyebrow && <p className="eyebrow mt-6">{eyebrow}</p>}
        <h1 className="display text-[clamp(2.1rem,4.6vw,3.6rem)] mt-3 max-w-[900px]">{title}</h1>
        {intro && (
          <p className="mt-5 text-[15px] leading-relaxed text-paper-400 max-w-[640px]">{intro}</p>
        )}
        {meta && <div className="mt-6">{meta}</div>}
        {children}
      </div>
    </section>
  );
}
