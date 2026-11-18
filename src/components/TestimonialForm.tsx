"use client";

import { useState } from "react";

/** Dashboard ask: how are we doing? Goes to a person before it is published. */
export default function TestimonialForm({ listingId }: { listingId: string }) {
  const [rating, setRating] = useState(0);
  const [hover, setHover] = useState(0);
  const [state, setState] = useState<"idle" | "sending" | "done">("idle");
  const [error, setError] = useState<string | null>(null);

  async function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const f = new FormData(e.currentTarget);
    setState("sending"); setError(null);
    const r = await fetch("/api/testimonials", {
      method: "POST", headers: { "content-type": "application/json" },
      body: JSON.stringify({ listing_id: listingId, rating, body: f.get("body"), author_name: f.get("author_name"), author_role: f.get("author_role") }),
    }).catch(() => null);
    const j = await r?.json().catch(() => ({}));
    if (!r?.ok) { setState("idle"); setError(j?.error ?? "Could not send"); return; }
    setState("done");
  }

  if (state === "done") {
    return <p className="surface rounded-[var(--radius-card)] p-5 text-[13.5px] text-paper-300">Thank you. We read every one before it goes on the site.</p>;
  }
  const input = "w-full rounded-lg bg-white/[0.03] edge px-3 py-2.5 text-[13.5px] text-paper-100 outline-none focus:border-brand-500/60";
  return (
    <form onSubmit={submit} className="surface rounded-[var(--radius-card)] p-5 grid gap-3 sm:grid-cols-2">
      <div className="sm:col-span-2">
        <p className="text-[14px] font-medium">How is ALD working for your firm?</p>
        <div className="flex gap-1 mt-2" onMouseLeave={() => setHover(0)}>
          {[1, 2, 3, 4, 5].map((n) => (
            <button key={n} type="button" aria-label={`${n} stars`} onMouseEnter={() => setHover(n)} onClick={() => setRating(n)}
              className={"text-[26px] leading-none transition-transform hover:scale-110 " + ((hover || rating) >= n ? "text-gold-400" : "text-white/15")}>★</button>
          ))}
        </div>
      </div>
      <textarea name="body" rows={3} required placeholder="What has changed since you claimed your listing?" className={input + " sm:col-span-2"} />
      <input name="author_name" required placeholder="Your name" className={input} />
      <input name="author_role" placeholder="Your role, for example Principal" className={input} />
      {error && <p className="text-[12.5px] text-red-400 sm:col-span-2">{error}</p>}
      <button disabled={state === "sending" || rating === 0} className="btn btn-primary sm:col-span-2 disabled:opacity-50">
        {state === "sending" ? "Sending…" : "Send review"}
      </button>
    </form>
  );
}
