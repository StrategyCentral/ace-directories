import Link from "next/link";

/**
 * The unclaimed-listing banner. It is deliberately specific about what is
 * missing — a vague "claim this listing" converts far worse than showing the
 * firm the exact holes in their own public profile.
 */
export default function ClaimBanner({
  slug,
  name,
  score,
}: {
  slug: string;
  name: string;
  score: number;
}) {
  return (
    <div className="relative overflow-hidden rounded-2xl border border-gold-500/25 bg-gradient-to-br
                    from-gold-500/[0.08] via-transparent to-brand-500/[0.05] p-6 md:p-8">
      <div className="grid gap-6 md:grid-cols-[1fr_auto] md:items-center">
        <div>
          <p className="eyebrow text-gold-400">Unclaimed listing</p>
          <h2 className="display text-[clamp(1.4rem,2.6vw,2rem)] mt-2">
            Is this your firm?
          </h2>
          <p className="text-[13.5px] leading-relaxed text-paper-400 mt-3 max-w-[560px]">
            {name} is listed from public records, so this page is running at{" "}
            <strong className="text-gold-300">{score}% complete</strong>. Right now anyone
            searching for you sees a phone number and nothing else — no website link, no
            practice areas, no way to enquire online.
          </p>

          <div className="mt-5 h-1.5 w-full max-w-[420px] rounded-full bg-white/[0.07] overflow-hidden">
            <div
              className="h-full rounded-full bg-gradient-to-r from-gold-500 to-brand-500"
              style={{ width: `${Math.max(6, score)}%` }}
            />
          </div>

          <ul className="mt-5 grid gap-1.5 sm:grid-cols-2 text-[12.5px] text-paper-500">
            {[
              "Website link", "Full practice area list", "Firm description",
              "Logo and photos", "Online enquiry form", "Client reviews",
            ].map((f) => (
              <li key={f} className="flex items-center gap-2">
                <span className="size-1 rounded-full bg-paper-600" aria-hidden="true" />
                {f} — missing
              </li>
            ))}
          </ul>
        </div>

        <div className="shrink-0">
          <Link href={`/claim/${slug}`} className="btn btn-gold w-full md:w-auto">
            Claim this listing
          </Link>
          <p className="text-[11.5px] text-paper-600 mt-3 md:text-right max-w-[190px] md:ml-auto">
            Verification takes about two minutes.
          </p>
        </div>
      </div>
    </div>
  );
}
