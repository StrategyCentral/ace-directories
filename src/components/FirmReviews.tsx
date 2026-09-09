"use client";

import { useState } from "react";
import { Stars } from "./Reviews";

interface Row {
  id: string;
  author_name: string;
  rating: number;
  title: string | null;
  body: string;
  published_at: string | null;
  created_at: string;
  reply: string | null;
  replied_at: string | null;
}

/**
 * The firm's side of the review system. Replying is free on every plan — a
 * right of reply you have to pay for is not a right of reply.
 */
export default function FirmReviews({ reviews, firmName }: { reviews: Row[]; firmName: string }) {
  if (reviews.length === 0) {
    return (
      <div className="mt-8 pt-6 edge-t">
        <p className="eyebrow mb-3">Reviews</p>
        <p className="text-[13.5px] text-paper-500">
          No reviews for {firmName} yet. Clients can leave one from your public profile — and
          asking a happy client directly is the fastest way to get the first.
        </p>
      </div>
    );
  }

  return (
    <div className="mt-8 pt-6 edge-t">
      <p className="eyebrow mb-4">Reviews ({reviews.length})</p>
      <div className="space-y-3">
        {reviews.map((r) => <ReviewRow key={r.id} row={r} />)}
      </div>
    </div>
  );
}

function ReviewRow({ row }: { row: Row }) {
  const [reply, setReply] = useState(row.reply ?? "");
  const [saved, setSaved] = useState(Boolean(row.reply));
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [editing, setEditing] = useState(!row.reply);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      const res = await fetch("/api/reviews/reply", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ review_id: row.id, reply }),
      });
      if (!res.ok) throw new Error((await res.json()).error ?? "Could not save");
      setSaved(true);
      setEditing(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not save");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="rounded-[var(--radius-card)] border border-white/[0.07] bg-white/[0.015] p-5">
      <div className="flex items-center gap-2.5 flex-wrap">
        <Stars value={row.rating} />
        <span className="text-[13.5px] text-paper-100">{row.author_name}</span>
        <span className="text-[11.5px] text-paper-600">
          {new Date(row.published_at ?? row.created_at).toLocaleDateString("en-AU")}
        </span>
      </div>
      {row.title && <p className="text-[14px] font-medium text-paper-100 mt-2">{row.title}</p>}
      <p className="text-[13.5px] leading-relaxed text-paper-300 mt-2 whitespace-pre-line">{row.body}</p>

      {saved && !editing ? (
        <div className="mt-4 pl-4 border-l-2 border-brand-500/40">
          <p className="text-[11px] tracking-[0.12em] uppercase text-brand-400">Your response</p>
          <p className="text-[13px] leading-relaxed text-paper-400 mt-2 whitespace-pre-line">{reply}</p>
          <button onClick={() => setEditing(true)} className="text-[11.5px] text-paper-600 hover:text-paper-400 mt-2">
            Edit response
          </button>
        </div>
      ) : (
        <form onSubmit={submit} className="mt-4 space-y-2.5">
          <textarea
            value={reply}
            onChange={(e) => setReply(e.target.value)}
            rows={3}
            required
            placeholder="Respond publicly. A measured reply to a critical review often reads better to prospective clients than the review itself — and never disclose anything about the matter."
            className="w-full rounded-lg bg-white/[0.03] edge px-3 py-2.5 text-[13px] text-paper-100
                       placeholder:text-paper-600 outline-none focus:border-brand-500/60 resize-y"
          />
          {error && <p className="text-[12.5px] text-red-400">{error}</p>}
          <div className="flex gap-2">
            <button disabled={busy} className="btn btn-primary !py-2 !px-4 !text-[12.5px] disabled:opacity-60">
              {busy ? "Saving…" : "Publish response"}
            </button>
            {row.reply && (
              <button type="button" onClick={() => { setReply(row.reply ?? ""); setEditing(false); }}
                      className="btn btn-ghost !py-2 !px-4 !text-[12.5px]">
                Cancel
              </button>
            )}
          </div>
          <p className="text-[11px] text-paper-600">
            Remember your confidentiality obligations — do not confirm or discuss whether someone
            was a client, or any detail of their matter.
          </p>
        </form>
      )}
    </div>
  );
}
