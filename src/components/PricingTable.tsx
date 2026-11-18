"use client";

import { useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import type { Plan } from "@/lib/types";
import { cx, money } from "@/lib/format";
import { sellFor } from "@/content/plans";
import { founderPrice, type Founder } from "@/lib/addon-types";

export default function PricingTable({ plans, founder = null }: { plans: Plan[]; founder?: Founder | null }) {
  const [yearly, setYearly] = useState(true);

  return (
    <div>
      {founder?.active && (
        <div className="mx-auto max-w-[920px] mb-7 rounded-2xl border border-gold-500/45 bg-gradient-to-r from-gold-500/[0.14] to-gold-500/[0.03]
                        px-6 py-5 flex items-center justify-between gap-5 flex-wrap">
          <div>
            <p className="text-[15.5px] font-medium text-gold-300">
              Founding firm rate: {founder.percent}% off for your first {Math.round(founder.months / 12)} years
            </p>
            <p className="text-[13px] text-paper-400 mt-1.5 max-w-[560px]">
              For the first {founder.cap} firms to claim their listing. Applied at checkout with no code. After {founder.months} months
              your plan continues at the standard price, and you can cancel any time before then.
            </p>
          </div>
          <p className="text-[12.5px] text-gold-300 tabular whitespace-nowrap">
            <span className="display text-[30px]">{founder.remaining}</span> of {founder.cap} left
          </p>
        </div>
      )}
      <div className="flex justify-center">
        <button
          type="button"
          onClick={() => setYearly((v) => !v)}
          className="flex items-center gap-3 text-[13px] text-paper-400 edge rounded-full px-4 py-2"
        >
          <span className={cx(!yearly && "text-paper-100")}>Monthly</span>
          <span className="relative w-10 h-5 rounded-full bg-white/[0.09] p-0.5 flex">
            <motion.span layout className="size-4 rounded-full bg-brand-500"
              style={{ marginLeft: yearly ? "auto" : 0 }} />
          </span>
          <span className={cx(yearly && "text-paper-100")}>
            Yearly <span className="text-gold-400">· 2 months free</span>
          </span>
        </button>
      </div>

      <div className={cx("mt-9 grid gap-3 mx-auto", plans.length <= 2 ? "md:grid-cols-2 max-w-[920px]" : "lg:grid-cols-2 xl:grid-cols-4")}>
        {plans.map((p) => {
          const listPrice = yearly ? p.yearly_price : p.monthly_price;
          const price = founderPrice(listPrice, founder);
          return (
            <div
              key={p.code}
              className={cx(
                "surface lift rounded-2xl p-6 flex flex-col relative overflow-hidden",
                p.is_popular && "border-gold-500/35 bg-gradient-to-b from-gold-500/[0.07] to-transparent",
              )}
            >
              {p.is_popular && (
                <span className="absolute top-0 right-0 text-[10px] tracking-[0.12em] uppercase
                                 bg-gold-500 text-[#1a1406] font-semibold px-3 py-1 rounded-bl-lg">
                  Most popular
                </span>
              )}

              <p className="text-[15px] font-medium">{p.name}</p>
              <p className="text-[12.5px] text-paper-500 mt-1.5 min-h-[34px]">{p.tagline}</p>

              <p className="display text-[clamp(2rem,3.4vw,2.6rem)] mt-5 tabular">
                {founder?.active && <s className="text-[0.5em] text-paper-600 mr-2 font-sans">{money(listPrice)}</s>}
                {money(price)}
                <span className="text-[13px] text-paper-600 font-sans"> {yearly ? "/yr" : "/mo"}</span>
              </p>
              <p className="text-[11.5px] text-paper-600 mt-1">
                {yearly ? `${money(Math.round(price / 12))} a month, billed yearly` : "billed monthly"}
              </p>

              {sellFor(p.code) && (
                <>
                  <p className="text-[13px] leading-relaxed text-paper-300 mt-5">{sellFor(p.code)!.pitch}</p>
                  <p className="mt-4 rounded-lg border border-gold-500/30 bg-gold-500/[0.07] px-3.5 py-2.5
                                text-[12.5px] leading-relaxed text-gold-300">
                    {sellFor(p.code)!.maths}
                  </p>
                </>
              )}

              <ul className="mt-6 space-y-2 text-[12.5px] text-paper-400 flex-1">
                {p.features.map((f) => (
                  <li key={f} className="flex gap-2.5">
                    <span className="text-brand-400 shrink-0 mt-px">✓</span>
                    <span>{f}</span>
                  </li>
                ))}
              </ul>

              <Link
                href="/claim"
                className={"btn btn-primary w-full mt-6 !text-[13px]"}
              >
                Choose {p.name}
              </Link>
            </div>
          );
        })}
      </div>

      <p className="text-[12px] text-paper-600 mt-6 text-center max-w-[620px] mx-auto">
        Prices in AUD. No setup fee, no minimum term. Cancel
        from your dashboard and billing stops at the end of the period.
      </p>
    </div>
  );
}
