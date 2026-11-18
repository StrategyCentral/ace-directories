"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { money } from "@/lib/format";

/**
 * Shown once, straight after payment. The card is already on file, so saying
 * yes is a single click: no second checkout. The price is stated on the button.
 */
export default function OneClickUpsell({
  listingId, kind, price, per, suburb, areas,
}: {
  listingId: string;
  kind: "featured" | "exclusive";
  price: number;
  per: "/mo" | "/yr";
  suburb: string | null;
  areas: { slug: string; name: string }[];
}) {
  const [pick, setPick] = useState(areas[0]?.slug ?? "");
  const [state, setState] = useState<"idle" | "busy" | "done" | "no">("idle");
  const [error, setError] = useState<string | null>(null);

  async function accept() {
    setState("busy"); setError(null);
    const body = kind === "featured" ? { plan_code: "featured" } : { addons: { exclusive: pick } };
    // The subscription can take a few seconds to land after payment; retry briefly.
    for (let i = 0; i < 4; i++) {
      const r = await fetch("/api/billing/change", {
        method: "POST", headers: { "content-type": "application/json" },
        body: JSON.stringify({ listing_id: listingId, ...body }),
      }).catch(() => null);
      const j = await r?.json().catch(() => ({}));
      if (r?.ok) { setState("done"); return; }
      if (!/No active subscription/.test(j?.error ?? "")) { setError(j?.error ?? "Could not add that"); setState("idle"); return; }
      await new Promise((res) => setTimeout(res, 2500));
    }
    setError("Your payment is still being confirmed. You can add this from your dashboard in a minute.");
    setState("idle");
  }

  if (state === "no") return null;
  if (state === "done") {
    return (
      <motion.div initial={{ scale: 0.97, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
        className="rounded-2xl border border-gold-500/50 bg-gold-500/[0.08] p-6 max-w-[720px] mb-6">
        <p className="text-[15px] font-medium text-gold-300">Done. {kind === "featured" ? "You're on Featured." : `You hold ${areas.find((a) => a.slug === pick)?.name} in ${suburb}.`}</p>
        <p className="text-[13px] text-paper-400 mt-1.5">It shows on your public page within a few seconds. Stripe will email the receipt.</p>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ y: 14, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.5 }}
      className="founder-banner rounded-2xl p-6 md:p-8 max-w-[720px] mb-6 text-left"
    >
      <p className="text-[11px] tracking-[0.28em] uppercase text-gold-300">One-time offer, before you go</p>
      <h2 className="display text-[clamp(1.6rem,3.4vw,2.3rem)] mt-2.5 founder-title">
        {kind === "featured" ? "Jump the queue with Featured" : `Own ${suburb ?? "your suburb"} before a competitor does`}
      </h2>
      <p className="text-[13.5px] leading-relaxed text-paper-300 mt-3">
        {kind === "featured"
          ? "Sit above every Verified firm, in a larger gold card, across 8 practice areas, 2 extra suburbs and 3 lawyer profiles. Your founding discount carries over."
          : `Suburb Exclusive puts you first for one practice area in ${suburb ?? "your suburb"}, and only one firm can hold it. Once someone else takes it, it's gone.`}
      </p>
      {kind === "exclusive" && (
        <select value={pick} onChange={(e) => setPick(e.target.value)} aria-label="Practice area"
          className="mt-4 rounded-lg bg-white/[0.05] edge px-3 py-2.5 text-[13.5px] text-paper-100 outline-none">
          {areas.map((a) => <option key={a.slug} value={a.slug}>{a.name}</option>)}
        </select>
      )}
      {error && <p className="text-[12.5px] text-red-400 mt-3">{error}</p>}
      <div className="flex flex-wrap items-center gap-3 mt-5">
        <button onClick={accept} disabled={state === "busy" || (kind === "exclusive" && !pick)} className="btn btn-primary btn-shine disabled:opacity-60">
          {state === "busy" ? "Adding…" : `Yes, add it: ${kind === "featured" ? "upgrade" : `+${money(price)}${per}`}`}
        </button>
        <button onClick={() => setState("no")} className="text-[12.5px] text-paper-500 hover:text-paper-300">No thanks</button>
      </div>
      <p className="text-[11.5px] text-paper-600 mt-3">
        Charged now, pro rata, to the card you just used. Remove it from your dashboard any time.
      </p>
    </motion.div>
  );
}
