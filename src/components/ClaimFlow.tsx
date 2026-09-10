"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import type { Plan } from "@/lib/types";
import { money, cx } from "@/lib/format";

interface ListingLite {
  id: string;
  slug: string;
  name: string;
  suburb: string | null;
  state: string | null;
  phone: string | null;
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
}: {
  listing: ListingLite;
  plans: Plan[];
  existingClaim: ExistingClaim | null;
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
              <Input name="email" label="Work email" type="email" required />
              <Input name="phone" label="Direct phone" type="tel" />
            </div>

            <label className="flex items-start gap-3 text-[12.5px] text-paper-500 pt-1">
              <input type="checkbox" required className="mt-0.5 accent-[var(--color-brand-500)]" />
              <span>I am authorised to manage {listing.name}&apos;s public listing.</span>
            </label>

            {error && <p className="text-[12.5px] text-red-400">{error}</p>}

            <button disabled={busy} className="btn btn-primary w-full disabled:opacity-60">
              {busy ? "Sending…" : "Email me a confirmation link"}
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

              <div className="mt-6 grid gap-3">
                {plans.map((p) => {
                  const price = yearly ? p.yearly_price : p.monthly_price;
                  const selected = plan === p.code;
                  return (
                    <button
                      key={p.code}
                      type="button"
                      onClick={() => setPlan(p.code)}
                      className={cx(
                        "text-left rounded-[var(--radius-card)] border p-5 transition-all",
                        selected
                          ? "border-brand-500/60 bg-brand-500/[0.07]"
                          : "border-white/[0.07] bg-white/[0.015] hover:border-white/[0.16]",
                      )}
                    >
                      <div className="flex items-start justify-between gap-4 flex-wrap">
                        <div>
                          <p className="text-[15px] font-medium flex items-center gap-2">
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
                        <p className="text-[15px] tabular">
                          {money(price)}
                          <span className="text-paper-600 text-[12px]">
                            {yearly ? "/yr" : "/mo"} + GST
                          </span>
                        </p>
                      </div>
                      {selected && (
                        <ul className="mt-4 grid gap-1.5 sm:grid-cols-2 text-[12.5px] text-paper-400">
                          {p.features.map((f) => (
                            <li key={f} className="flex gap-2">
                              <span className="text-brand-400">✓</span>
                              {f}
                            </li>
                          ))}
                        </ul>
                      )}
                    </button>
                  );
                })}
              </div>

              {error && <p className="text-[12.5px] text-red-400 mt-4">{error}</p>}

              <button onClick={checkout} disabled={busy} className="btn btn-primary w-full mt-6 disabled:opacity-60">
                {busy ? "Opening checkout…" : "Continue to secure checkout"}
              </button>
              <p className="text-[11.5px] text-paper-600 mt-3 text-center">
                Payments handled by Stripe. Cancel from your dashboard at any time.
              </p>
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
  name, label, type = "text", required,
}: { name: string; label: string; type?: string; required?: boolean }) {
  return (
    <label className="block">
      <span className="block text-[11.5px] text-paper-600 mb-1.5">{label}</span>
      <input
        name={name}
        type={type}
        required={required}
        className="w-full rounded-lg bg-white/[0.03] edge px-3 py-2.5 text-[13.5px]
                   text-paper-100 outline-none focus:border-brand-500/60 transition-colors"
      />
    </label>
  );
}
