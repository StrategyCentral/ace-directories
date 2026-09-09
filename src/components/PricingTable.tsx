"use client";

import { useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import type { Plan } from "@/lib/types";
import { cx, money } from "@/lib/format";

export default function PricingTable({ plans }: { plans: Plan[] }) {
  const [yearly, setYearly] = useState(true);

  return (
    <div>
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

      <div className="mt-9 grid gap-3 lg:grid-cols-2 xl:grid-cols-4">
        {plans.map((p) => {
          const price = yearly ? p.yearly_price : p.monthly_price;
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
                {money(price)}
                <span className="text-[13px] text-paper-600 font-sans"> {yearly ? "/yr" : "/mo"}</span>
              </p>
              <p className="text-[11.5px] text-paper-600 mt-1">
                + GST · {yearly ? `${money(Math.round(price / 12))} a month, billed yearly` : "billed monthly"}
              </p>

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
                className={cx("btn w-full mt-6 !text-[13px]", p.is_popular ? "btn-gold" : "btn-ghost")}
              >
                Choose {p.name}
              </Link>
            </div>
          );
        })}
      </div>

      <p className="text-[12px] text-paper-600 mt-6 text-center max-w-[620px] mx-auto">
        Prices in AUD, excluding GST. No setup fee, no minimum term. Existing legacy listings can
        be claimed and upgraded — new firms start on a paid plan.
      </p>
    </div>
  );
}
