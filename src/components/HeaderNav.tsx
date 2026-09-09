"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import Logo from "./Logo";
import { STATES } from "@/lib/site";
import type { PracticeArea } from "@/lib/types";
import { cx } from "@/lib/format";

export default function HeaderNav({ areas }: { areas: PracticeArea[] }) {
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState<"areas" | "places" | null>(null);
  const [mobile, setMobile] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 12);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && (setOpen(null), setMobile(false));
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  return (
    <header
      className={cx(
        "sticky top-0 z-50 transition-all duration-300",
        scrolled ? "glass edge-b" : "bg-transparent",
      )}
      onMouseLeave={() => setOpen(null)}
    >
      <div className="mx-auto max-w-[1240px] px-5 h-[70px] flex items-center justify-between gap-6">
        <Logo />

        <nav className="hidden lg:flex items-center gap-1 text-[13.5px]">
          <button
            onMouseEnter={() => setOpen("areas")}
            onClick={() => setOpen(open === "areas" ? null : "areas")}
            className={cx(
              "px-3.5 py-2 rounded-full transition-colors",
              open === "areas" ? "text-paper-100 bg-white/[0.06]" : "text-paper-300 hover:text-paper-100",
            )}
          >
            Practice areas
          </button>
          <button
            onMouseEnter={() => setOpen("places")}
            onClick={() => setOpen(open === "places" ? null : "places")}
            className={cx(
              "px-3.5 py-2 rounded-full transition-colors",
              open === "places" ? "text-paper-100 bg-white/[0.06]" : "text-paper-300 hover:text-paper-100",
            )}
          >
            Locations
          </button>
          <Link href="/guides" onMouseEnter={() => setOpen(null)}
            className="px-3.5 py-2 rounded-full text-paper-300 hover:text-paper-100 transition-colors">
            Legal guides
          </Link>
          <Link href="/list-your-firm" onMouseEnter={() => setOpen(null)}
            className="px-3.5 py-2 rounded-full text-paper-300 hover:text-paper-100 transition-colors">
            For lawyers
          </Link>
        </nav>

        <div className="flex items-center gap-2.5">
          <Link href="/search" aria-label="Search the directory"
            className="hidden sm:grid place-items-center size-9 rounded-full edge text-paper-300 hover:text-paper-100 hover:border-brand-500/50 transition-colors">
            <SearchIcon />
          </Link>
          <Link href="/claim" className="btn btn-primary !px-4 !py-2 !text-[13px]">
            Claim your listing
          </Link>
          <button
            className="lg:hidden grid place-items-center size-9 rounded-full edge text-paper-200"
            onClick={() => setMobile((v) => !v)}
            aria-label="Menu"
            aria-expanded={mobile}
          >
            <span className="relative block w-4 h-3">
              <span className={cx("absolute left-0 h-px w-4 bg-current transition-all", mobile ? "top-1.5 rotate-45" : "top-0")} />
              <span className={cx("absolute left-0 top-1.5 h-px w-4 bg-current transition-opacity", mobile && "opacity-0")} />
              <span className={cx("absolute left-0 h-px w-4 bg-current transition-all", mobile ? "top-1.5 -rotate-45" : "top-3")} />
            </span>
          </button>
        </div>
      </div>

      {/* ------------------------------------------------ desktop mega panels */}
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
            className="hidden lg:block absolute inset-x-0 top-[70px] glass edge-b edge-t"
          >
            <div className="mx-auto max-w-[1240px] px-5 py-7">
              {open === "areas" ? (
                <div>
                  <p className="eyebrow mb-4">Browse by what you need</p>
                  <div className="grid grid-cols-4 gap-x-6 gap-y-1">
                    {areas.map((a) => (
                      <Link
                        key={a.slug}
                        href={`/${a.slug}`}
                        onClick={() => setOpen(null)}
                        className="group flex items-baseline justify-between gap-3 py-2 border-b border-white/[0.04] hover:border-brand-500/40 transition-colors"
                      >
                        <span className="text-[13.5px] text-paper-300 group-hover:text-paper-100 transition-colors">
                          {a.name}
                        </span>
                        <span className="text-[11px] tabular text-paper-600">{a.listing_count || ""}</span>
                      </Link>
                    ))}
                  </div>
                  <Link href="/practice-areas" onClick={() => setOpen(null)}
                    className="inline-block mt-5 text-[13px] text-brand-400 hover:text-brand-200">
                    All practice areas →
                  </Link>
                </div>
              ) : (
                <div>
                  <p className="eyebrow mb-4">Browse by where you are</p>
                  <div className="grid grid-cols-4 gap-3">
                    {STATES.map((s) => (
                      <Link
                        key={s.slug}
                        href={`/lawyers/${s.slug}`}
                        onClick={() => setOpen(null)}
                        className="surface lift rounded-[var(--radius-card)] p-4"
                      >
                        <span className="block text-[13.5px] font-medium text-paper-100">{s.name}</span>
                        <span className="block text-[11.5px] text-paper-500 mt-1">
                          {s.capital} · {s.code}
                        </span>
                      </Link>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* -------------------------------------------------------- mobile menu */}
      <AnimatePresence>
        {mobile && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="lg:hidden overflow-hidden glass edge-b"
          >
            <div className="px-5 py-5 space-y-5">
              <div>
                <p className="eyebrow mb-2.5">Practice areas</p>
                <div className="grid grid-cols-2 gap-x-4 gap-y-1.5">
                  {areas.slice(0, 12).map((a) => (
                    <Link key={a.slug} href={`/${a.slug}`} onClick={() => setMobile(false)}
                      className="text-[13px] text-paper-300 py-1">{a.name}</Link>
                  ))}
                </div>
              </div>
              <div>
                <p className="eyebrow mb-2.5">States</p>
                <div className="grid grid-cols-2 gap-x-4 gap-y-1.5">
                  {STATES.map((s) => (
                    <Link key={s.slug} href={`/lawyers/${s.slug}`} onClick={() => setMobile(false)}
                      className="text-[13px] text-paper-300 py-1">{s.name}</Link>
                  ))}
                </div>
              </div>
              <div className="flex gap-2.5 pt-1">
                <Link href="/guides" onClick={() => setMobile(false)} className="btn btn-ghost flex-1">Guides</Link>
                <Link href="/list-your-firm" onClick={() => setMobile(false)} className="btn btn-ghost flex-1">For lawyers</Link>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
}

function SearchIcon() {
  return (
    <svg width="15" height="15" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.6">
      <circle cx="7" cy="7" r="4.75" />
      <path d="m10.5 10.5 3 3" strokeLinecap="round" />
    </svg>
  );
}
