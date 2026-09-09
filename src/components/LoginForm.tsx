"use client";

import { useState } from "react";

export default function LoginForm() {
  const [sent, setSent] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const email = new FormData(e.currentTarget).get("email");
    setBusy(true);
    setError(null);
    try {
      const res = await fetch("/api/auth/request-link", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ email }),
      });
      if (!res.ok) throw new Error((await res.json()).error ?? "Something went wrong");
      setSent(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setBusy(false);
    }
  }

  if (sent) {
    return (
      <div className="surface rounded-2xl p-6">
        <p className="text-[14.5px] text-paper-100">Check your inbox.</p>
        <p className="text-[13px] leading-relaxed text-paper-500 mt-2">
          If that address manages a listing, a sign-in link is on its way. It works once and
          expires in 20 minutes.
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={submit} className="surface rounded-2xl p-6 space-y-4">
      <label className="block">
        <span className="block text-[11.5px] text-paper-600 mb-1.5">Work email</span>
        <input
          name="email"
          type="email"
          required
          autoFocus
          className="w-full rounded-lg bg-white/[0.03] edge px-3 py-2.5 text-[14px] text-paper-100
                     outline-none focus:border-brand-500/60 transition-colors"
        />
      </label>
      {error && <p className="text-[12.5px] text-red-400">{error}</p>}
      <button disabled={busy} className="btn btn-primary w-full disabled:opacity-60">
        {busy ? "Sending…" : "Email me a sign-in link"}
      </button>
    </form>
  );
}
