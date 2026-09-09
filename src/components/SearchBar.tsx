"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import { cx } from "@/lib/format";
import type { PracticeArea, Suburb } from "@/lib/types";

const ROTATING = [
  "I'm separating from my partner",
  "I've been charged with an offence",
  "I'm buying a house",
  "I was injured at work",
  "My visa was refused",
  "I need a will drawn up",
  "I was unfairly dismissed",
  "I'm starting a business",
];

export default function SearchBar({
  areas,
  size = "hero",
  initialPractice,
  initialSuburb,
}: {
  areas: PracticeArea[];
  size?: "hero" | "inline";
  initialPractice?: string;
  initialSuburb?: Suburb | null;
}) {
  const router = useRouter();
  const [need, setNeed] = useState("");
  const [practice, setPractice] = useState<PracticeArea | null>(
    areas.find((a) => a.slug === initialPractice) ?? null,
  );
  const [place, setPlace] = useState(initialSuburb ? `${initialSuburb.name}, ${initialSuburb.state}` : "");
  const [suburb, setSuburb] = useState<Suburb | null>(initialSuburb ?? null);
  const [suburbHits, setSuburbHits] = useState<Suburb[]>([]);
  const [focus, setFocus] = useState<"need" | "place" | null>(null);
  const [rotIdx, setRotIdx] = useState(0);
  const wrap = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (need || practice) return;
    const t = setInterval(() => setRotIdx((i) => (i + 1) % ROTATING.length), 3200);
    return () => clearInterval(t);
  }, [need, practice]);

  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      if (wrap.current && !wrap.current.contains(e.target as Node)) setFocus(null);
    };
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, []);

  // Match on the category name *and* its plain-English intent terms, so
  // "custody" finds Family Lawyers and "drink driving" finds Traffic Lawyers.
  const needHits = useMemo(() => {
    const t = need.trim().toLowerCase();
    if (!t) return areas.filter((a) => a.tier === 1).slice(0, 8);
    const scored = areas
      .map((a) => {
        const name = a.name.toLowerCase();
        const terms = (a.intent_terms ?? []).join(" ").toLowerCase();
        let score = 0;
        if (name.startsWith(t)) score = 100;
        else if (name.includes(t)) score = 70;
        else if (terms.includes(t)) score = 50;
        else if (t.split(/\s+/).some((w) => w.length > 3 && terms.includes(w))) score = 30;
        return { a, score };
      })
      .filter((x) => x.score > 0)
      .sort((x, y) => y.score - x.score || y.a.listing_count - x.a.listing_count);
    return scored.slice(0, 8).map((x) => x.a);
  }, [need, areas]);

  useEffect(() => {
    const t = place.trim();
    if (t.length < 2 || suburb?.name.toLowerCase() === t.toLowerCase()) {
      setSuburbHits([]);
      return;
    }
    const ctrl = new AbortController();
    const id = setTimeout(async () => {
      try {
        const res = await fetch(`/api/suburbs?q=${encodeURIComponent(t)}`, { signal: ctrl.signal });
        setSuburbHits(await res.json());
      } catch { /* aborted */ }
    }, 160);
    return () => { clearTimeout(id); ctrl.abort(); };
  }, [place, suburb]);

  function submit(e?: React.FormEvent) {
    e?.preventDefault();
    const p = practice?.slug;
    if (p && suburb) router.push(`/${p}/${suburb.slug}`);
    else if (p) router.push(`/${p}`);
    else if (suburb) router.push(`/lawyers/${suburb.slug}`);
    else router.push(`/search?q=${encodeURIComponent(need || place)}`);
  }

  const hero = size === "hero";

  return (
    <form
      ref={wrap}
      onSubmit={submit}
      className={cx(
        "relative w-full",
        hero ? "max-w-[820px]" : "max-w-[720px]",
      )}
    >
      <div
        className={cx(
          "glass edge rounded-2xl flex flex-col sm:flex-row items-stretch overflow-visible",
          "shadow-[0_24px_80px_-30px_rgba(0,0,0,0.9)]",
          hero ? "p-2" : "p-1.5",
        )}
      >
        {/* --------------------------------------------------- what you need */}
        <div className="relative flex-[1.25] min-w-0">
          <label className="sr-only" htmlFor="ald-need">What do you need help with?</label>
          <div className="flex items-center gap-3 px-4 py-3">
            <ScalesIcon />
            <div className="relative flex-1 min-w-0">
              <input
                id="ald-need"
                value={practice ? practice.name : need}
                onChange={(e) => { setNeed(e.target.value); setPractice(null); }}
                onFocus={() => setFocus("need")}
                autoComplete="off"
                className="w-full bg-transparent outline-none text-[15px] text-paper-100 placeholder:text-transparent"
                placeholder="What do you need help with?"
              />
              {!need && !practice && (
                <div className="pointer-events-none absolute inset-0 flex items-center">
                  <AnimatePresence mode="wait">
                    <motion.span
                      key={rotIdx}
                      initial={{ opacity: 0, y: 7 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -7 }}
                      transition={{ duration: 0.32 }}
                      className="text-[15px] text-paper-600 truncate"
                    >
                      {ROTATING[rotIdx]}
                    </motion.span>
                  </AnimatePresence>
                </div>
              )}
            </div>
          </div>

          <AnimatePresence>
            {focus === "need" && needHits.length > 0 && (
              <Dropdown>
                {!need && <p className="eyebrow px-4 pt-3 pb-1.5">Most searched</p>}
                {needHits.map((a) => (
                  <button
                    key={a.slug}
                    type="button"
                    onClick={() => { setPractice(a); setNeed(""); setFocus("place"); }}
                    className="w-full text-left px-4 py-2.5 hover:bg-white/[0.05] flex items-center justify-between gap-3 group"
                  >
                    <span>
                      <span className="block text-[13.5px] text-paper-100">{a.name}</span>
                      {a.hero_question && (
                        <span className="block text-[11.5px] text-paper-600 mt-0.5">{a.hero_question}</span>
                      )}
                    </span>
                    <span className="text-[11px] tabular text-paper-600 shrink-0">{a.listing_count || ""}</span>
                  </button>
                ))}
              </Dropdown>
            )}
          </AnimatePresence>
        </div>

        <div className="hidden sm:block w-px bg-white/[0.08] my-3" />

        {/* -------------------------------------------------------- where */}
        <div className="relative flex-1 min-w-0">
          <label className="sr-only" htmlFor="ald-place">Suburb or postcode</label>
          <div className="flex items-center gap-3 px-4 py-3">
            <PinIcon />
            <input
              id="ald-place"
              value={place}
              onChange={(e) => { setPlace(e.target.value); setSuburb(null); }}
              onFocus={() => setFocus("place")}
              autoComplete="off"
              placeholder="Suburb or postcode"
              className="w-full bg-transparent outline-none text-[15px] text-paper-100 placeholder:text-paper-600"
            />
          </div>

          <AnimatePresence>
            {focus === "place" && suburbHits.length > 0 && (
              <Dropdown>
                {suburbHits.map((s) => (
                  <button
                    key={s.slug}
                    type="button"
                    onClick={() => { setSuburb(s); setPlace(`${s.name}, ${s.state}`); setFocus(null); }}
                    className="w-full text-left px-4 py-2.5 hover:bg-white/[0.05] flex items-center justify-between gap-3"
                  >
                    <span className="text-[13.5px] text-paper-100">
                      {s.name} <span className="text-paper-600">{s.state}</span>
                    </span>
                    <span className="text-[11px] tabular text-paper-600">{s.listing_count} firms</span>
                  </button>
                ))}
              </Dropdown>
            )}
          </AnimatePresence>
        </div>

        <button type="submit" className="btn btn-primary sm:!px-7 m-1 sm:m-0 sm:mr-1 sm:self-stretch !rounded-xl">
          Find lawyers
        </button>
      </div>

      {hero && (
        <div className="mt-4 flex flex-wrap items-center gap-2 justify-center">
          <span className="text-[12px] text-paper-600 mr-1">Common:</span>
          {areas.filter((a) => a.tier === 1).slice(0, 5).map((a) => (
            <button
              key={a.slug}
              type="button"
              onClick={() => { setPractice(a); setNeed(""); }}
              className="text-[12px] px-3 py-1.5 rounded-full edge text-paper-400 hover:text-paper-100 hover:border-brand-500/50 transition-colors"
            >
              {a.name}
            </button>
          ))}
        </div>
      )}
    </form>
  );
}

