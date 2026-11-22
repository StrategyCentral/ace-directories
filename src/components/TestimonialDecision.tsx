"use client";

import { useState } from "react";

export default function TestimonialDecision({ id, sig, status }: { id: string; sig: string; status: string }) {
  const [state, setState] = useState(status === "pending" ? "" : `Already ${status}.`);
  const [busy, setBusy] = useState(false);
  async function decide(action: "approve" | "decline") {
    setBusy(true);
    const r = await fetch("/api/admin/testimonials", {
      method: "POST", headers: { "content-type": "application/json" },
      body: JSON.stringify({ id, sig, action }),
    }).catch(() => null);
    setBusy(false);
    setState(r?.ok ? (action === "approve" ? "Approved. It is now on the pricing and sales pages." : "Declined. It won't be shown.") : "Failed. Try again.");
  }
  if (state) return <p className="text-[13.5px] text-brand-200 mt-6">{state}</p>;
  return (
    <div className="flex gap-2.5 mt-6">
      <button disabled={busy} onClick={() => decide("approve")} className="btn btn-primary">Approve and publish</button>
      <button disabled={busy} onClick={() => decide("decline")} className="btn btn-ghost">Decline</button>
    </div>
  );
}
