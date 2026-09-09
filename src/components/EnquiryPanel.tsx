"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

export default function EnquiryPanel({
  practiceArea,
  practiceName,
  place,
  listingId,
  listingName,
}: {
  practiceArea?: string;
  practiceName?: string;
  place?: string;
  listingId?: string;
  listingName?: string;
}) {
  const [state, setState] = useState<"idle" | "sending" | "done" | "error">("idle");
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = new FormData(e.currentTarget);
    setState("sending");
    setError(null);
    try {
      const res = await fetch("/api/enquiries", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          name: form.get("name"),
          email: form.get("email"),
          phone: form.get("phone"),
          matter: form.get("matter"),
          urgency: form.get("urgency"),
          practice_area: practiceArea,
          listing_id: listingId,
          source: listingId ? "profile" : "match",
        }),
      });
      if (!res.ok) throw new Error((await res.json()).error ?? "Something went wrong");
      setState("done");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
      setState("error");
    }
  }

  return (
    <div className="surface rounded-[var(--radius-card)] p-5">
      <AnimatePresence mode="wait">
        {state === "done" ? (
          <motion.div key="done" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}>
            <p className="text-[14px] font-medium text-brand-200">Enquiry sent.</p>
            <p className="text-[13px] leading-relaxed text-paper-400 mt-2">
              {listingName
                ? `${listingName} has your details and will be in touch directly.`
                : "We've passed your details to matching firms in the area. Expect a call or email shortly."}
            </p>
            <p className="text-[11.5px] text-paper-600 mt-3">
              This is not legal advice and no lawyer–client relationship exists until a firm
              formally accepts your matter.
            </p>
          </motion.div>
        ) : (
          <motion.form key="form" onSubmit={onSubmit} initial={{ opacity: 1 }} className="space-y-3">
            <div>
              <p className="eyebrow">{listingName ? "Contact this firm" : "Get matched"}</p>
              <p className="text-[13px] leading-relaxed text-paper-400 mt-2">
                {listingName
                  ? `Send ${listingName} a short summary of your matter.`
                  : `Tell us what's happened${place ? ` in ${place}` : ""} and we'll pass it to ${
                      practiceName ? practiceName.toLowerCase() : "local firms"
                    } who handle it.`}
              </p>
            </div>

            <Field name="name" label="Your name" required />
            <Field name="email" label="Email" type="email" required />
            <Field name="phone" label="Phone" type="tel" />

            <label className="block">
              <span className="sr-only">What&apos;s happened?</span>
              <textarea
                name="matter"
                required
                rows={4}
                placeholder="Briefly — what's happened?"
                className="w-full rounded-lg bg-white/[0.03] edge px-3 py-2.5 text-[13.5px]
                           text-paper-100 placeholder:text-paper-600 outline-none
                           focus:border-brand-500/60 transition-colors resize-y"
              />
            </label>

            <label className="block">
              <span className="sr-only">How urgent is it?</span>
              <select
                name="urgency"
                defaultValue="soon"
                className="w-full rounded-lg bg-white/[0.03] edge px-3 py-2.5 text-[13.5px]
                           text-paper-200 outline-none focus:border-brand-500/60 transition-colors"
              >
                <option value="urgent">Urgent — within 48 hours</option>
                <option value="soon">Soon — this week</option>
                <option value="planning">Just planning ahead</option>
              </select>
            </label>

            {error && <p className="text-[12.5px] text-red-400">{error}</p>}

            <button type="submit" disabled={state === "sending"} className="btn btn-primary w-full !text-[13.5px] disabled:opacity-60">
              {state === "sending" ? "Sending…" : listingName ? "Send enquiry" : "Find my lawyer"}
            </button>

            <p className="text-[11px] leading-relaxed text-paper-600">
              We pass your details to matching firms only. We never sell enquiries to
              third-party lead brokers.
            </p>
          </motion.form>
        )}
      </AnimatePresence>
    </div>
  );
}

function Field({
  name, label, type = "text", required,
}: { name: string; label: string; type?: string; required?: boolean }) {
  return (
    <label className="block">
      <span className="sr-only">{label}</span>
      <input
        name={name}
        type={type}
        required={required}
        placeholder={label}
        autoComplete={name === "name" ? "name" : name}
        className="w-full rounded-lg bg-white/[0.03] edge px-3 py-2.5 text-[13.5px]
                   text-paper-100 placeholder:text-paper-600 outline-none
                   focus:border-brand-500/60 transition-colors"
      />
    </label>
  );
}
