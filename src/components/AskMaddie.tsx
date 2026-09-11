"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { AnimatePresence, motion } from "framer-motion";

/**
 * The chat bubble. Two things here are deliberate and should not be "tidied":
 *
 *  - The "AI assistant" label sits under her name permanently, not just in the
 *    opening message. A disclosure someone scrolled past an hour ago is not a
 *    disclosure, and on a legal directory the impression that you are talking
 *    to a lawyer is the exact impression that causes trouble.
 *  - The footer disclaimer is always visible above the input, not tucked in a
 *    collapsed panel.
 */

interface Firm {
  slug: string;
  name: string;
  suburb: string | null;
  state: string | null;
  review_avg: number | null;
  review_count: number;
  verified: boolean;
}
interface Turn {
  role: "user" | "assistant";
  content: string;
  firms?: Firm[];
}

const sessionKey = () => {
  if (typeof window === "undefined") return "";
  try {
    let k = sessionStorage.getItem("ald_chat");
    if (!k) {
      k = crypto.randomUUID();
      sessionStorage.setItem("ald_chat", k);
    }
    return k;
  } catch {
    return crypto.randomUUID();
  }
};

export default function AskMaddie() {
  const [open, setOpen] = useState(false);
  const [turns, setTurns] = useState<Turn[]>([]);
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  const scroller = useRef<HTMLDivElement>(null);
  const key = useRef("");

  useEffect(() => {
    key.current = sessionKey();
  }, []);

  useEffect(() => {
    if (open && turns.length === 0) {
      fetch("/api/chat")
        .then((r) => r.json())
        .then((d) => setTurns([{ role: "assistant", content: d.greeting }]))
        .catch(() => setTurns([{ role: "assistant", content: "Hi, I'm Maddie. What's going on?" }]));
    }
  }, [open, turns.length]);

  useEffect(() => {
    scroller.current?.scrollTo({ top: scroller.current.scrollHeight, behavior: "smooth" });
  }, [turns, busy]);

  async function send() {
    const text = input.trim();
    if (!text || busy) return;
    const next: Turn[] = [...turns, { role: "user", content: text }];
    setTurns(next);
    setInput("");
    setBusy(true);
    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sessionKey: key.current,
          messages: next.map((t) => ({ role: t.role, content: t.content })),
        }),
      });
      const d = await res.json();
      setTurns((t) => [...t, { role: "assistant", content: d.reply, firms: d.firms }]);
    } catch {
      setTurns((t) => [
        ...t,
        { role: "assistant", content: "Sorry — I dropped out there. Try again?" },
      ]);
    } finally {
      setBusy(false);
    }
  }

  return (
    <>
      <button
        onClick={() => setOpen((o) => !o)}
        aria-label={open ? "Close chat" : "Chat with Maddie"}
        className="fixed bottom-5 right-5 z-50 size-14 rounded-full bg-brand-500 text-white
                   shadow-[0_8px_30px_-6px_rgba(63,116,255,0.8)] grid place-items-center
                   hover:bg-brand-400 transition-colors"
      >
        <span className="text-[20px]" aria-hidden="true">{open ? "✕" : "💬"}</span>
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: 16, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 16, scale: 0.97 }}
            transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
            className="fixed bottom-24 right-5 z-50 w-[min(400px,calc(100vw-2.5rem))]
                       h-[min(560px,calc(100vh-8rem))] rounded-2xl glass edge
                       flex flex-col overflow-hidden"
          >
            <header className="px-5 py-4 edge-b flex items-center gap-3 shrink-0">
              <div className="size-9 rounded-full bg-brand-500/20 border border-brand-500/40
                              grid place-items-center text-[15px]" aria-hidden="true">
                M
              </div>
              <div className="min-w-0">
                <p className="text-[14px] font-medium leading-tight">Maddie</p>
                <p className="text-[11px] text-paper-500 leading-tight">
                  AI assistant · not a lawyer
                </p>
              </div>
            </header>

            <div ref={scroller} className="flex-1 overflow-y-auto px-5 py-4 space-y-4">
              {turns.map((t, i) => (
                <div key={i}>
                  <div
                    className={
                      t.role === "user"
                        ? "ml-auto max-w-[85%] rounded-2xl rounded-br-sm bg-brand-500 text-white px-4 py-2.5 text-[13.5px] leading-relaxed"
                        : "max-w-[92%] rounded-2xl rounded-bl-sm surface px-4 py-2.5 text-[13.5px] leading-relaxed text-paper-100 whitespace-pre-line"
                    }
                  >
                    {t.content}
                  </div>

                  {t.firms && t.firms.length > 0 && (
                    <div className="mt-3 space-y-2">
                      {t.firms.map((f) => (
                        <Link
                          key={f.slug}
                          href={`/firm/${f.slug}`}
                          className="block surface rounded-[var(--radius-card)] px-4 py-3 lift"
                        >
                          <p className="text-[13.5px] font-medium flex items-center gap-2">
                            {f.name}
                            {f.verified && (
                              <span className="text-[10px] px-1.5 py-0.5 rounded bg-gold-500/15 text-gold-300 border border-gold-500/30">
                                Verified
                              </span>
                            )}
                          </p>
                          <p className="text-[11.5px] text-paper-500 mt-1">
                            {[f.suburb, f.state].filter(Boolean).join(", ")}
                            {f.review_count > 0 &&
                              ` · ${f.review_avg?.toFixed(1)} from ${f.review_count} review${f.review_count === 1 ? "" : "s"}`}
                          </p>
                        </Link>
                      ))}
                    </div>
                  )}
                </div>
              ))}

              {busy && (
                <div className="flex gap-1.5 px-1" aria-label="Maddie is typing">
                  {[0, 1, 2].map((i) => (
                    <motion.span
                      key={i}
                      className="size-1.5 rounded-full bg-paper-600"
                      animate={{ opacity: [0.3, 1, 0.3] }}
                      transition={{ duration: 1.1, repeat: Infinity, delay: i * 0.18 }}
                    />
                  ))}
                </div>
              )}
            </div>

            <div className="px-4 pt-3 pb-4 edge-t shrink-0">
              <div className="flex gap-2">
                <input
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && (e.preventDefault(), send())}
                  placeholder="Tell me what's happened…"
                  className="flex-1 bg-white/[0.05] edge rounded-full px-4 py-2.5 text-[13.5px]
                             outline-none focus:border-brand-500/60 placeholder:text-paper-600"
                />
                <button
                  onClick={send}
                  disabled={busy || !input.trim()}
                  className="size-10 shrink-0 rounded-full bg-brand-500 text-white grid place-items-center
                             disabled:opacity-40 hover:bg-brand-400 transition-colors"
                  aria-label="Send"
                >
                  ↑
                </button>
              </div>
              <p className="text-[10.5px] leading-snug text-paper-600 mt-2.5 text-center">
                Maddie is an AI assistant and can&apos;t give legal advice. Nothing here creates a
                lawyer–client relationship.
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
