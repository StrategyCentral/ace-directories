/** Accepted payment methods. Card only through Stripe; no PayPal. */
const pill = "h-8 px-3 rounded-md bg-white flex items-center justify-center shadow-[inset_0_-1px_0_rgba(0,0,0,.12)]";

export default function PaymentBadges({ className = "" }: { className?: string }) {
  return (
    <div className={"flex flex-col items-center gap-2.5 " + className}>
      <ul className="flex flex-wrap justify-center gap-2" aria-label="Accepted payment methods">
        <li className={pill} title="Visa">
          <svg viewBox="0 0 48 16" height="12" aria-label="Visa" role="img">
            <text x="0" y="14" fontFamily="Arial Black, Arial, sans-serif" fontWeight="900" fontStyle="italic" fontSize="17" fill="#1a1f71">VISA</text>
          </svg>
        </li>
        <li className={pill} title="Mastercard">
          <svg viewBox="0 0 38 24" height="20" aria-label="Mastercard" role="img">
            <circle cx="14" cy="12" r="9" fill="#eb001b" />
            <circle cx="24" cy="12" r="9" fill="#f79e1b" />
            <path d="M19 4.6a9 9 0 0 1 0 14.8 9 9 0 0 1 0-14.8z" fill="#ff5f00" />
          </svg>
        </li>
        <li className={pill + " !bg-[#2e77bc]"} title="American Express">
          <svg viewBox="0 0 48 16" height="12" aria-label="American Express" role="img">
            <text x="1" y="13" fontFamily="Arial, sans-serif" fontWeight="800" fontSize="13" fill="#fff" letterSpacing=".5">AMEX</text>
          </svg>
        </li>
        <li className={pill} title="Apple Pay">
          <svg viewBox="0 0 50 22" height="17" aria-label="Apple Pay" role="img">
            <path transform="translate(0 -1) scale(.9)" fill="#000" d="M16.37 12.6c-.02-2.2 1.8-3.26 1.88-3.31-1.03-1.5-2.62-1.7-3.18-1.72-1.35-.14-2.64.8-3.33.8-.69 0-1.74-.78-2.87-.76-1.47.02-2.83.86-3.59 2.18-1.53 2.66-.39 6.6 1.1 8.75.73 1.05 1.6 2.24 2.73 2.2 1.1-.05 1.51-.71 2.84-.71 1.32 0 1.7.71 2.86.69 1.18-.02 1.93-1.07 2.65-2.13.84-1.22 1.18-2.4 1.2-2.46-.03-.01-2.3-.88-2.32-3.5zM14.2 6.13c.6-.73 1.01-1.75.9-2.76-.87.04-1.92.58-2.54 1.31-.56.64-1.05 1.67-.92 2.66.97.08 1.96-.49 2.56-1.21z" />
            <text x="19" y="17" fontFamily="-apple-system, Helvetica, Arial, sans-serif" fontWeight="600" fontSize="15" fill="#000">Pay</text>
          </svg>
        </li>
        <li className={pill} title="Google Pay">
          <svg viewBox="0 0 52 22" height="17" aria-label="Google Pay" role="img">
            <text x="0" y="17" fontFamily="Arial, sans-serif" fontWeight="700" fontSize="16">
              <tspan fill="#4285f4">G</tspan>
            </text>
            <text x="15" y="17" fontFamily="Arial, sans-serif" fontWeight="500" fontSize="15" fill="#3c4043">Pay</text>
          </svg>
        </li>
      </ul>
      <p className="flex items-center gap-1.5 text-[11.5px] text-paper-500">
        <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" aria-hidden>
          <rect x="4" y="10.5" width="16" height="10" rx="2" /><path d="M8 10.5V7a4 4 0 0 1 8 0v3.5" />
        </svg>
        Secure payment by <span className="font-semibold text-paper-300">Stripe</span>. We never see or store your card.
      </p>
    </div>
  );
}
