"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { money } from "@/lib/format";

/**
 * Lets a firm put its own numbers in. We supply no figures of our own beyond
 * the plan price: the fee is whatever they say a typical new matter is worth.
 */
export default function ValueCalculator({
  plans,
}: { plans: { code: string; name: string; yearly_price: number; monthly_price: number }[] }) {
  const [fee, setFee] = useState(2500);
  const [code, setCode] = useState(plans.find((p) => p.code === "featured")?.code ?? plans[0]?.code);
  const plan = plans.find((p) => p.code === code) ?? plans[0];
  if (!plan) return null;

  const yearCost = plan.yearly_price / 100;
  const monthsCovered = Math.floor(fee / (plan.monthly_price / 100));
  const clientsToBreakEven = Math.max(1, Math.ceil(yearCost / fee));

  return (
    <div className="surface rounded-2xl p-6 md:p-9">
      <div className="grid gap-8 md:grid-cols-2 md:items-center">
        <div>
          <p className="eyebrow">Run your own numbers</p>
          <h2 className="display text-[clamp(1.5rem,2.8vw,2.1rem)] mt-3">What is one new client worth to you?</h2>

          <label className="block mt-7">
            <span className="flex justify-between text-[12.5px] text-paper-500">
              <span>Your typical fee for one new matter</span>
              <span className="text-paper-100 tabular text-[15px]">{money(fee * 100)}</span>
            </span>
            <input
              type="range" min={500} max={15000} step={250} value={fee}
              onChange={(e) => setFee(Number(e.target.value))}
              className="w-full mt-3 accent-[var(--color-brand-500)]"
              aria-label="Typical fee for one new matter"
            />
          </label>

          <div className="flex gap-2 mt-5">
            {plans.map((p) => (
              <button
                key={p.code}
                type="button"
                onClick={() => setCode(p.code)}
                className={
                  "rounded-full px-4 py-1.5 text-[12.5px] border transition-colors " +
                  (p.code === plan.code
                    ? "border-brand-500/70 bg-brand-500/[0.12] text-paper-100"
                    : "border-white/[0.1] text-paper-500 hover:text-paper-200")
                }
              >
                {p.name}
              </button>
            ))}
          </div>
        </div>

        <div className="rounded-[var(--radius-card)] border border-gold-500/30 bg-gold-500/[0.06] p-6 md:p-7">
          <p className="text-[12.5px] text-gold-300">One new client at {money(fee * 100)} pays for</p>
          <p className="display text-[clamp(2.4rem,5vw,3.6rem)] mt-1 tabular overflow-hidden">
            <AnimatePresence mode="popLayout" initial={false}>
              <motion.span
                key={monthsCovered}
                initial={{ y: 26, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                exit={{ y: -26, opacity: 0 }}
                transition={{ duration: 0.3 }}
                className="inline-block"
              >
                {monthsCovered}
              </motion.span>
            </AnimatePresence>
            <span className="text-[18px] text-paper-300 font-sans"> months of {plan.name}</span>
          </p>
          <p className="text-[13px] leading-relaxed text-paper-400 mt-4">
            {plan.name} is {money(plan.yearly_price)} for the year.{" "}
            {clientsToBreakEven === 1
              ? "A single new client from your ALD listing covers the whole year."
              : `${clientsToBreakEven} new clients from your ALD listing cover the whole year.`}{" "}
            Everything after that is yours.
          </p>
          <p className="text-[11.5px] text-paper-600 mt-4">
            This is arithmetic on your own figure, not a promise of enquiries. Results depend on your
            suburb, your practice areas and how complete your profile is.
          </p>
        </div>
      </div>
    </div>
  );
}
