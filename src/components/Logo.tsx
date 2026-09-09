import Link from "next/link";

export function Mark({ size = 30 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 40 40" fill="none" aria-hidden="true">
      <defs>
        <linearGradient id="ald-mark" x1="0" y1="0" x2="40" y2="40">
          <stop offset="0%" stopColor="#6d97ff" />
          <stop offset="55%" stopColor="#3f74ff" />
          <stop offset="100%" stopColor="#1f47b8" />
        </linearGradient>
      </defs>
      {/* A shield — the trust cue — with the scale beam struck through it */}
      <path
        d="M20 2.5 36 8v13.2c0 8.4-6.3 14.6-16 16.3C10.3 35.8 4 29.6 4 21.2V8L20 2.5Z"
        stroke="url(#ald-mark)"
        strokeWidth="2"
        fill="rgba(63,116,255,0.10)"
      />
      <path d="M20 11v16" stroke="url(#ald-mark)" strokeWidth="2" strokeLinecap="round" />
      <path d="M11.5 15.5h17" stroke="url(#ald-mark)" strokeWidth="2" strokeLinecap="round" />
      <circle cx="11.5" cy="15.5" r="2.6" stroke="url(#ald-mark)" strokeWidth="1.6" />
      <circle cx="28.5" cy="15.5" r="2.6" stroke="url(#ald-mark)" strokeWidth="1.6" />
    </svg>
  );
}

export default function Logo({ compact = false }: { compact?: boolean }) {
  return (
    <Link href="/" className="flex items-center gap-2.5 group shrink-0" aria-label="Aussie Lawyer Directory home">
      <Mark />
      {!compact && (
        <span className="leading-none">
          <span className="block text-[15px] font-semibold tracking-tight text-paper-100">
            Aussie Lawyer Directory
          </span>
          <span className="block text-[10px] tracking-[0.16em] uppercase text-paper-500 mt-0.5">
            Every state · Every practice area
          </span>
        </span>
      )}
    </Link>
  );
}
