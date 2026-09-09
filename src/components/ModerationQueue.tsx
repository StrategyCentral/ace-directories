"use client";

import { useState } from "react";
import Link from "next/link";
import { Stars } from "./Reviews";
import { cx } from "@/lib/format";

interface QueueItem {
  id: string;
  firmName: string;
  firmSlug: string;
  author_name: string;
  author_email: string;
  rating: number;
  title: string | null;
  body: string;
  matter_type: string | null;
  status: string;
  created_at: string;
  verified_at: string | null;
  report_reason: string | null;
  used_firm: boolean;
}

export default function ModerationQueue({ reviews }: { reviews: QueueItem[] }) {
  const [done, setDone] = useState<Record<string, string>>({});
  const [busy, setBusy] = useState<string | null>(null);

  async function decide(id: string, action: "approve" | "reject", reason?: string) {
    setBusy(id);
    try {
      const res = await fetch("/api/admin/reviews", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ review_id: id, action, reason }),
      });
      if (!res.ok) throw new Error((await res.json()).error ?? "Failed");
      setDone((d) => ({ ...d, [id]: action }));
    } catch (e) {
      setDone((d) => ({ ...d, [id]: `error: ${e instanceof Error ? e.message : "failed"}` }));
    } finally {
      setBusy(null);
    }
  }

  return (
    <div className="space-y-3">
      {reviews.map((r) => {
        const outcome = done[r.id];
        return (
          <article
            key={r.id}
            className={cx(
              "surface rounded-[var(--radius-card)] p-6",
              r.status === "reported" && "border-red-500/30",
              outcome === "approve" && "opacity-50",
              outcome === "reject" && "opacity-40",
            )}
          >
            <div className="flex items-start justify-between gap-4 flex-wrap">
              <div>
                <div className="flex items-center gap-2.5 flex-wrap">
                  <Stars value={r.rating} />
                  <span className="text-[14px] text-paper-100">{r.author_name}</span>
                  <span className="text-[11.5px] text-paper-600">{r.author_email}</span>
                  {r.status === "reported" && (
                    <span className="text-[10px] uppercase tracking-[0.1em] px-2 py-0.5 rounded
                                     bg-red-500/15 text-red-300 border border-red-500/30">
                      Reported
                    </span>
                  )}
                  {!r.used_firm && (
                    <span className="text-[10px] uppercase tracking-[0.1em] px-2 py-0.5 rounded
                                     bg-gold-500/15 text-gold-300 border border-gold-500/30">
                      Not a client
                    </span>
                  )}
                </div>
                <p className="text-[12.5px] text-paper-500 mt-1.5">
                  on{" "}
                  <Link href={`/firm/${r.firmSlug}`} target="_blank"
                        className="text-brand-400 hover:text-brand-200">
                    {r.firmName}
                  </Link>
                  {" · "}
                  {r.verified_at ? "email confirmed" : "email NOT confirmed"}
                  {" · "}
                  {new Date(r.created_at).toLocaleDateString("en-AU")}
                </p>
              </div>
            </div>

            {r.title && <p className="text-[14.5px] font-medium text-paper-100 mt-3">{r.title}</p>}
            <p className="text-[13.5px] leading-relaxed text-paper-300 mt-2 whitespace-pre-line">
              {r.body}
            </p>
            {r.matter_type && (
              <p className="text-[11.5px] text-paper-600 mt-2">Matter: {r.matter_type}</p>
            )}

            {r.report_reason && (
              <p className="text-[12.5px] text-red-300 mt-3 pl-3 border-l-2 border-red-500/40">
                Report: {r.report_reason}
              </p>
            )}

            {outcome ? (
              <p className="text-[12.5px] text-paper-500 mt-4">
                {outcome === "approve" ? "Approved and published." :
                 outcome === "reject" ? "Rejected." : outcome}
              </p>
            ) : (
              <div className="flex gap-2.5 mt-5 flex-wrap">
                <button
                  disabled={busy === r.id}
                  onClick={() => decide(r.id, "approve")}
                  className="btn btn-primary !py-2 !px-4 !text-[12.5px] disabled:opacity-50"
                >
                  Approve &amp; publish
                </button>
                <button
                  disabled={busy === r.id}
                  onClick={() => {
                    const reason = window.prompt("Reason for rejection (kept internally):");
                    if (reason !== null) decide(r.id, "reject", reason);
                  }}
                  className="btn btn-ghost !py-2 !px-4 !text-[12.5px] disabled:opacity-50"
                >
                  Reject
                </button>
              </div>
            )}
          </article>
        );
      })}
    </div>
  );
}
