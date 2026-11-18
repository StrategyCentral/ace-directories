"use client";

import { useEffect, useState } from "react";

/** Unsubscribes as soon as the page opens, then offers an undo. */
export default function UnsubscribeBox({ e, s }: { e: string; s: string }) {
  const [state, setState] = useState<"working" | "out" | "in" | "error">("working");

  async function call(action: "unsubscribe" | "resubscribe") {
    setState("working");
    const r = await fetch("/api/unsubscribe", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ e, s, action }),
    }).catch(() => null);
    setState(r?.ok ? (action === "unsubscribe" ? "out" : "in") : "error");
  }

  useEffect(() => { void call("unsubscribe"); /* eslint-disable-next-line react-hooks/exhaustive-deps */ }, []);

  return (
    <div className="surface rounded-2xl p-7 md:p-9 max-w-[620px]">
      {state === "working" && <p className="text-[14px] text-paper-400">One moment…</p>}
      {state === "error" && (
        <p className="text-[14px] text-red-400">
          That link didn&apos;t work. Email us from the address you want removed and we&apos;ll do it by hand.
        </p>
      )}
      {state === "out" && (
        <>
          <p className="text-[16px] font-medium">You&apos;re unsubscribed.</p>
          <p className="text-[13.5px] leading-relaxed text-paper-500 mt-2.5">
            We won&apos;t email <span className="text-paper-200">{e}</span> again, apart from a reply
            to something you ask us for yourself, such as a confirmation link.
          </p>
          <button onClick={() => call("resubscribe")} className="btn btn-ghost mt-6 !text-[13px]">
            That was a mistake, undo
          </button>
        </>
      )}
      {state === "in" && (
        <p className="text-[14px] text-paper-300">Done. You&apos;re back on the list for {e}.</p>
      )}
    </div>
  );
}
