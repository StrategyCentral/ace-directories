"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

interface Sub { id: string; name: string; state: string; postcode?: string | null }

/** Choose the extra suburbs a listing appears in, up to the plan's allowance. */
export default function SuburbsPanel({
  listingId, home, allowance, initial,
}: { listingId: string; home: string | null; allowance: number; initial: Sub[] }) {
  const router = useRouter();
  const [chosen, setChosen] = useState<Sub[]>(initial);
  const [q, setQ] = useState("");
  const [hits, setHits] = useState<Sub[]>([]);
  const [msg, setMsg] = useState<string | null>(null);

  useEffect(() => {
    if (q.trim().length < 2) { setHits([]); return; }
    const t = setTimeout(() => {
      fetch(`/api/suburbs?q=${encodeURIComponent(q.trim())}`).then((r) => r.json()).then(setHits).catch(() => setHits([]));
    }, 200);
    return () => clearTimeout(t);
  }, [q]);

  async function save(next: Sub[]) {
    setMsg(null);
    const r = await fetch("/api/listing/suburbs", {
      method: "PUT", headers: { "content-type": "application/json" },
      body: JSON.stringify({ listing_id: listingId, suburb_ids: next.map((s) => s.id) }),
    }).catch(() => null);
    const j = await r?.json().catch(() => ({}));
    if (!r?.ok) return setMsg(j?.error ?? "Could not save");
    setChosen(next); setQ(""); setHits([]);
    router.refresh();
  }

  if (allowance === 0) return null;
  const full = chosen.length >= allowance;

  return (
    <div className="mb-8">
      <p className="eyebrow mb-3">Suburbs you appear in</p>
      <div className="rounded-[var(--radius-card)] border border-white/[0.07] bg-white/[0.015] p-5">
        <p className="text-[12.5px] text-paper-500">
          {chosen.length} of {allowance} extra suburb{allowance === 1 ? "" : "s"} used, on top of {home ?? "your home suburb"}.
        </p>
        <div className="flex flex-wrap gap-2 mt-3.5">
          {home && <span className="text-[12.5px] px-3 py-1.5 rounded-full border border-white/[0.1] text-paper-400">{home} · home</span>}
          {chosen.map((s) => (
            <span key={s.id} className="text-[12.5px] px-3 py-1.5 rounded-full border border-brand-500/45 bg-brand-500/[0.08] text-paper-100 flex items-center gap-2">
              {s.name}, {s.state}
              <button type="button" aria-label={`Remove ${s.name}`} onClick={() => save(chosen.filter((c) => c.id !== s.id))} className="text-paper-500 hover:text-red-400">×</button>
            </span>
          ))}
        </div>
        {!full && (
          <div className="relative mt-4 max-w-[360px]">
            <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Add a suburb"
              className="w-full rounded-lg bg-white/[0.03] edge px-3 py-2.5 text-[13.5px] text-paper-100 outline-none focus:border-brand-500/60" />
            {hits.length > 0 && (
              <ul className="absolute z-10 left-0 right-0 mt-1 rounded-lg edge bg-ink-800 overflow-hidden">
                {hits.filter((h) => !chosen.some((c) => c.id === h.id)).map((h) => (
                  <li key={h.id}>
                    <button type="button" onClick={() => save([...chosen, h])}
                      className="w-full text-left px-3 py-2 text-[13px] text-paper-200 hover:bg-white/[0.06]">
                      {h.name}, {h.state} {h.postcode ?? ""}
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>
        )}
        {msg && <p className="text-[12.5px] text-red-400 mt-3">{msg}</p>}
      </div>
    </div>
  );
}