function Dropdown({ children }: { children: React.ReactNode }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 6 }}
      transition={{ duration: 0.16 }}
      className="absolute left-1 right-1 top-full mt-2 z-30 glass edge rounded-xl overflow-hidden py-1
                 shadow-[0_24px_60px_-20px_rgba(0,0,0,0.9)]"
    >
      {children}
    </motion.div>
  );
}

function ScalesIcon() {
  return (
    <svg width="17" height="17" viewBox="0 0 20 20" fill="none" stroke="#6d97ff" strokeWidth="1.5"
      strokeLinecap="round" className="shrink-0">
      <path d="M10 3.5v13M4.5 6.5h11M10 3.5a1 1 0 1 0 0-.001" />
      <path d="M4.5 6.5 2 12h5L4.5 6.5ZM15.5 6.5 13 12h5l-2.5-5.5Z" />
      <path d="M6.5 16.5h7" />
    </svg>
  );
}

function PinIcon() {
  return (
    <svg width="17" height="17" viewBox="0 0 20 20" fill="none" stroke="#6d97ff" strokeWidth="1.5"
      className="shrink-0">
      <path d="M10 17.5s5.5-5.1 5.5-9a5.5 5.5 0 1 0-11 0c0 3.9 5.5 9 5.5 9Z" strokeLinejoin="round" />
      <circle cx="10" cy="8.4" r="2.1" />
    </svg>
  );
}
