import type { Tier } from "@/lib/types";

const LABEL: Record<string, { text: string; className: string }> = {
  verified: { text: "Verified", className: "bg-brand-500/15 text-brand-200 border-brand-500/35" },
  featured: { text: "Featured", className: "bg-gold-500/15 text-gold-300 border-gold-500/35" },
  dominator: { text: "Suburb leader", className: "bg-gold-500/20 text-gold-300 border-gold-500/45" },
  firm: { text: "Firm", className: "bg-gold-500/15 text-gold-300 border-gold-500/35" },
};

export default function TierBadge({ tier, claimed }: { tier: Tier | string; claimed?: boolean }) {
  const meta = LABEL[tier];
  if (!meta) {
    return claimed ? null : (
      <span className="text-[10px] tracking-[0.1em] uppercase px-2 py-0.5 rounded-md border
                       border-white/[0.08] text-paper-600">
        Unclaimed
      </span>
    );
  }
  return (
    <span
      className={`inline-flex items-center gap-1 text-[10px] tracking-[0.08em] uppercase font-semibold
                  px-2 py-0.5 rounded-md border ${meta.className}`}
    >
      <svg width="9" height="9" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M2.5 6.3 5 8.8l4.5-5.6" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
      {meta.text}
    </span>
  );
}
