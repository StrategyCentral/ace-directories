import { db } from "@/lib/supabase";
import Reveal from "@/components/Reveal";

interface Row { id: string; author_name: string; author_role: string | null; firm_name: string | null; place: string | null; rating: number; body: string }

/**
 * Reviews of the directory by the firms that use it. Only approved ones show,
 * and the whole section disappears until there is at least one, so there are
 * never empty boxes or made-up quotes.
 */
export default async function Testimonials({ title = "What firms say" }: { title?: string }) {
  const { data } = await db().from("testimonials")
    .select("id,author_name,author_role,firm_name,place,rating,body")
    .eq("status", "approved").order("approved_at", { ascending: false }).limit(6);
  const rows = (data as Row[]) ?? [];
  if (rows.length === 0) return null;
  const avg = rows.reduce((a, r) => a + r.rating, 0) / rows.length;

  return (
    <section className="mx-auto max-w-[1240px] px-5 py-12">
      <Reveal>
        <p className="eyebrow">Reviews</p>
        <div className="flex items-end justify-between gap-4 flex-wrap mt-3">
          <h2 className="display text-[clamp(1.7rem,3.2vw,2.4rem)]">{title}</h2>
          <p className="text-[13px] text-paper-400">
            <span className="text-gold-400">★</span> {avg.toFixed(1)} from {rows.length} firm{rows.length === 1 ? "" : "s"}
          </p>
        </div>
      </Reveal>
      <div className="mt-8 grid gap-3 md:grid-cols-2 lg:grid-cols-3">
        {rows.map((r, i) => (
          <Reveal key={r.id} delay={i * 0.05}>
            <figure className="surface lift rounded-[var(--radius-card)] p-6 h-full flex flex-col">
              <p className="text-gold-400 text-[15px] tracking-[2px]" aria-label={`${r.rating} out of 5 stars`}>
                {"★".repeat(r.rating)}<span className="text-white/15">{"★".repeat(5 - r.rating)}</span>
              </p>
              <blockquote className="text-[14px] leading-relaxed text-paper-200 mt-3.5 flex-1">“{r.body}”</blockquote>
              <figcaption className="mt-5 pt-4 border-t border-white/[0.06]">
                <p className="text-[13.5px] text-paper-100">{r.author_name}{r.author_role ? `, ${r.author_role}` : ""}</p>
                <p className="text-[12px] text-paper-500 mt-0.5">{[r.firm_name, r.place].filter(Boolean).join(" · ")}</p>
              </figcaption>
            </figure>
          </Reveal>
        ))}
      </div>
    </section>
  );
}
