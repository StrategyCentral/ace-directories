"use client";

import { useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { ONBOARDING, type FieldGuide } from "@/content/onboarding";
import { cx } from "@/lib/format";
import type { Listing } from "@/lib/types";

type Values = Record<string, unknown>;

export default function ProfileWizard({ listing }: { listing: Listing }) {
  const [step, setStep] = useState(0);
  const [values, setValues] = useState<Values>(() => seed(listing));
  const [busy, setBusy] = useState(false);
  const [saved, setSaved] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const current = ONBOARDING[step];
  const isLast = step === ONBOARDING.length - 1;
  const score = useMemo(() => estimateScore(values, listing), [values, listing]);

  const set = (name: string, v: unknown) => setValues((s) => ({ ...s, [name]: v }));

  async function save(advance: boolean) {
    setBusy(true);
    setError(null);
    try {
      const res = await fetch("/api/listing/update", {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ listing_id: listing.id, ...values, onboarding_step: step + 1 }),
      });
      if (!res.ok) throw new Error((await res.json()).error ?? "Could not save");
      setSaved("Saved");
      setTimeout(() => setSaved(null), 2000);
      if (advance && !isLast) setStep((s) => s + 1);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not save");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_340px] lg:items-start">
      <div className="space-y-5">
        {/* progress */}
        <div className="flex gap-1.5">
          {ONBOARDING.map((s, i) => (
            <button
              key={s.key}
              onClick={() => setStep(i)}
              className={cx(
                "flex-1 h-1.5 rounded-full transition-colors",
                i < step ? "bg-brand-500" : i === step ? "bg-gold-500" : "bg-white/[0.08]",
              )}
              aria-label={s.title}
            />
          ))}
        </div>

        <AnimatePresence mode="wait">
          <motion.div
            key={current.key}
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.28 }}
            className="surface rounded-2xl p-6 md:p-8"
          >
            <p className="eyebrow">Step {step + 1} of {ONBOARDING.length}</p>
            <h2 className="display text-[clamp(1.4rem,2.6vw,2rem)] mt-2">{current.title}</h2>

            <div className="mt-4 rounded-xl border border-brand-500/25 bg-brand-500/[0.06] p-4">
              <p className="text-[13px] font-medium text-brand-200">{current.principle}</p>
              <p className="text-[12.5px] leading-relaxed text-paper-400 mt-2">{current.why}</p>
            </div>

            <div className="mt-7 space-y-6">
              {current.fields.map((f) => (
                <Field key={f.name} guide={f} value={values[f.name]} onChange={(v) => set(f.name, v)} />
              ))}
            </div>

            {error && <p className="text-[12.5px] text-red-400 mt-5">{error}</p>}

            <div className="flex items-center gap-2.5 mt-8 flex-wrap">
              {step > 0 && (
                <button onClick={() => setStep((s) => s - 1)} className="btn btn-ghost !text-[13px]">
                  Back
                </button>
              )}
              <button onClick={() => save(true)} disabled={busy}
                      className="btn btn-gold !text-[13px] disabled:opacity-60">
                {busy ? "Saving…" : isLast ? "Save and finish" : "Save and continue"}
              </button>
              {saved && <span className="text-[12.5px] text-brand-300">{saved}</span>}
              {!isLast && (
                <button onClick={() => setStep((s) => s + 1)}
                        className="text-[12.5px] text-paper-600 hover:text-paper-400 ml-auto">
                  Skip for now
                </button>
              )}
            </div>
          </motion.div>
        </AnimatePresence>
      </div>

      <aside className="lg:sticky lg:top-24 space-y-4">
        <div className="surface rounded-2xl p-5">
          <div className="flex items-baseline justify-between">
            <p className="eyebrow">Conversion strength</p>
            <span className="display text-[26px] tabular text-gold-300">{score}%</span>
          </div>
          <div className="mt-3 h-1.5 rounded-full bg-white/[0.07] overflow-hidden">
            <motion.div
              className="h-full rounded-full bg-gradient-to-r from-gold-500 to-brand-500"
              animate={{ width: `${Math.max(3, score)}%` }}
              transition={{ duration: 0.5 }}
            />
          </div>
          <p className="text-[12px] leading-relaxed text-paper-500 mt-3">
            {score < 40
              ? "Below 40% your page reads like a directory entry. The headline and the fee question are worth more than everything else combined."
              : score < 70
                ? "Getting there. Adding FAQs and a photo is usually the fastest lift from here."
                : "Strong. This page now does the work a landing page does — a specific promise, proof, and an easy way to make contact."}
          </p>
        </div>

        <LivePreview listing={listing} values={values} />
      </aside>
    </div>
  );
}

/* ------------------------------------------------------------------ fields */

