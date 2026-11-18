"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import type { Plan } from "@/lib/types";
import { money, cx } from "@/lib/format";
import { assessEmail } from "@/lib/claim-domain";
import { sellFor } from "@/content/plans";
import { EXCLUSIVE_PLAN, MAX_QTY, founderPrice, type Addon, type Founder } from "@/lib/addon-types";

interface ListingLite {
  id: string;
  slug: string;
  name: string;
  suburb: string | null;
  state: string | null;
  phone: string | null;
  /** Hostnames that count as the firm's own mail. Hosts only — never the
      firm's actual email address, which has no business on the client. */
  firmHosts: string[];
}

interface ExistingClaim {
  id: string;
  status: string;
  /** Null until the claim is verified — that is when the clock starts. */
  expires_at: string | null;
  email: string;
  selected_plan: string | null;
  verification_level?: string;
}

export default function ClaimFlow({
  listing,
  plans,
  existingClaim,
  addons = [],
  founder = null,
  areas = [],
  cancelled = false,
}: {
  listing: ListingLite;
  plans: Plan[];
  existingClaim: ExistingClaim | null;
  addons?: Addon[];
  founder?: Founder | null;
  areas?: { slug: string; name: string }[];
  /** They opened Stripe and came back without paying. */
  cancelled?: boolean;
}) {
  const [step, setStep] = useState<1 | 2 | "sent">(
    existingClaim ? (existingClaim.expires_at ? 2 : "sent") : 1,
  );
  const [level, setLevel] = useState<string>("manual");
  const [claimId, setClaimId] = useState<string | null>(existingClaim?.id ?? null);
  const [yearly, setYearly] = useState(true);
  const [plan, setPlan] = useState<string>(existingClaim?.selected_plan ?? "featured");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [emailInput, setEmailInput] = useState("");

  // Order bumps: add-ons bought with the plan.
  const [exclusive, setExclusive] = useState("");
  const [extraSuburbs, setExtraSuburbs] = useState(0);
  const [teamProfiles, setTeamProfiles] = useState(0);
  const [taken, setTaken] = useState<string[]>([]);
  const [downsellSeen, setDownsellSeen] = useState(false);

  useEffect(() => {
    fetch(`/api/exclusive?listing=${listing.id}`)
      .then((r) => r.json()).then((j) => setTaken(j.taken ?? [])).catch(() => undefined);
  }, [listing.id]);

  // Suburb Exclusive only exists on Featured, so drop it if they move off.
  useEffect(() => { if (plan !== EXCLUSIVE_PLAN) setExclusive(""); }, [plan]);

  const addon = (code: string) => addons.find((a) => a.code === code);
  const addonPrice = (code: string) => {
    const a = addon(code);
    return a ? (yearly ? a.yearly_price : a.monthly_price) : 0;
  };
  const addonsTotal =
    (exclusive ? addonPrice("exclusive") : 0) +
    extraSuburbs * addonPrice("extra_suburb") +
    teamProfiles * addonPrice("team_profile");

  // Same function the API uses to decide, so the hint cannot promise one thing
  // and the server do another.
  const verdict = assessEmail(emailInput, listing.firmHosts);
  const expectedDomain = listing.firmHosts[0] ?? null;

  async function startClaim(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const f = new FormData(e.currentTarget);
    setBusy(true);
    setError(null);
    try {
      const res = await fetch("/api/claims/start", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          listing_id: listing.id,
          full_name: f.get("full_name"),
          email: f.get("email"),
          phone: f.get("phone"),
          role_at_firm: f.get("role_at_firm"),
        }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? "Could not start the claim");
      setClaimId(json.claim_id);
      setLevel(json.verification_level ?? "manual");
      setStep(json.needs_verification === false ? 2 : "sent");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setBusy(false);
    }
  }

  async function checkout() {
    if (!claimId) return;
    setBusy(true);
    setError(null);
    try {
      const res = await fetch("/api/checkout", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          claim_id: claimId,
          listing_id: listing.id,
          plan_code: plan,
          interval: yearly ? "year" : "month",
          addons: { exclusive: exclusive || null, extra_suburb: extraSuburbs, team_profile: teamProfiles },
        }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? "Could not start checkout");
      window.location.href = json.url;
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
      setBusy(false);
    }
  }

  return (
    <div className="space-y-4">
      <Steps step={step} />

      <AnimatePresence mode="wait">
        {step === "sent" ? (
          <motion.div
            key="sent"
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            className="surface rounded-2xl p-6 md:p-8"
          >
            <h2 className="text-[17px] font-medium">Check your inbox</h2>
            <p className="text-[13.5px] leading-relaxed text-paper-400 mt-3 max-w-[560px]">
              We&apos;ve sent a confirmation link. Click it and you&apos;ll come straight back
              here to choose a plan.
            </p>
            {level === "domain" ? (
              <p className="text-[13px] leading-relaxed text-paper-500 mt-4">
                Your email matches {listing.name}&apos;s own domain, so the listing is yours to
                take as soon as you confirm.
              </p>
            ) : (
              <p className="text-[13px] leading-relaxed text-paper-500 mt-4">
                That address isn&apos;t at the firm&apos;s own domain, so we&apos;ll do a quick
                manual check before handing over the page — usually within a business day.
                Nothing on the listing changes in the meantime.
              </p>
            )}
            <p className="text-[12px] text-paper-600 mt-5">
              Nothing happens to the listing until someone confirms an email address.
            </p>
          </motion.div>
        ) : step === 1 ? (
          <motion.form
            key="s1"
            onSubmit={startClaim}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -12 }}
            className="surface rounded-2xl p-6 md:p-8 space-y-4"
          >
            <div>
              <h2 className="text-[17px] font-medium">Confirm you act for this firm</h2>
              <p className="text-[13px] leading-relaxed text-paper-500 mt-2 max-w-[520px]">
                Use your work email. We&apos;ll send a link to confirm it&apos;s yours — that
                check is what stops anyone but your firm taking control of this page.
              </p>
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              <Input name="full_name" label="Your full name" required />
              <Input name="role_at_firm" label="Your role (e.g. Principal)" required />
              <Input
                name="email"
                label="Work email"
                type="email"
                required
                value={emailInput}
                onChange={(e) => setEmailInput(e.target.value)}
              />
              <Input name="phone" label="Direct phone" type="tel" />
            </div>

            <EmailHint verdict={verdict} expectedDomain={expectedDomain} />

            <label className="flex items-start gap-3 text-[12.5px] text-paper-500 pt-1">
              <input type="checkbox" required className="mt-0.5 accent-[var(--color-brand-500)]" />
              <span>I am authorised to manage {listing.name}&apos;s public listing.</span>
            </label>

            {error && <p className="text-[12.5px] text-red-400">{error}</p>}

            <button disabled={busy} className="btn btn-primary w-full disabled:opacity-60">
              {busy
                ? "Sending…"
                : verdict.reason !== "incomplete" && verdict.level === "manual"
                  ? "Send for manual review"
                  : "Email me a confirmation link"}
            </button>
          </motion.form>
        ) : (
          <motion.div
            key="s2"
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -12 }}
            className="space-y-4"
          >
            <div className="surface rounded-2xl p-6 md:p-8">
              <div className="flex items-start justify-between gap-4 flex-wrap">
                <div>
                  <h2 className="text-[17px] font-medium">Choose your plan</h2>
                  <p className="text-[13px] text-paper-500 mt-2">
                    Cancel any time. Your profile goes live the moment payment clears, and the
                    listing is held for you for 72 hours while you decide.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setYearly((v) => !v)}
                  className="flex items-center gap-2.5 text-[12.5px] text-paper-400"
                >
                  <span className={cx(!yearly && "text-paper-100")}>Monthly</span>
                  <span className="relative w-10 h-5.5 rounded-full bg-white/[0.09] p-0.5 flex">
                    <motion.span
                      layout
                      className="size-4.5 rounded-full bg-brand-500"
                      style={{ marginLeft: yearly ? "auto" : 0 }}
                    />
                  </span>
                  <span className={cx(yearly && "text-paper-100")}>
                    Yearly <span className="text-gold-400">· 2 months free</span>
                  </span>
                </button>
              </div>

              {founder?.active && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
                  className="mt-6 rounded-[var(--radius-card)] border border-gold-500/45 bg-gradient-to-r from-gold-500/[0.14] to-gold-500/[0.03] px-5 py-4
                             flex items-center justify-between gap-4 flex-wrap"
                >
                  <div>
                    <p className="text-[14px] font-medium text-gold-300">
                      Founding firm rate: {founder.percent}% off for your first {Math.round(founder.months / 12)} years
                    </p>
                    <p className="text-[12.5px] text-paper-400 mt-1">
                      For the first {founder.cap} firms to claim. It is applied at checkout, no code needed, and returns
                      to the standard price after {founder.months} months.
                    </p>
                  </div>
                  <p className="text-[12px] text-gold-300 tabular whitespace-nowrap">
                    <span className="text-[20px]">{founder.remaining}</span> of {founder.cap} places left
                  </p>
                </motion.div>
              )}

              {cancelled && !downsellSeen && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
                  className="mt-4 rounded-[var(--radius-card)] border border-brand-500/40 bg-brand-500/[0.07] px-5 py-4
                             flex items-center justify-between gap-4 flex-wrap"
                >
                  <div>
                    <p className="text-[14px] font-medium">Not ready to commit to that today?</p>
                    <p className="text-[12.5px] text-paper-400 mt-1">
                      Start on Verified, month to month. You can move up, or cancel, any time from your dashboard.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => { setPlan("verified"); setYearly(false); setExclusive(""); setExtraSuburbs(0); setTeamProfiles(0); setDownsellSeen(true); }}
                    className="btn btn-ghost !py-2 !px-4 !text-[12.5px]"
                  >
                    Switch me to Verified monthly
                  </button>
                </motion.div>
              )}

              <div className="mt-6 grid gap-3">
                {plans.map((p, idx) => {
                  const listPrice = yearly ? p.yearly_price : p.monthly_price;
                  const price = founderPrice(listPrice, founder);
                  const selected = plan === p.code;
                  const sell = sellFor(p.code);
                  const saving = p.monthly_price * 12 - p.yearly_price;
                  return (
                    <motion.div
                      key={p.code}
                      layout
                      initial={{ opacity: 0, y: 14 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.06 * idx, duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
                      whileHover={selected ? undefined : { y: -2 }}
                      role="radio"
                      aria-checked={selected}
                      tabIndex={0}
                      onClick={() => setPlan(p.code)}
                      onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); setPlan(p.code); } }}
                      className={cx(
                        "relative cursor-pointer text-left rounded-[var(--radius-card)] border p-5 md:p-6 transition-colors outline-none focus-visible:border-brand-400",
                        selected
                          ? "border-brand-500/70 bg-brand-500/[0.07] plan-glow"
                          : "border-white/[0.07] bg-white/[0.015] hover:border-white/[0.18]",
                      )}
                    >
                      <div className="flex items-start justify-between gap-4 flex-wrap">
                        <div className="flex items-start gap-3.5">
                          <span
                            className={cx(
                              "mt-0.5 size-5 rounded-full border grid place-items-center shrink-0 transition-colors",
                              selected ? "border-brand-400 bg-brand-500" : "border-white/20",
                            )}
                          >
                            {selected && (
                              <motion.svg
                                initial={{ scale: 0 }} animate={{ scale: 1 }}
                                transition={{ type: "spring", stiffness: 500, damping: 22 }}
                                width="10" height="10" viewBox="0 0 12 12" fill="none" stroke="#fff" strokeWidth="2.2"
                              >
                                <path d="M2.5 6.3 5 8.8l4.5-5.6" strokeLinecap="round" strokeLinejoin="round" />
                              </motion.svg>
                            )}
                          </span>
                          <div>
                            <p className="text-[15.5px] font-medium flex items-center gap-2 flex-wrap">
                              {p.name}
                              {p.is_popular && (
                                <span className="text-[10px] uppercase tracking-[0.1em] px-2 py-0.5 rounded
                                                 bg-gold-500 text-[#1a1406] font-semibold">
                                  Most popular
                                </span>
                              )}
                            </p>
                            <p className="text-[12.5px] text-paper-500 mt-1">{p.tagline}</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="text-[19px] tabular overflow-hidden h-[28px]">
                            <AnimatePresence mode="popLayout" initial={false}>
                              <motion.span
                                key={price}
                                initial={{ y: 16, opacity: 0 }}
                                animate={{ y: 0, opacity: 1 }}
                                exit={{ y: -16, opacity: 0 }}
                                transition={{ duration: 0.28 }}
                                className="inline-block"
                              >
                                {money(price)}
                              </motion.span>
                            </AnimatePresence>
                            <span className="text-paper-600 text-[12px]">{yearly ? " /yr" : " /mo"}</span>
                          </p>
                          <p className="text-[11.5px] mt-0.5 h-[16px]">
                            {founder?.active ? (
                              <span className="text-gold-400">
                                <s className="text-paper-600">{money(listPrice)}</s> founding rate
                              </span>
                            ) : yearly && saving > 0 ? (
                              <span className="text-gold-400">You save {money(saving)} a year</span>
                            ) : (
                              <span className="text-paper-600">billed monthly</span>
                            )}
                          </p>
                        </div>
                      </div>

                      <AnimatePresence initial={false}>
                        {selected && (
                          <motion.div
                            key="body"
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: "auto", opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
                            className="overflow-hidden"
                          >
                            {sell && (
                              <div className="pt-5">
                                <p className="text-[12px] text-brand-200">{sell.bestFor}</p>
                                <p className="text-[13.5px] leading-relaxed text-paper-300 mt-2.5 max-w-[640px]">
                                  {sell.pitch}
                                </p>
                                <ul className="mt-4 grid gap-2 sm:grid-cols-2">
                                  {sell.wins.map((w, i) => (
                                    <motion.li
                                      key={w}
                                      initial={{ opacity: 0, x: -8 }}
                                      animate={{ opacity: 1, x: 0 }}
                                      transition={{ delay: 0.12 + i * 0.07 }}
                                      className="flex gap-2.5 text-[13px] text-paper-100"
                                    >
                                      <span className="text-gold-400 shrink-0">★</span>
                                      {w}
                                    </motion.li>
                                  ))}
                                </ul>
                                <motion.p
                                  initial={{ opacity: 0, scale: 0.98 }}
                                  animate={{ opacity: 1, scale: 1 }}
                                  transition={{ delay: 0.45 }}
                                  className="mt-5 rounded-lg border border-gold-500/30 bg-gold-500/[0.07] px-4 py-3
                                             text-[13px] leading-relaxed text-gold-300"
                                >
                                  {sell.maths}
                                </motion.p>
                              </div>
                            )}
                            <p className="eyebrow mt-6 mb-3">Everything included</p>
                            <ul className="grid gap-1.5 sm:grid-cols-2 text-[12.5px] text-paper-400">
                              {p.features.map((f) => (
                                <li key={f} className="flex gap-2">
                                  <span className="text-brand-400">✓</span>
                                  {f}
                                </li>
                              ))}
                            </ul>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </motion.div>
                  );
                })}
              </div>

              {error && <p className="text-[12.5px] text-red-400 mt-4">{error}</p>}

              {addons.length > 0 && (
                <div className="mt-6">
                  <p className="eyebrow mb-3">Add to your plan</p>
                  <div className="grid gap-2.5">
                    {addon("exclusive") && (
                      <motion.div
                        layout
                        className={cx(
                          "rounded-[var(--radius-card)] border px-5 py-4 transition-colors",
                          exclusive ? "border-gold-500/60 bg-gold-500/[0.07]" : "border-dashed border-white/[0.14] bg-white/[0.015]",
                          plan !== EXCLUSIVE_PLAN && "opacity-60",
                        )}
                      >
                        <div className="flex items-start justify-between gap-4 flex-wrap">
                          <div className="max-w-[560px]">
                            <p className="text-[14px] font-medium flex items-center gap-2 flex-wrap">
                              <span className="text-gold-400">★</span> Suburb Exclusive
                              <span className="text-[10px] uppercase tracking-[0.1em] px-2 py-0.5 rounded border border-gold-500/40 text-gold-300">
                                One firm only
                              </span>
                            </p>
                            <p className="text-[12.5px] leading-relaxed text-paper-400 mt-1.5">
                              Hold the number one position for one practice area in {listing.suburb ?? "your suburb"}.
                              No other firm can appear above you on that page, and nobody else can buy it while you hold it.
                            </p>
                          </div>
                          <p className="text-[14px] tabular whitespace-nowrap">
                            +{money(addonPrice("exclusive"))}
                            <span className="text-paper-600 text-[12px]">{yearly ? " /yr" : " /mo"}</span>
                          </p>
                        </div>
                        {plan === EXCLUSIVE_PLAN ? (
                          <select
                            value={exclusive}
                            onChange={(e) => setExclusive(e.target.value)}
                            aria-label="Practice area to lock"
                            className="mt-3.5 w-full sm:w-auto rounded-lg bg-white/[0.04] edge px-3 py-2.5 text-[13px] text-paper-100 outline-none focus:border-gold-500/60"
                          >
                            <option value="">No thanks</option>
                            {areas.map((a) => (
                              <option key={a.slug} value={a.slug} disabled={taken.includes(a.slug)}>
                                {a.name}{taken.includes(a.slug) ? " (taken)" : ""}
                              </option>
                            ))}
                          </select>
                        ) : (
                          <p className="text-[12px] text-paper-500 mt-3">Available with Featured.</p>
                        )}
                      </motion.div>
                    )}

                    {([
                      ["extra_suburb", "Extra suburbs", "Appear on the pages of more suburbs you serve. You choose them in your dashboard.", extraSuburbs, setExtraSuburbs],
                      ["team_profile", "Lawyer profiles", "Give each lawyer their own profile page, linked to the firm and shown in search.", teamProfiles, setTeamProfiles],
                    ] as const).map(([code, title, blurb, qty, setQty]) =>
                      addon(code) ? (
                        <div
                          key={code}
                          className={cx(
                            "rounded-[var(--radius-card)] border px-5 py-4 flex items-center justify-between gap-4 flex-wrap transition-colors",
                            qty > 0 ? "border-brand-500/50 bg-brand-500/[0.06]" : "border-dashed border-white/[0.14] bg-white/[0.015]",
                          )}
                        >
                          <div className="max-w-[460px]">
                            <p className="text-[14px] font-medium">{title}</p>
                            <p className="text-[12.5px] leading-relaxed text-paper-400 mt-1">{blurb}</p>
                          </div>
                          <div className="flex items-center gap-4">
                            <p className="text-[13px] tabular text-paper-300 whitespace-nowrap">
                              {money(addonPrice(code))}<span className="text-paper-600 text-[12px]">{yearly ? " /yr" : " /mo"} each</span>
                            </p>
                            <div className="flex items-center rounded-lg edge overflow-hidden">
                              <button type="button" aria-label={`Fewer ${title}`} onClick={() => setQty(Math.max(0, qty - 1))}
                                className="px-3 py-1.5 text-paper-300 hover:bg-white/[0.06]">−</button>
                              <span className="w-8 text-center text-[13.5px] tabular">{qty}</span>
                              <button type="button" aria-label={`More ${title}`} onClick={() => setQty(Math.min(MAX_QTY[code], qty + 1))}
                                className="px-3 py-1.5 text-paper-300 hover:bg-white/[0.06]">+</button>
                            </div>
                          </div>
                        </div>
                      ) : null,
                    )}
                  </div>
                </div>
              )}

              {(() => {
                const chosen = plans.find((x) => x.code === plan) ?? plans[0];
                if (!chosen) return null;
                const total = founderPrice(yearly ? chosen.yearly_price : chosen.monthly_price, founder) + addonsTotal;
                return (
                  <motion.div
                    layout
                    className="mt-6 rounded-[var(--radius-card)] border border-white/[0.08] bg-white/[0.02] px-5 py-4
                               flex items-center justify-between gap-4 flex-wrap"
                  >
                    <div>
                      <p className="text-[13.5px] text-paper-100">
                        {chosen.name}{addonsTotal > 0 ? " plus add-ons" : ""}, billed {yearly ? "yearly" : "monthly"}
                        {founder?.active ? ` at the founding rate` : ""}
                      </p>
                      <p className="text-[12px] text-paper-500 mt-0.5">
                        Renews each {yearly ? "year" : "month"} until you cancel. No setup fee, no minimum term.
                      </p>
                    </div>
                    <p className="text-[22px] tabular">
                      <AnimatePresence mode="popLayout" initial={false}>
                        <motion.span
                          key={total}
                          initial={{ y: 14, opacity: 0 }}
                          animate={{ y: 0, opacity: 1 }}
                          exit={{ y: -14, opacity: 0 }}
                          transition={{ duration: 0.28 }}
                          className="inline-block"
                        >
                          {money(total)}
                        </motion.span>
                      </AnimatePresence>
                      <span className="text-paper-600 text-[12px]"> today</span>
                    </p>
                  </motion.div>
                );
              })()}

              <motion.button
                onClick={checkout}
                disabled={busy}
                whileHover={{ scale: busy ? 1 : 1.01 }}
                whileTap={{ scale: 0.985 }}
                className="btn btn-primary btn-shine w-full mt-4 !py-3.5 !text-[14.5px] disabled:opacity-70"
              >
                {busy ? (
                  <span className="flex items-center justify-center gap-2.5">
                    <span className="size-4 rounded-full border-2 border-white/30 border-t-white animate-spin" />
                    Opening secure checkout
                  </span>
                ) : (
                  <span className="flex items-center justify-center gap-2.5">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
                      <rect x="4" y="10.5" width="16" height="10" rx="2" />
                      <path d="M8 10.5V7a4 4 0 0 1 8 0v3.5" strokeLinecap="round" />
                    </svg>
                    Continue to secure checkout
                  </span>
                )}
              </motion.button>

              <ul className="mt-4 flex flex-wrap justify-center gap-x-5 gap-y-1.5 text-[11.5px] text-paper-500">
                {["Secure payment by Stripe", "Cancel any time from your dashboard", "Live the moment payment clears"].map((t) => (
                  <li key={t} className="flex items-center gap-1.5">
                    <span className="text-brand-400">✓</span>{t}
                  </li>
                ))}
              </ul>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function Steps({ step }: { step: 1 | 2 | "sent" }) {
  const labels = ["Verify you're the firm", "Choose a plan"];
  // The emailed-link stage sits between the two: step one is done, step two
  // isn't reachable until they click through.
  const current = step === "sent" ? 1.5 : step;
  return (
    <ol className="flex gap-2">
      {labels.map((l, i) => {
        const n = (i + 1) as 1 | 2;
        const active = current === n;
        const done = current > n;
        return (
          <li
            key={l}
            className={cx(
              "flex-1 rounded-lg px-4 py-2.5 border text-[12.5px] flex items-center gap-2.5",
              active ? "border-brand-500/50 bg-brand-500/[0.08] text-paper-100"
                     : done ? "border-white/[0.07] text-paper-500"
                            : "border-white/[0.07] text-paper-600",
            )}
          >
            <span
              className={cx(
                "size-5 rounded-full grid place-items-center text-[10px] shrink-0",
                active ? "bg-brand-500 text-white" : done ? "bg-brand-500/30 text-brand-200" : "bg-white/[0.07]",
              )}
            >
              {done ? "✓" : n}
            </span>
            {l}
          </li>
        );
      })}
    </ol>
  );
}

function Input({
  name, label, type = "text", required, value, onChange,
}: {
  name: string;
  label: string;
  type?: string;
  required?: boolean;
  value?: string;
  onChange?: (e: React.ChangeEvent<HTMLInputElement>) => void;
}) {
  return (
    <label className="block">
      <span className="block text-[11.5px] text-paper-600 mb-1.5">{label}</span>
      <input
        name={name}
        type={type}
        required={required}
        value={value}
        onChange={onChange}
        className="w-full rounded-lg bg-white/[0.03] edge px-3 py-2.5 text-[13.5px]
                   text-paper-100 outline-none focus:border-brand-500/60 transition-colors"
      />
    </label>
  );
}

/**
 * Live verdict on the address as it is typed. Previously the person learned
 * they had taken the slow path only on the screen after submitting — too late
 * to switch to an address that would have gone straight through.
 */
function EmailHint({
  verdict,
  expectedDomain,
}: {
  verdict: ReturnType<typeof assessEmail>;
  expectedDomain: string | null;
}) {
  if (verdict.reason === "incomplete") {
    return (
      <p className="text-[12px] leading-relaxed text-paper-600">
        {expectedDomain
          ? `Use your address at ${expectedDomain} and you'll be verified straight away.`
          : "An address at the firm's own domain is verified straight away."}
      </p>
    );
  }

  if (verdict.level === "domain") {
    return (
      <p className="text-[12px] leading-relaxed text-brand-200 flex items-start gap-2">
        <span aria-hidden="true">✓</span>
        <span>
          That&apos;s the firm&apos;s own domain — confirm the email and you go straight
          through to choosing a plan.
        </span>
      </p>
    );
  }

  const why =
    verdict.reason === "free-mail"
      ? `${verdict.domain} is a personal email provider, so we can't use it to prove you work at the firm.`
      : verdict.reason === "unknown-firm-domain"
        ? "We don't have a website on file for this firm yet, so we'll verify you by hand."
        : `${verdict.domain} isn't the firm's own domain.`;

  return (
    <div className="rounded-[var(--radius-card)] border border-gold-500/25 bg-gold-500/[0.06] px-4 py-3">
      <p className="text-[12px] leading-relaxed text-gold-300">
        {why} You can still continue — it just goes to a manual check first, usually
        within a business day.
      </p>
      {expectedDomain && (
        <p className="text-[12px] leading-relaxed text-paper-400 mt-1.5">
          To skip that wait, use your address at <strong>{expectedDomain}</strong>.
        </p>
      )}
    </div>
  );
}
