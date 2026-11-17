"use client";

import { useState } from "react";

export default function ClaimDecision({
  claimId,
  sig,
  status,
}: {
  claimId: string;
  sig: string;
  status: string;
}) {
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState<string | null>(
    status === "manual_review" ? null : `This claim is already ${status.replace("_", " ")}.`,
  );

  async function decide(action: "approve" | "decline") {
    setBusy(true);
    try {
      const res = await fetch("/api/admin/claims", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ claim_id: claimId, action, sig }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? "Failed");
      setResult(
        action === "decline"
          ? "Declined. The listing is unchanged and nobody was emailed."
          : json.emailed
            ? "Approved. They've been emailed a link to choose a plan and have 72 hours."
            : "Approved, but the email to them did not send. Contact them directly.",
      );
    } catch (e) {
      setResult(`Error: ${e instanceof Error ? e.message : "failed"}`);
    } finally {
      setBusy(false);
    }
  }

  if (result) {
    return <p className="surface rounded-[var(--radius-card)] p-5 text-[13.5px] text-paper-200">{result}</p>;
  }

  return (
    <div className="flex flex-wrap gap-3">
      <button onClick={() => decide("approve")} disabled={busy} className="btn btn-primary disabled:opacity-60">
        {busy ? "Saving…" : "Approve and email them"}
      </button>
      <button onClick={() => decide("decline")} disabled={busy} className="btn btn-ghost disabled:opacity-60">
        Decline
      </button>
    </div>
  );
}