function Field({
  guide, value, onChange,
}: { guide: FieldGuide; value: unknown; onChange: (v: unknown) => void }) {
  const [showTip, setShowTip] = useState(false);

  return (
    <div>
      <div className="flex items-baseline justify-between gap-3">
        <label className="text-[13.5px] text-paper-200">
          {guide.label}
          {guide.optional && <span className="text-paper-600 text-[11.5px]"> · optional</span>}
        </label>
        {(guide.good || guide.bad) && (
          <button onClick={() => setShowTip((v) => !v)}
                  className="text-[11.5px] text-brand-400 hover:text-brand-200">
            {showTip ? "Hide example" : "Show example"}
          </button>
        )}
      </div>
      <p className="text-[12px] leading-relaxed text-paper-500 mt-1">{guide.help}</p>

      <AnimatePresence>
        {showTip && (
          <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }}
                      exit={{ opacity: 0, height: 0 }} className="overflow-hidden">
            <div className="mt-2.5 space-y-2 text-[12px] leading-relaxed">
              {guide.good && (
                <p className="rounded-lg border border-brand-500/25 bg-brand-500/[0.05] px-3 py-2 text-paper-300">
                  <span className="text-brand-300 font-medium">Works: </span>{guide.good}
                </p>
              )}
              {guide.bad && (
                <p className="rounded-lg border border-red-500/20 bg-red-500/[0.04] px-3 py-2 text-paper-400">
                  <span className="text-red-300 font-medium">Doesn&apos;t: </span>{guide.bad}
                </p>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="mt-2.5">
        <Control guide={guide} value={value} onChange={onChange} />
      </div>
    </div>
  );
}

function Control({
  guide, value, onChange,
}: { guide: FieldGuide; value: unknown; onChange: (v: unknown) => void }) {
  const base =
    "w-full rounded-lg bg-white/[0.03] edge px-3 py-2.5 text-[13.5px] text-paper-100 " +
    "placeholder:text-paper-600 outline-none focus:border-brand-500/60 transition-colors";

  switch (guide.type) {
    case "textarea":
      return (
        <>
          <textarea rows={4} value={String(value ?? "")} placeholder={guide.placeholder}
                    maxLength={guide.maxLength}
                    onChange={(e) => onChange(e.target.value)} className={`${base} resize-y`} />
          {guide.maxLength && (
            <p className="text-[11px] text-paper-600 mt-1 text-right tabular">
              {String(value ?? "").length}/{guide.maxLength}
            </p>
          )}
        </>
      );
    case "select":
      return (
        <select value={String(value ?? "")} onChange={(e) => onChange(e.target.value)} className={base}>
          <option value="" className="bg-ink-900">Choose…</option>
          {guide.options?.map((o) => (
            <option key={o.value} value={o.value} className="bg-ink-900">{o.label}</option>
          ))}
        </select>
      );
    case "toggle":
      return (
        <button type="button" onClick={() => onChange(!value)}
                className={cx("flex items-center gap-3 text-[13px] rounded-lg px-3 py-2.5 border transition-colors",
                  value ? "border-brand-500/50 bg-brand-500/[0.08] text-paper-100"
                        : "border-white/[0.08] text-paper-400")}>
          <span className={cx("w-9 h-5 rounded-full p-0.5 flex transition-colors",
                              value ? "bg-brand-500" : "bg-white/[0.12]")}>
            <span className={cx("size-4 rounded-full bg-white transition-transform",
                                value ? "translate-x-4" : "")} />
          </span>
          {value ? "Yes" : "No"}
        </button>
      );
    case "number":
      return (
        <input type="number" value={String(value ?? "")} placeholder={guide.placeholder}
               onChange={(e) => onChange(e.target.value ? Number(e.target.value) : null)} className={base} />
      );
    case "list":
      return <ListEditor value={(value as string[]) ?? []} onChange={onChange} />;
    case "faq":
      return <FaqEditor value={(value as { q: string; a: string }[]) ?? []} onChange={onChange} />;
    default:
      return (
        <input value={String(value ?? "")} placeholder={guide.placeholder} maxLength={guide.maxLength}
               onChange={(e) => onChange(e.target.value)} className={base} />
      );
  }
}

function ListEditor({ value, onChange }: { value: string[]; onChange: (v: string[]) => void }) {
  const rows = value.length ? value : ["", "", ""];
  return (
    <div className="space-y-2">
      {rows.map((row, i) => (
        <input
          key={i}
          value={row}
          onChange={(e) => {
            const next = [...rows];
            next[i] = e.target.value;
            onChange(next.filter((r, idx) => r.trim() || idx < 3));
          }}
          placeholder={`Point ${i + 1}`}
          className="w-full rounded-lg bg-white/[0.03] edge px-3 py-2.5 text-[13.5px] text-paper-100
                     placeholder:text-paper-600 outline-none focus:border-brand-500/60"
        />
      ))}
      <button type="button" onClick={() => onChange([...rows, ""])}
              className="text-[12px] text-brand-400 hover:text-brand-200">+ Add another</button>
    </div>
  );
}

function FaqEditor({
  value, onChange,
}: { value: { q: string; a: string }[]; onChange: (v: { q: string; a: string }[]) => void }) {
  const rows = value.length ? value : [{ q: "", a: "" }];
  const update = (i: number, key: "q" | "a", v: string) => {
    const next = rows.map((r, idx) => (idx === i ? { ...r, [key]: v } : r));
    onChange(next);
  };
  return (
    <div className="space-y-3">
      {rows.map((row, i) => (
        <div key={i} className="rounded-lg border border-white/[0.07] p-3 space-y-2">
          <input value={row.q} onChange={(e) => update(i, "q", e.target.value)}
                 placeholder="Question a client actually asks"
                 className="w-full bg-transparent text-[13.5px] text-paper-100 placeholder:text-paper-600 outline-none" />
          <textarea value={row.a} onChange={(e) => update(i, "a", e.target.value)} rows={2}
                    placeholder="Your answer, in plain English"
                    className="w-full bg-transparent text-[13px] text-paper-400 placeholder:text-paper-600 outline-none resize-y" />
        </div>
      ))}
      <button type="button" onClick={() => onChange([...rows, { q: "", a: "" }])}
              className="text-[12px] text-brand-400 hover:text-brand-200">+ Add a question</button>
    </div>
  );
}

/* ----------------------------------------------------------------- preview */

function LivePreview({ listing, values }: { listing: Listing; values: Values }) {
  const headline = String(values.headline ?? "") || listing.full_name;
  const intro = String(values.intro ?? "");
  const usps = ((values.usps as string[]) ?? []).filter(Boolean);

  return (
    <div className="surface rounded-2xl p-5">
      <p className="eyebrow mb-3">How it will look</p>
      <div className="rounded-xl border border-white/[0.07] bg-ink-950 p-4">
        <p className="text-[15px] font-medium text-paper-100 leading-snug">{headline}</p>
        <p className="text-[11.5px] text-paper-600 mt-1">
          {[listing.suburb, listing.state].filter(Boolean).join(", ")}
        </p>
        {intro && <p className="text-[12.5px] leading-relaxed text-paper-400 mt-3">{intro}</p>}
        {values.free_consult ? (
          <p className="mt-3 inline-block text-[11.5px] px-2.5 py-1 rounded-md bg-gold-500/15 text-gold-300 border border-gold-500/30">
            Free {values.free_consult_mins ? `${values.free_consult_mins}-minute ` : ""}consultation
          </p>
        ) : null}
        {usps.length > 0 && (
          <ul className="mt-3 space-y-1">
            {usps.slice(0, 3).map((u) => (
              <li key={u} className="text-[12px] text-paper-400 flex gap-2">
                <span className="text-brand-400">✓</span>{u}
              </li>
            ))}
          </ul>
        )}
      </div>
      <p className="text-[11px] text-paper-600 mt-3">
        Updates as you type. Nothing is public until you save.
      </p>
    </div>
  );
}

/* ------------------------------------------------------------------ helpers */

function seed(l: Listing): Values {
  const rec = l as unknown as Record<string, unknown>;
  return {
    headline: rec.headline ?? "",
    intro: rec.intro ?? "",
    usps: rec.usps ?? [],
    free_consult: rec.free_consult ?? false,
    free_consult_mins: rec.free_consult_mins ?? null,
    fee_approach: rec.fee_approach ?? "",
    fee_note: rec.fee_note ?? "",
    response_commitment: rec.response_commitment ?? "",
    admitted_year: rec.admitted_year ?? null,
    principal_name: rec.principal_name ?? "",
    memberships: rec.memberships ?? [],
    faqs: rec.faqs ?? [],
    logo_url: l.logo_url ?? "",
    photo_url: l.photo_url ?? "",
    abn: rec.abn ?? "",
  };
}

/** Mirrors conversion_score() in SQL so the bar moves as they type. */
function estimateScore(v: Values, l: Listing): number {
  const has = (k: string) => Boolean(String(v[k] ?? "").trim());
  const arr = (k: string) => ((v[k] as unknown[]) ?? []).filter(Boolean).length;
  let s = 0;
  if (has("headline")) s += 12;
  if (has("intro")) s += 10;
  if ((l.bio ?? "").length > 300) s += 10;
  if (arr("usps") >= 3) s += 10;
  if (v.free_consult) s += 10;
  if (has("fee_approach")) s += 8;
  if (has("response_commitment")) s += 6;
  if (has("logo_url")) s += 6;
  if (has("photo_url")) s += 4;
  if (l.website) s += 4;
  if ((l.practice_areas ?? []).length > 1) s += 6;
  if (((v.faqs as { q: string }[]) ?? []).filter((f) => f.q?.trim()).length >= 3) s += 8;
  if (l.review_count > 0) s += 6;
  return Math.min(100, s);
}
