"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useRouter } from "next/navigation";
import { money, cx } from "@/lib/format";
import { EXCLUSIVE_PLAN, INCLUDED, MAX_QTY, type Addon, type AddonSelection } from "@/lib/addon-types";

interface PlanLite { code: string; name: string; monthly_price: number; yearly_price: number }

export interface Billing {
  interval: "month" | "year";
  extra_suburb: number;
  team_profile: number;
  exclusive: string | null;
  cancelling: boolean;
}

interface Pending { label: string; cost: string; body: { plan_code?: string; addons?: AddonSelection } }

/** Plan, add-ons and billing for one listing. Every paid change is confirmed first. */
export default function PlanPanel({
  listingId, suburb, planCode, isFounder, plans, addons, areas, billing,
}: {
  listingId: string;
  suburb: string | null;
  planCode: string | null;
  isFounder: boolean;
  plans: PlanLite[];
  addons: Addon[];
  areas: { slug: string; name: string }[];
  billing: Billing | null;
}) {
  const router = useRouter();
  const [pending, setPending] = useState<Pending | null>(null);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const [taken, setTaken] = useState<string[]>([]);
  const [pick, setPick] = useState("");

  useEffect(() => {
    fetch(`/api/exclusive?listing=${listingId}`).then((r) => r.json())
      .then((j) => setTaken(j.taken ?? [])).catch(() => undefined);
  }, [listingId]);

  if (!billing || !planCode) return null;
  const yearly = billing.interval === "year";
  const per = yearly ? "/yr" : "/mo";
  const plan = plans.find((p) => p.code === planCode);
  const other = plans.find((p) => p.code !== planCode);
  const priceOf = (p: PlanLite) => (yearly ? p.yearly_price : p.monthly_price);
  const addon = (code: string) => addons.find((a) => a.code === code);
  const addonPrice = (code: string) => { const a = addon(code); return a ? (yearly ? a.yearly_price : a.monthly_price) : 0; };
  const included = INCLUDED[planCode] ?? { suburbs: 0, team: 0 };

  async function apply() {
    if (!pending) return;
    setBusy(true); setMsg(null);
    const r = await fetch("/api/billing/change", {
      method: "POST", headers: { "content-type": "application/json" },
      body: JSON.stringify({ listing_id: listingId, ...pending.body }),
    }).catch(() => null);
    const j = await r?.json().catch(() => ({}));
    setBusy(false); setPending(null);
    if (!r?.ok) return setMsg({ ok: false, text: j?.error ?? "Could not make that change. Nothing was charged." });
    setMsg({ ok: true, text: "Done. Your listing is updated." });
    router.refresh();
  }

  async function portal() {
    setBusy(true); setMsg(null);
    const r = await fetch("/api/billing/portal", {
      method: "POST", headers: { "content-type": "application/json" },
      body: JSON.stringify({ listing_id: listingId }),
    }).catch(() => null);
    const j = await r?.json().catch(() => ({}));
    if (r?.ok && j.url) window.location.href = j.url;
    else { setBusy(false); setMsg({ ok: false, text: j?.error ?? "Could not open billing." }); }
  }

  const stepper = (code: "extra_suburb" | "team_profile", title: string, blurb: string, have: number, incl: number) => (
    <div className="rounded-[var(--radius-card)] border border-white/[0.07] bg-white/[0.015] px-5 py-4 flex items-center justify-between gap-4 flex-wrap">
      <div className="max-w-[420px]">
        <p className="text-[13.5px] font-medium">{title}</p>
        <p className="text-[12.5px] text-paper-500 mt-1">
          {blurb} {incl > 0 ? `Your plan includes ${incl}.` : ""} You have bought {have}.
        </p>
      </div>
      <div className="flex items-center gap-2.5">
        <span className="text-[12.5px] tabular text-paper-400">{money(addonPrice(code))}{per} each</span>
        <button type="button" disabled={have === 0 || busy}
          onClick={() => setPending({ label: `Remove one: ${title.toLowerCase()}`, cost: "Credited against your next invoice.", body: { addons: { [code]: have - 1 } } })}
          className="btn btn-ghost !py-1.5 !px-3 !text-[12.5px] disabled:opacity-40">Remove one</button>
        <button type="button" disabled={have >= MAX_QTY[code] || busy}
          onClick={() => setPending({ label: `Add one: ${title.toLowerCase()}`, cost: `${money(addonPrice(code))}${per}, charged now pro rata to your card on file.`, body: { addons: { [code]: have + 1 } } })}
          className="btn btn-primary !py-1.5 !px-3 !text-[12.5px] disabled:opacity-40">Add one</button>
      </div>
    </div>
  );

  return (
    <div className="mb-8">
      <div className="flex items-center justify-between gap-4 flex-wrap mb-3">
        <p className="eyebrow">Plan and add-ons</p>
        <button type="button" onClick={portal} disabled={busy} className="text-[12.5px] text-brand-400 hover:text-brand-200 disabled:opacity-50">
          Billing, invoices and cancellation →
        </button>
      </div>

      <div className="grid gap-2.5">
        <div className="rounded-[var(--radius-card)] border border-white/[0.07] bg-white/[0.015] px-5 py-4 flex items-center justify-between gap-4 flex-wrap">
          <div>
            <p className="text-[13.5px] font-medium flex items-center gap-2 flex-wrap">
              {plan?.name ?? planCode}, billed {yearly ? "yearly" : "monthly"}
              {isFounder && (
                <span className="text-[10px] uppercase tracking-[0.1em] px-2 py-0.5 rounded border border-gold-500/40 text-gold-300">Founding firm</span>
              )}
            </p>
            <p className="text-[12.5px] text-paper-500 mt-1">
              {billing.cancelling
                ? "Set to cancel at the end of the period you have paid for."
                : planCode === "verified" && other
                  ? `Featured ranks you above every Verified firm, with 8 practice areas, 2 extra suburbs and 3 lawyer profiles.`
                  : "You are on our top plan."}
            </p>
          </div>
          {other && !billing.cancelling && (
            planCode === "verified" ? (
              <button type="button" disabled={busy}
                onClick={() => setPending({ label: `Upgrade to ${other.name}`, cost: `${money(priceOf(other))}${per} instead of ${money(plan ? priceOf(plan) : 0)}${per}. The difference for the rest of this period is charged now.`, body: { plan_code: other.code } })}
                className="btn btn-primary btn-shine !py-2 !px-4 !text-[12.5px]">Upgrade to {other.name}</button>
            ) : (
              <button type="button" disabled={busy || Boolean(billing.exclusive)}
                title={billing.exclusive ? "Remove Suburb Exclusive first" : undefined}
                onClick={() => setPending({ label: `Move down to ${other.name}`, cost: "The unused part of Featured is credited against your next invoice. Extra suburbs and lawyer profiles above the Verified allowance are hidden.", body: { plan_code: other.code } })}
                className="btn btn-ghost !py-2 !px-4 !text-[12.5px] disabled:opacity-40">Move down to {other.name}</button>
            )
          )}
        </div>

        {addon("exclusive") && (
          <div className={cx("rounded-[var(--radius-card)] border px-5 py-4",
            billing.exclusive ? "border-gold-500/50 bg-gold-500/[0.06]" : "border-white/[0.07] bg-white/[0.015]")}>
            <div className="flex items-start justify-between gap-4 flex-wrap">
              <div className="max-w-[520px]">
                <p className="text-[13.5px] font-medium"><span className="text-gold-400">★</span> Suburb Exclusive</p>
                <p className="text-[12.5px] text-paper-500 mt-1">
                  {billing.exclusive
                    ? `You hold the number one position for ${areas.find((a) => a.slug === billing.exclusive)?.name ?? billing.exclusive} in ${suburb ?? "your suburb"}. No other firm can buy it while you do.`
                    : `Hold the number one position for one practice area in ${suburb ?? "your suburb"}. One firm only.`}
                </p>
              </div>
              {billing.exclusive ? (
                <button type="button" disabled={busy}
                  onClick={() => setPending({ label: "Give up Suburb Exclusive", cost: "The position opens to other firms straight away. The unused part is credited against your next invoice.", body: { addons: { exclusive: null } } })}
                  className="btn btn-ghost !py-1.5 !px-3 !text-[12.5px]">Give it up</button>
              ) : planCode === EXCLUSIVE_PLAN ? (
                <div className="flex items-center gap-2.5 flex-wrap">
                  <select value={pick} onChange={(e) => setPick(e.target.value)} aria-label="Practice area to lock"
                    className="rounded-lg bg-white/[0.04] edge px-3 py-2 text-[12.5px] text-paper-100 outline-none">
                    <option value="">Choose a practice area</option>
                    {areas.map((a) => (
                      <option key={a.slug} value={a.slug} disabled={taken.includes(a.slug)}>
                        {a.name}{taken.includes(a.slug) ? " (taken)" : ""}
                      </option>
                    ))}
                  </select>
                  <button type="button" disabled={!pick || busy}
                    onClick={() => setPending({ label: `Lock ${areas.find((a) => a.slug === pick)?.name} in ${suburb ?? "your suburb"}`, cost: `${money(addonPrice("exclusive"))}${per}, charged now pro rata to your card on file.`, body: { addons: { exclusive: pick } } })}
                    className="btn btn-primary !py-1.5 !px-3 !text-[12.5px] disabled:opacity-40">
                    Lock it, {money(addonPrice("exclusive"))}{per}
                  </button>
                </div>
              ) : (
                <span className="text-[12.5px] text-paper-500">Available with Featured</span>
              )}
            </div>
          </div>
        )}

        {addon("extra_suburb") && stepper("extra_suburb", "Extra suburbs", "Appear on more suburb pages.", billing.extra_suburb, included.suburbs)}
        {addon("team_profile") && stepper("team_profile", "Lawyer profiles", "An individual page for each lawyer.", billing.team_profile, included.team)}
      </div>

      {msg && <p className={cx("text-[12.5px] mt-3", msg.ok ? "text-brand-200" : "text-red-400")}>{msg.text}</p>}

      <AnimatePresence>
        {pending && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-[80] bg-black/70 backdrop-blur-sm grid place-items-center p-5"
            onClick={() => !busy && setPending(null)}
          >
            <motion.div
              initial={{ scale: 0.94, y: 10 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.96 }}
              onClick={(e) => e.stopPropagation()}
              role="dialog" aria-modal="true"
              className="surface rounded-2xl p-7 max-w-[460px] w-full bg-ink-850"
            >
              <p className="text-[16px] font-medium">{pending.label}?</p>
              <p className="text-[13px] leading-relaxed text-paper-400 mt-3">{pending.cost}</p>
              <div className="flex gap-2.5 mt-6">
                <button type="button" onClick={apply} disabled={busy} className="btn btn-primary flex-1 disabled:opacity-60">
                  {busy ? "Working…" : "Confirm"}
                </button>
                <button type="button" onClick={() => setPending(null)} disabled={busy} className="btn btn-ghost flex-1">Cancel</button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
