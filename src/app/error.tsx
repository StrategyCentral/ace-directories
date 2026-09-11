"use client";

import { useEffect } from "react";

/**
 * Rendered when a page throws — most realistically because the database is
 * unreachable. Next serves this with a 500, which is the correct signal: search
 * engines retry a 5xx and keep the page indexed, where a 404 would tell them
 * the firm no longer exists.
 */
export default function Error({
  error, reset,
}: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    console.error("page error", error);
  }, [error]);

  const dbDown = error.message?.toLowerCase().includes("database unavailable");

  return (
    <div className="mx-auto max-w-[640px] px-5 py-28 text-center">
      <p className="eyebrow">{dbDown ? "Temporarily unavailable" : "Something went wrong"}</p>
      <h1 className="display text-[clamp(2rem,5vw,3rem)] mt-4">
        {dbDown ? "We're having a moment." : "That didn't load."}
      </h1>
      <p className="text-[15px] leading-relaxed text-paper-400 mt-5">
        {dbDown
          ? "Our directory is briefly unreachable. Nothing is lost — try again in a minute and the page will be back."
          : "Something broke on our end rather than yours. Try again, and if it keeps happening let us know."}
      </p>
      <div className="flex gap-3 justify-center mt-8">
        <button onClick={reset} className="btn btn-primary">Try again</button>
        <a href="/" className="btn btn-ghost">Back to the directory</a>
      </div>
      <p className="text-[12px] text-paper-600 mt-10">
        Need a lawyer urgently and can&apos;t wait? Legal Aid operates in every state —
        National Legal Aid on <a href="tel:1300888529" className="text-brand-400">1300 888 529</a>.
      </p>
    </div>
  );
}
