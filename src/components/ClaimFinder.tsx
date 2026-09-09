"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { AnimatePresence, motion } from "framer-motion";
import { STATES } from "@/lib/site";

interface Hit {
  slug: string;
  name: string;
  suburb: string | null;
  state: string | null;
  phone: string | null;
  claimed: boolean;
}

export default function ClaimFinder() {
  const [q, setQ] = useState("");
  const [state, setState] = useState("");
  const [hits, setHits] = useState<Hit[]>([]);
  const [total, setTotal] = useState(0);
  const [busy, setBusy] = useState(false);
  const [searched, setSearched] = useState(false);

  useEffect(() => {
    if (q.trim().length < 2) {
      setHits([]);
      setSearched(false);
      return;
    }
    const ctrl = new AbortController();
    setBusy(true);
    const id = setTimeout(async () => {
      try {
        const res = await fetch(
          `/api/listings/search?q=${encodeURIComponent(q.trim())}${state ? `&state=${state}` : ""}`,
          { signal: ctrl.signal },
        );
        const json = await res.json();
        setHits(json.rows);
        setTotal(json.total);
        setSearched(true);
      } catch {
        /* aborted */
      } finally {
        setBusy(false);
      }
    }, 220);
    return () => { clearTimeout(id); ctrl.abort(); };
  }, [q, state]);

  return (
    <div>
      <div className="glass edge rounded-2xl p-2 flex flex-col sm:flex-row gap-2">
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Your firm name — e.g. Smith &amp; Associates"
          className="flex-1 bg-transparent outline-none px-4 py-3.5 text-[15px]
                     text-paper-100 placeholder:text-paper-600"
          autoFocus
        />
        <select
          value={state}
          onChange={(e) => setState(e.target.value)}
          className="bg-transparent outline-none px-4 py-3.5 text-[14px] text-paper-300
                     sm:border-l sm:border-white/[0.08]"
        >
          <option value="" className="bg-ink-900">All states</option>
          {STATES.map((s) => (
            <option key={s.code} value={s.code} className="bg-ink-900">{s.name}</option>
          ))}
        </select>
      </div>

      <AnimatePresence>
        {searched && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="mt-6"
          >
            <p className="text-[12.5px] text-paper-600 mb-3">
              {busy ? "Searching…" : `${total} match${total === 1 ? "" : "es"} for “${q.trim()}”`}
            </p>

            <div className="grid gap-2.5">
              {hits.map((h) => (
                <div key={h.slug} className="surface rounded-[var(--radius-card)] p-4 flex items-center gap-4 flex-wrap">
                  <div className="min-w-0 flex-1">
                    <p className="text-[14.5px] text-paper-100">{h.name}</p>
                    <p className="text-[12px] text-paper-600 mt-0.5">
                      {[h.suburb, h.state].filter(Boolean).join(", ")}
                      {h.phone && <span className="tabular"> · {h.phone}</span>}
                    </p>
                  </div>
                  {h.claimed ? (
                    <span className="text-[12px] text-paper-600">Already claimed</span>
                  ) : (
                    <Link href={`/claim/${h.slug}`} className="btn btn-gold !py-2 !px-4 !text-[12.5px]">
                      This is us →
                    </Link>
                  )}
                </div>
              ))}
            </div>

            {!busy && hits.length === 0 && (
              <div className="surface rounded-[var(--radius-card)] p-6">
                <p className="text-[14px] text-paper-300">We don&apos;t have that firm on file.</p>
                <p className="text-[13px] text-paper-500 mt-2">
                  New practices start on a paid plan — there&apos;s no free signup, which is how
                  we keep the directory free of ghost listings.
                </p>
                <Link href="/list-your-firm" className="btn btn-primary mt-4 !text-[13px]">
                  List your firm →
                </Link>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
