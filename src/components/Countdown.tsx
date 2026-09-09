"use client";

import { useEffect, useState } from "react";
import { timeLeft } from "@/lib/format";

export default function Countdown({
  expiresAt,
  compact = false,
}: {
  expiresAt: string;
  compact?: boolean;
}) {
  const [t, setT] = useState(() => timeLeft(expiresAt));

  useEffect(() => {
    const id = setInterval(() => setT(timeLeft(expiresAt)), 1000);
    return () => clearInterval(id);
  }, [expiresAt]);

  if (t.expired) {
    return (
      <p className="text-[13px] text-red-400">
        This claim window has closed.
      </p>
    );
  }

  const parts: [number, string][] = [
    [t.days, "days"],
    [t.hours, "hrs"],
    [t.minutes, "min"],
    [t.seconds, "sec"],
  ];

  const urgent = t.days === 0 && t.hours < 12;

  if (compact) {
    return (
      <span className={`tabular text-[13px] ${urgent ? "text-red-400" : "text-gold-300"}`}>
        {t.days}d {String(t.hours).padStart(2, "0")}h {String(t.minutes).padStart(2, "0")}m{" "}
        {String(t.seconds).padStart(2, "0")}s
      </span>
    );
  }

  return (
    <div className="flex gap-2">
      {parts.map(([value, label]) => (
        <div
          key={label}
          className={`flex-1 rounded-xl px-3 py-3 text-center border ${
            urgent
              ? "border-red-500/35 bg-red-500/[0.07]"
              : "border-gold-500/30 bg-gold-500/[0.06]"
          }`}
        >
          <p className={`display tabular text-[clamp(1.5rem,3.4vw,2.2rem)] ${urgent ? "text-red-300" : "text-gold-300"}`}>
            {String(value).padStart(2, "0")}
          </p>
          <p className="text-[10px] tracking-[0.14em] uppercase text-paper-600 mt-1">{label}</p>
        </div>
      ))}
    </div>
  );
}
