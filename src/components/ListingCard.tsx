import Link from "next/link";
import type { Listing } from "@/lib/types";
import { isPaid } from "@/lib/types";
import { areaLabel, cx, initials, telHref } from "@/lib/format";
import TierBadge from "./TierBadge";

export default function ListingCard({
  listing,
  rank,
  context,
}: {
  listing: Listing;
  rank?: number;
  context?: string; // e.g. "General practice — may handle this matter"
}) {
  const paid = isPaid(listing.tier);
  const featured = listing.tier === "featured" || listing.tier === "dominator" || listing.tier === "firm";
  const areas = (listing.practice_areas ?? []).filter((a) => a !== "general-practice");

  return (
    <article
      className={cx(
        "surface lift rounded-[var(--radius-card)] p-5 flex gap-4 relative overflow-hidden",
        featured && "border-gold-500/25 bg-gradient-to-br from-gold-500/[0.06] to-transparent",
      )}
    >
      {featured && (
        <span className="absolute top-0 right-0 text-[10px] tracking-[0.14em] uppercase
                         bg-gold-500 text-[#1a1406] font-semibold px-3 py-1 rounded-bl-lg">
          Featured
        </span>
      )}

      <div
        className={cx(
          "shrink-0 size-12 rounded-xl grid place-items-center text-[15px] font-semibold",
          paid ? "bg-brand-500/15 text-brand-200 border border-brand-500/30"
               : "bg-white/[0.04] text-paper-500 border border-white/[0.06]",
        )}
        aria-hidden="true"
      >
        {typeof rank === "number" && featured ? rank : initials(listing.full_name)}
      </div>

      <div className="min-w-0 flex-1">
        <div className="flex items-start gap-2 flex-wrap">
          <h3 className="text-[15px] font-medium leading-snug">
            <Link href={`/firm/${listing.slug}`} className="hover:text-brand-400 transition-colors">
              {listing.full_name}
            </Link>
          </h3>
          <TierBadge tier={listing.tier} claimed={listing.is_claimed} />
        </div>

        <p className="text-[12.5px] text-paper-500 mt-1">
          {[listing.suburb, listing.state, listing.postcode].filter(Boolean).join(" · ")}
        </p>

        {listing.tagline && paid && (
          <p className="text-[13px] text-paper-300 mt-2 line-clamp-2">{listing.tagline}</p>
        )}

        {context && !paid && (
          <p className="text-[11.5px] text-paper-600 mt-2 italic">{context}</p>
        )}

        {areas.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mt-2.5">
            {areas.slice(0, 3).map((a) => (
              <Link
                key={a}
                href={`/${a}`}
                className="text-[11px] px-2 py-1 rounded-md edge text-paper-500 hover:text-paper-200 hover:border-brand-500/40 transition-colors"
              >
                {areaLabel(a)}
              </Link>
            ))}
          </div>
        )}

        <div className="flex items-center gap-4 mt-3.5 flex-wrap">
          {listing.phone && (
            <a href={telHref(listing.phone)} className="text-[13px] text-paper-200 hover:text-brand-400 transition-colors tabular">
              {listing.phone}
            </a>
          )}
          {paid && listing.website && (
            <a href={listing.website} target="_blank" rel="noopener noreferrer"
               className="text-[12.5px] text-brand-400 hover:text-brand-200">
              Website ↗
            </a>
          )}
          <Link href={`/firm/${listing.slug}`} className="text-[12.5px] text-paper-500 hover:text-paper-200 ml-auto">
            View profile →
          </Link>
        </div>

        {/* The conversion nudge: unclaimed listings advertise their own gaps. */}
        {!listing.is_claimed && (
          <div className="mt-3.5 pt-3 border-t border-white/[0.06] flex items-center justify-between gap-3 flex-wrap">
            <p className="text-[11.5px] text-paper-600">
              Unclaimed listing · {listing.profile_score}% complete
            </p>
            <Link
              href={`/claim/${listing.slug}`}
              className="text-[11.5px] text-gold-400 hover:text-gold-300 font-medium"
            >
              Is this your firm? Claim it →
            </Link>
          </div>
        )}
      </div>
    </article>
  );
}
