import Link from "next/link";

export default function LinkCloud({
  title,
  links,
  columns = false,
}: {
  title: string;
  links: { href: string; label: string; count?: number }[];
  columns?: boolean;
}) {
  if (links.length === 0) return null;
  return (
    <section className="mt-14">
      <p className="eyebrow mb-4">{title}</p>
      {columns ? (
        <div className="grid gap-x-6 gap-y-0 sm:grid-cols-2 lg:grid-cols-3">
          {links.map((l) => (
            <Link
              key={l.href}
              href={l.href}
              className="flex items-baseline justify-between gap-3 py-2.5 border-b border-white/[0.05]
                         text-[13.5px] text-paper-400 hover:text-paper-100 hover:border-brand-500/40 transition-colors"
            >
              <span>{l.label}</span>
              {typeof l.count === "number" && (
                <span className="text-[11px] tabular text-paper-600">{l.count}</span>
              )}
            </Link>
          ))}
        </div>
      ) : (
        <div className="flex flex-wrap gap-2">
          {links.map((l) => (
            <Link
              key={l.href}
              href={l.href}
              className="text-[12.5px] px-3.5 py-2 rounded-full edge text-paper-400
                         hover:text-paper-100 hover:border-brand-500/50 transition-colors"
            >
              {l.label}
              {typeof l.count === "number" && (
                <span className="text-paper-600 ml-1.5 tabular">{l.count}</span>
              )}
            </Link>
          ))}
        </div>
      )}
    </section>
  );
}
