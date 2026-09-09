"use client";

import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { cx } from "@/lib/format";

export interface PublicReview {
  id: string;
  author_name: string;
  rating: number;
  title: string | null;
  body: string;
  matter_type: string | null;
  published_at: string | null;
  created_at: string;
  reply: string | null;
  replied_at: string | null;
}

export function Stars({ value, size = 14 }: { value: number; size?: number }) {
  return (
    <span className="inline-flex items-center gap-0.5" aria-label={`${value} out of 5`}>
      {[1, 2, 3, 4, 5].map((i) => (
        <svg key={i} width={size} height={size} viewBox="0 0 20 20" aria-hidden="true"
             fill={i <= Math.round(value) ? "#d4b862" : "rgba(255,255,255,0.14)"}>
          <path d="M10 1.6l2.47 5.2 5.53.78-4 4.03.95 5.79L10 14.7l-4.95 2.7.95-5.79-4-4.03 5.53-.78z" />
        </svg>
      ))}
    </span>
  );
}

export function RatingSummary({
  avg, count, breakdown,
}: {
  avg: number;
  count: number;
  breakdown: { rating: number; n: number }[];
}) {
  const max = Math.max(1, ...breakdown.map((b) => b.n));
  return (
    <div className="surface rounded-[var(--radius-card)] p-6 grid gap-6 sm:grid-cols-[190px_1fr] sm:items-center">
      <div className="text-center sm:text-left">
        <p className="display text-[clamp(2.4rem,5vw,3.4rem)] text-paper-100 tabular leading-none">
          {count ? avg.toFixed(1) : "—"}
        </p>
        <div className="mt-2 flex justify-center sm:justify-start">
          <Stars value={avg} size={16} />
        </div>
        <p className="text-[12px] text-paper-600 mt-2">
          {count === 0 ? "No reviews yet" : `${count} verified review${count === 1 ? "" : "s"}`}
        </p>
      </div>
      <div className="space-y-1.5">
        {breakdown.map((b) => (
          <div key={b.rating} className="flex items-center gap-3">
            <span className="text-[11.5px] text-paper-600 w-3 tabular">{b.rating}</span>
            <div className="flex-1 h-1.5 rounded-full bg-white/[0.06] overflow-hidden">
              <div className="h-full rounded-full bg-gold-500/70"
                   style={{ width: `${count ? (b.n / max) * 100 : 0}%` }} />
            </div>
            <span className="text-[11.5px] text-paper-600 w-6 text-right tabular">{b.n}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

export function ReviewList({ reviews }: { reviews: PublicReview[] }) {
  if (reviews.length === 0) return null;
  return (
    <div className="space-y-3 mt-4">
      {reviews.map((r) => (
        <article key={r.id} className="surface rounded-[var(--radius-card)] p-5">
          <div className="flex items-start justify-between gap-4 flex-wrap">
            <div>
              <div className="flex items-center gap-2.5">
                <Stars value={r.rating} />
                <span className="text-[13.5px] text-paper-100">{r.author_name}</span>
              </div>
              {r.title && (
                <p className="text-[14.5px] font-medium text-paper-100 mt-2">{r.title}</p>
              )}
            </div>
            <span className="text-[11.5px] text-paper-600">
              {new Date(r.published_at ?? r.created_at).toLocaleDateString("en-AU",
                { month: "short", year: "numeric" })}
            </span>
          </div>

          <p className="text-[13.5px] leading-relaxed text-paper-300 mt-3 whitespace-pre-line">
            {r.body}
          </p>

          {r.matter_type && (
            <p className="text-[11.5px] text-paper-600 mt-3">Matter: {r.matter_type}</p>
          )}

          {r.reply && (
            <div className="mt-4 pl-4 border-l-2 border-brand-500/40">
              <p className="text-[11px] tracking-[0.12em] uppercase text-brand-400">
                Response from the firm
              </p>
              <p className="text-[13px] leading-relaxed text-paper-400 mt-2 whitespace-pre-line">
                {r.reply}
              </p>
            </div>
          )}

          <ReportLink reviewId={r.id} />
        </article>
      ))}
    </div>
  );
}

function ReportLink({ reviewId }: { reviewId: string }) {
  const [open, setOpen] = useState(false);
  const [done, setDone] = useState(false);

  if (done) {
    return (
      <p className="text-[11.5px] text-paper-500 mt-3">
        Reported. It has been taken down while we review it.
      </p>
    );
  }

  return (
    <div className="mt-3">
      {!open ? (
        <button onClick={() => setOpen(true)} className="text-[11.5px] text-paper-600 hover:text-paper-400">
          Report this review
        </button>
      ) : (
        <form
          className="flex gap-2 mt-1"
          onSubmit={async (e) => {
            e.preventDefault();
            const reason = new FormData(e.currentTarget).get("reason");
            await fetch("/api/reviews/report", {
              method: "POST",
              headers: { "content-type": "application/json" },
              body: JSON.stringify({ review_id: reviewId, reason }),
            });
            setDone(true);
          }}
        >
          <input
            name="reason"
            required
            minLength={10}
            placeholder="What's wrong with it?"
            className="flex-1 rounded-lg bg-white/[0.03] edge px-3 py-2 text-[12.5px] text-paper-100
                       placeholder:text-paper-600 outline-none focus:border-brand-500/60"
          />
          <button className="btn btn-ghost !py-2 !px-3 !text-[12px]">Send</button>
        </form>
      )}
    </div>
  );
}

export function ReviewForm({
  listingId, firmName,
}: { listingId: string; firmName: string }) {
  const [open, setOpen] = useState(false);
  const [state, setState] = useState<"idle" | "sending" | "done">("idle");
  const [rating, setRating] = useState(0);
  const [error, setError] = useState<string | null>(null);

  async function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!rating) return setError("Please choose a rating");
    const f = new FormData(e.currentTarget);
    setState("sending");
    setError(null);
    try {
      const res = await fetch("/api/reviews", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          listing_id: listingId,
          rating,
          author_name: f.get("author_name"),
          author_email: f.get("author_email"),
          title: f.get("title"),
          body: f.get("body"),
          matter_type: f.get("matter_type"),
          used_firm: f.get("used_firm") === "on",
        }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? "Could not submit");
      setState("done");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not submit");
      setState("idle");
    }
  }

  if (state === "done") {
    return (
      <div className="surface rounded-[var(--radius-card)] p-6 mt-4">
        <p className="text-[14.5px] text-brand-200">Check your inbox.</p>
        <p className="text-[13px] leading-relaxed text-paper-400 mt-2">
          Confirm your email address and your review goes into the queue. A person reads every
          review before it is published — usually within a business day.
        </p>
      </div>
    );
  }

  return (
    <div className="mt-4">
      {!open && (
        <button onClick={() => setOpen(true)} className="btn btn-ghost !text-[13px]">
          Write a review
        </button>
      )}

      <AnimatePresence>
        {open && (
          <motion.form
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            onSubmit={submit}
            className="surface rounded-[var(--radius-card)] p-6 space-y-4"
          >
            <div>
              <h3 className="text-[15px] font-medium">Review {firmName}</h3>
              <p className="text-[12.5px] leading-relaxed text-paper-500 mt-1.5">
                Only review a firm you have actually dealt with. Describe your own experience —
                keep it factual, and avoid accusations you could not back up if asked.
              </p>
            </div>

            <div>
              <span className="block text-[11.5px] text-paper-600 mb-2">Your rating</span>
              <div className="flex gap-1.5">
                {[1, 2, 3, 4, 5].map((i) => (
                  <button
                    key={i}
                    type="button"
                    onClick={() => setRating(i)}
                    aria-label={`${i} star${i > 1 ? "s" : ""}`}
                    className="p-0.5"
                  >
                    <svg width="26" height="26" viewBox="0 0 20 20"
                         fill={i <= rating ? "#d4b862" : "rgba(255,255,255,0.16)"}>
                      <path d="M10 1.6l2.47 5.2 5.53.78-4 4.03.95 5.79L10 14.7l-4.95 2.7.95-5.79-4-4.03 5.53-.78z" />
                    </svg>
                  </button>
                ))}
              </div>
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              <Field name="author_name" label="Your name" required />
              <Field name="author_email" label="Your email (not published)" type="email" required />
              <Field name="title" label="Headline (optional)" />
              <Field name="matter_type" label="Type of matter (optional)" />
            </div>

            <label className="block">
              <span className="block text-[11.5px] text-paper-600 mb-1.5">Your experience</span>
              <textarea
                name="body"
                rows={5}
                required
                minLength={40}
                placeholder="What did you engage them for, and how did it go?"
                className="w-full rounded-lg bg-white/[0.03] edge px-3 py-2.5 text-[13.5px]
                           text-paper-100 placeholder:text-paper-600 outline-none
                           focus:border-brand-500/60 resize-y"
              />
            </label>

            <label className="flex items-start gap-3 text-[12px] text-paper-500">
              <input type="checkbox" name="used_firm" required defaultChecked
                     className="mt-0.5 accent-[var(--color-brand-500)]" />
              <span>
                I confirm I was a client of this firm, this is my genuine experience, and I have
                no undisclosed connection to them or their competitors.
              </span>
            </label>

            {error && <p className="text-[12.5px] text-red-400">{error}</p>}

            <div className="flex gap-2.5">
              <button disabled={state === "sending"} className="btn btn-primary !text-[13px] disabled:opacity-60">
                {state === "sending" ? "Submitting…" : "Submit review"}
              </button>
              <button type="button" onClick={() => setOpen(false)} className="btn btn-ghost !text-[13px]">
                Cancel
              </button>
            </div>

            <p className="text-[11px] leading-relaxed text-paper-600">
              We publish criticism and praise alike, and we never charge a firm to remove a
              review. We do remove reviews that are fake, defamatory, or written by someone
              who was never a client.
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
      <span className="block text-[11.5px] text-paper-600 mb-1.5">{label}</span>
      <input
        name={name}
        type={type}
        required={required}
        className={cx(
          "w-full rounded-lg bg-white/[0.03] edge px-3 py-2.5 text-[13.5px]",
          "text-paper-100 outline-none focus:border-brand-500/60 transition-colors",
        )}
      />
    </label>
  );
}
