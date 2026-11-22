"use client";

import { motion } from "framer-motion";
import type { Founder } from "@/lib/addon-types";
import { money } from "@/lib/format";

/**
 * The founding-firm offer. Big, gold and impossible to miss. Every number on it
 * comes from the live Stripe coupon, so "places left" is always true.
 */
export default function FounderBanner({
  founder, featuredMonthly, compact = false,
}: { founder: Founder | null; featuredMonthly?: number; compact?: boolean }) {
  if (!founder?.active) return null;
  const taken = founder.cap - founder.remaining;
  const pct = founder.cap ? Math.max(3, Math.round((taken / founder.cap) * 100)) : 0;
  const years = Math.round(founder.months / 12);
  const pad = (n: number) => String(n).padStart(founder.cap >= 100 ? 3 : 2, "0");
  const tiles: [string, string][] = [
    [pad(founder.remaining), "places left"],
    [`${founder.percent}%`, "off your plan"],
    [String(founder.months), "months locked"],
  ];

  return (
    <motion.section
      initial={{ opacity: 0, y: 16, scale: 0.985 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
      className={"founder-banner rounded-2xl text-center " + (compact ? "px-5 py-6" : "px-6 py-10 md:py-14")}
      aria-label="Founding firm offer"
    >
      <p className="text-[11px] tracking-[0.32em] uppercase text-gold-300/90">First {founder.cap} firms only</p>
      <h2 className={"founder-title display leading-[0.95] mt-3 " + (compact ? "text-[clamp(1.9rem,6vw,2.6rem)]" : "text-[clamp(2.6rem,8vw,5.2rem)]")}>
        Founding Firm<br />{founder.percent}% Off
      </h2>
      <p className={"text-paper-300 mx-auto mt-4 max-w-[560px] " + (compact ? "text-[13px]" : "text-[14.5px]")}>
        Your plan at {100 - founder.percent}% of the price for your first {years} years.
        {featuredMonthly ? ` Featured is ${money(Math.round(featuredMonthly * (100 - founder.percent) / 100))} a month instead of ${money(featuredMonthly)}.` : ""}
        {" "}Applied at checkout, no code needed.
      </p>

      <div className={"flex justify-center gap-2.5 md:gap-4 " + (compact ? "mt-5" : "mt-8")}>
        {tiles.map(([v, l], i) => (
          <motion.div
            key={l}
            initial={{ opacity: 0, y: 12, rotateX: -60 }}
            animate={{ opacity: 1, y: 0, rotateX: 0 }}
            transition={{ delay: 0.25 + i * 0.12, type: "spring", stiffness: 220, damping: 18 }}
            className={"founder-tile rounded-xl " + (compact ? "px-3.5 py-2.5 min-w-[78px]" : "px-5 py-4 min-w-[104px] md:min-w-[128px]")}
          >
            <p className={"display tabular text-paper-100 leading-none " + (compact ? "text-[26px]" : "text-[clamp(2rem,5vw,3.2rem)]")}>{v}</p>
            <p className="text-[10px] tracking-[0.18em] uppercase text-gold-300/80 mt-2">{l}</p>
          </motion.div>
        ))}
      </div>

      <div className={"mx-auto max-w-[440px] " + (compact ? "mt-5" : "mt-8")}>
        <div className="founder-bar h-2 rounded-full bg-white/[0.08] overflow-hidden">
          <motion.span
            className="block h-full rounded-full"
            initial={{ width: 0 }}
            animate={{ width: `${pct}%` }}
            transition={{ delay: 0.6, duration: 1.2, ease: [0.16, 1, 0.3, 1] }}
          />
        </div>
        <p className="text-[11.5px] text-paper-500 mt-2.5">
          {taken === 0 ? "Be one of the first. " : `${taken} of ${founder.cap} claimed. `}
          After {founder.months} months your plan continues at the standard price. Cancel any time.
        </p>
      </div>
    </motion.section>
  );
}
