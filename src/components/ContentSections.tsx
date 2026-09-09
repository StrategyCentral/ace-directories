import Link from "next/link";
import type { PracticeContent } from "@/content/practice-content";
import type { StateContext } from "@/content/states";
import Reveal from "./Reveal";

export function Prose({ paragraphs }: { paragraphs: string[] }) {
  return (
    <div className="space-y-4 max-w-[68ch]">
      {paragraphs.map((p, i) => (
        <p key={i} className="text-[15px] leading-[1.75] text-paper-300">{p}</p>
      ))}
    </div>
  );
}

export function SectionHead({ eyebrow, title }: { eyebrow?: string; title: string }) {
  return (
    <div className="mb-6">
      {eyebrow && <p className="eyebrow mb-2.5">{eyebrow}</p>}
      <h2 className="display text-[clamp(1.5rem,2.8vw,2.1rem)]">{title}</h2>
    </div>
  );
}

export function TickList({ items }: { items: string[] }) {
  return (
    <ul className="grid gap-2.5 sm:grid-cols-2 max-w-[900px]">
      {items.map((t) => (
        <li key={t} className="flex gap-3 text-[14px] leading-relaxed text-paper-300">
          <span className="text-brand-400 shrink-0 mt-0.5" aria-hidden="true">✓</span>
          <span>{t}</span>
        </li>
      ))}
    </ul>
  );
}

/** The main editorial block used on every practice-area page. */
export function PracticeArticle({
  content,
  name,
  singular,
  state,
}: {
  content: PracticeContent;
  name: string;
  singular: string;
  state?: StateContext | null;
}) {
  return (
    <div className="space-y-14">
      <Reveal>
        <section>
          <SectionHead eyebrow="Overview" title={`What ${name.toLowerCase()} actually do`} />
          <Prose paragraphs={content.intro} />
        </section>
      </Reveal>

      <Reveal>
        <section>
          <SectionHead title="The work they handle" />
          <TickList items={content.whatTheyDo} />
        </section>
      </Reveal>

      {state && (
        <Reveal>
          <section>
            <SectionHead eyebrow={state.name} title="Where a matter like this is heard" />
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 max-w-[980px]">
              {state.courts.map((c) => (
                <div key={c.name} className="surface rounded-[var(--radius-card)] p-5">
                  <p className="text-[14px] font-medium text-paper-100">{c.name}</p>
                  <p className="text-[12.5px] leading-relaxed text-paper-500 mt-2">Handles {c.handles}.</p>
                </div>
              ))}
              <div className="surface rounded-[var(--radius-card)] p-5">
                <p className="text-[14px] font-medium text-paper-100">
                  {state.tribunal.name} <span className="text-paper-600">({state.tribunal.abbr})</span>
                </p>
                <p className="text-[12.5px] leading-relaxed text-paper-500 mt-2">
                  Handles {state.tribunal.handles}.
                </p>
              </div>
            </div>
            <ul className="mt-5 space-y-2.5 max-w-[68ch]">
              {state.quirks.map((k) => (
                <li key={k} className="text-[14px] leading-relaxed text-paper-400 flex gap-3">
                  <span className="text-gold-400 shrink-0 mt-0.5" aria-hidden="true">▸</span>
                  <span>{k}</span>
                </li>
              ))}
            </ul>
          </section>
        </Reveal>
      )}

      <Reveal>
        <section>
          <SectionHead title={`When to call a ${singular.toLowerCase()}`} />
          <TickList items={content.whenToCall} />
        </section>
      </Reveal>

      <Reveal>
        <section>
          <SectionHead title="What it costs" />
          <Prose paragraphs={[content.costNote]} />
        </section>
      </Reveal>

      <Reveal>
        <section>
          <SectionHead title="How to choose" />
          <div className="grid gap-3 sm:grid-cols-3 max-w-[980px]">
            {content.chooseTips.map((t) => (
              <div key={t.title} className="surface rounded-[var(--radius-card)] p-5">
                <p className="text-[14px] font-medium text-paper-100">{t.title}</p>
                <p className="text-[12.5px] leading-relaxed text-paper-500 mt-2">{t.body}</p>
              </div>
            ))}
          </div>
        </section>
      </Reveal>

      {state && (
        <Reveal>
          <section className="surface rounded-2xl p-6 max-w-[820px]">
            <p className="eyebrow mb-2.5">Before you engage anyone</p>
            <p className="text-[14px] leading-relaxed text-paper-300">
              Check the practitioner holds a current practising certificate. In{" "}
              {state.name} that is {state.regulator.name}, and the register is public.
            </p>
            <a
              href={state.regulator.register}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-block mt-4 text-[13.5px] text-brand-400 hover:text-brand-200"
            >
              Check the {state.code} register ↗
            </a>
          </section>
        </Reveal>
      )}

      <Reveal>
        <section>
          <SectionHead title="Common questions" />
          <div className="space-y-3 max-w-[820px]">
            {content.faqs.map((f) => (
              <details key={f.q} className="surface rounded-[var(--radius-card)] p-5 group">
                <summary className="text-[14.5px] font-medium text-paper-100 cursor-pointer list-none flex justify-between gap-4">
                  {f.q}
                  <span className="text-paper-600 shrink-0 transition-transform group-open:rotate-45" aria-hidden="true">+</span>
                </summary>
                <p className="text-[13.5px] leading-relaxed text-paper-400 mt-3">{f.a}</p>
              </details>
            ))}
          </div>
        </section>
      </Reveal>

      <p className="text-[12px] leading-relaxed text-paper-600 max-w-[68ch]">
        This page is general information, not legal advice. Laws differ between states and
        every situation turns on its own facts — speak to a qualified Australian lawyer
        before acting. If you cannot afford one,{" "}
        <Link href="/legal-aid" className="underline hover:text-paper-400">
          Legal Aid operates in every state and territory
        </Link>.
      </p>
    </div>
  );
}

/** FAQ structured data, so the questions can win their own SERP real estate. */
export function FaqSchema({ faqs }: { faqs: { q: string; a: string }[] }) {
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{
        __html: JSON.stringify({
          "@context": "https://schema.org",
          "@type": "FAQPage",
          mainEntity: faqs.map((f) => ({
            "@type": "Question",
            name: f.q,
            acceptedAnswer: { "@type": "Answer", text: f.a },
          })),
        }),
      }}
    />
  );
}
