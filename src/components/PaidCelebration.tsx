"use client";

import { motion } from "framer-motion";

/** The tick that draws itself on the payment-received page. */
export default function PaidCelebration() {
  return (
    <div className="relative size-20 mb-7" aria-hidden>
      {[0, 0.35].map((d) => (
        <span
          key={d}
          className="absolute inset-0 rounded-full border border-brand-400/60"
          style={{ animation: `pop-ring 1.6s ${d}s ease-out 2 both` }}
        />
      ))}
      <motion.div
        initial={{ scale: 0, rotate: -30 }}
        animate={{ scale: 1, rotate: 0 }}
        transition={{ type: "spring", stiffness: 260, damping: 16 }}
        className="absolute inset-0 rounded-full bg-brand-500 grid place-items-center shadow-[0_18px_60px_-14px_rgba(63,116,255,.8)]"
      >
        <svg width="34" height="34" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.6">
          <motion.path
            d="M5 12.5 10 17.5 19 7"
            strokeLinecap="round" strokeLinejoin="round"
            initial={{ pathLength: 0 }} animate={{ pathLength: 1 }}
            transition={{ delay: 0.35, duration: 0.5, ease: "easeOut" }}
          />
        </svg>
      </motion.div>
    </div>
  );
}
