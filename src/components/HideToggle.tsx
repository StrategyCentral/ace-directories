"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { useRouter } from "next/navigation";

/** Lets a firm take its own page out of the directory and put it back. */
export default function HideToggle({ listingId, hidden }: { listingId: string; hidden: boolean }) {
  const router = useRouter();
  const [isHidden, setHidden] = useState(hidden);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function flip() {
    const next = !isHidden;
    setBusy(true);
    setError(null);
    const r = await fetch("/api/listing/update", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ listing_id: listingId, hidden: next }),
    }).catch(() => null);
    setBusy(false);
    if (!r?.ok) return setError("Could not change that. Try again.");
    setHidden(next);
    router.refresh();
  }

  return (
    <div
      className={
        "rounded-[var(--radius-card)] border px-5 py-4 mb-6 flex items-center justify-between gap-5 flex-wrap transition-colors " +
        (isHidden ? "border-gold-500/40 bg-gold-500/[0.06]" : "border-white/[0.07] bg-white/[0.015]")
      }
    >
      <div className="min-w-0">
        <p className="text-[13.5px] font-medium">
          {isHidden ? "This listing is hidden" : "This listing is live"}
        </p>
        <p className="text-[12.5px] text-paper-500 mt-1 max-w-[560px]">
          {isHidden
            ? "Nobody can find or open your page. Your profile, reviews and plan are untouched, and billing continues. Switch it back on whenever you like."
            : "Hide it to take your page out of search and every suburb page, for example while you are on leave or not taking new matters."}
        </p>
        {error && <p className="text-[12.5px] text-red-400 mt-1.5">{error}</p>}
      </div>
      <button
        type="button"
        role="switch"
        aria-checked={!isHidden}
        aria-label="Listing visible to the public"
        onClick={flip}
        disabled={busy}
        className="flex items-center gap-3 text-[12.5px] text-paper-400 disabled:opacity-60"
      >
        <span>{isHidden ? "Hidden" : "Visible"}</span>
        <span
          className={
            "relative w-11 h-6 rounded-full p-0.5 flex transition-colors " +
            (isHidden ? "bg-white/[0.1] justify-start" : "bg-brand-500 justify-end")
          }
        >
          <motion.span layout transition={{ type: "spring", stiffness: 520, damping: 34 }} className="size-5 rounded-full bg-white" />
        </span>
      </button>
    </div>
  );
}
