"use client";

import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import type { FieldGuide } from "@/content/onboarding";

type Faq = { q: string; a: string };

/**
 * Drafts for one field. Nothing is written into the field until the firm picks
 * a draft, and they can edit it after. The firm stays the author.
 */
export default function AiWriter({
  listingId, guide, value, onChange,
}: { listingId: string; guide: FieldGuide; value: unknown; onChange: (v: unknown) => void }) {
  const [open, setOpen] = useState(false);
  const [brief, setBrief] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [drafts, setDrafts] = useState<string[]>([]);
  const [faqs, setFaqs] = useState<Faq[]>([]);

  const isList = guide.type === "list";
  const isFaq = guide.type === "faq";

  async function write() {
    setBusy(true); setError(null); setDrafts([]); setFaqs([]);
    const current = typeof value === "string" ? value : Array.isArray(value) ? JSON.stringify(value) : "";
    const r = await fetch("/api/ai/write", {
      method: "POST", headers: { "content-type": "application/json" },
      body: JSON.stringify({ listing_id: listingId, field: guide.name, brief, current }),
    }).catch(() => null);
    const j = await r?.json().catch(() => ({}));
    setBusy(false);
    if (!r?.ok) return setError(j?.error ?? "Could not write that. Try again.");
    if (isFaq) setFaqs(j.faqs ?? []);
    else setDrafts(j.drafts ?? j.points ?? []);
  }

  const list = (Array.isArray(value) ? value : []) as string[];
  const faqList = (Array.isArray(value) ? value : []) as Faq[];
  const addPoint = (p: string) => onChange([...list.filter((x) => x.trim()), p]);
  const addFaq = (f: Faq) => onChange([...faqList.filter((x) => x.q?.trim()), f]);

  return (
    <div className="mt-2.5">
      {!open ? (
        <button type="button" onClick={() => setOpen(true)}
          className="inline-flex items-center gap-1.5 text-[12px] text-gold-300 hover:text-gold-200">
          <span aria-hidden>✦</span> Write with AI
        </button>
      ) : (
        <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }}
          className="rounded-xl border border-gold-500/30 bg-gold-500/[0.05] p-3.5">
          <div className="flex items-center justify-between gap-3">
            <p className="text-[12.5px] text-gold-300"><span aria-hidden>✦</span> Write with AI</p>
            <button type="button" onClick={() => setOpen(false)} className="text-[12px] text-paper-500 hover:text-paper-300">Close</button>
          </div>
          <input value={brief} onChange={(e) => setBrief(e.target.value)} maxLength={500}
            placeholder="Optional: anything it should mention, e.g. mostly first home buyers, we speak Greek"
            className="mt-2.5 w-full rounded-lg bg-white/[0.03] edge px-3 py-2 text-[12.5px] text-paper-100 placeholder:text-paper-600 outline-none focus:border-gold-500/50" />
          <button type="button" onClick={write} disabled={busy}
            className="btn btn-primary !py-2 !px-4 !text-[12.5px] mt-2.5 disabled:opacity-60">
            {busy ? "Writing…" : drafts.length || faqs.length ? "Write more" : "Write drafts"}
          </button>
          {error && <p className="text-[12px] text-red-400 mt-2">{error}</p>}

          <AnimatePresence>
            {drafts.length > 0 && (
              <motion.ul initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="mt-3 space-y-2">
                {drafts.map((d, i) => (
                  <motion.li key={d} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.06 }}
                    className="rounded-lg border border-white/[0.08] bg-ink-900/60 px-3 py-2.5 flex items-start justify-between gap-3">
                    <span className="text-[12.5px] leading-relaxed text-paper-200">{d}</span>
                    <button type="button" onClick={() => (isList ? addPoint(d) : onChange(d))}
                      className="shrink-0 text-[12px] text-brand-400 hover:text-brand-200">
                      {isList ? "Add" : "Use this"}
                    </button>
                  </motion.li>
                ))}
              </motion.ul>
            )}
            {faqs.length > 0 && (
              <motion.ul initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="mt-3 space-y-2">
                {faqs.map((f, i) => (
                  <motion.li key={f.q} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.06 }}
                    className="rounded-lg border border-white/[0.08] bg-ink-900/60 px-3 py-2.5 flex items-start justify-between gap-3">
                    <span>
                      <span className="block text-[12.5px] text-paper-100">{f.q}</span>
                      <span className="block text-[12px] text-paper-400 mt-1">{f.a}</span>
                    </span>
                    <button type="button" onClick={() => addFaq(f)} className="shrink-0 text-[12px] text-brand-400 hover:text-brand-200">Add</button>
                  </motion.li>
                ))}
              </motion.ul>
            )}
          </AnimatePresence>
          <p className="text-[11px] text-paper-600 mt-2.5">
            Drafts follow the advice above and avoid outcome promises and &quot;specialist&quot; claims. Check every
            fact before you publish: you are responsible for what your profile says.
          </p>
        </motion.div>
      )}
    </div>
  );
}
