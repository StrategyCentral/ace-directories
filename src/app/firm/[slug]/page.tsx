import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import {
  getListing, getListingReviews, getNearbyListings, getPracticeAreas, getRatingBreakdown,
} from "@/lib/queries";
import { isPaid } from "@/lib/types";
import PageHeader from "@/components/PageHeader";
import ListingCard from "@/components/ListingCard";
import TierBadge from "@/components/TierBadge";
import EnquiryPanel from "@/components/EnquiryPanel";
import ClaimBanner from "@/components/ClaimBanner";
import TrackView, { TrackedLink, TrackedPhone } from "@/components/Track";
import { RatingSummary, ReviewForm, ReviewList, Stars } from "@/components/Reviews";
import { SITE, STATES } from "@/lib/site";
import { initials, telHref } from "@/lib/format";

export const revalidate = 86400;

export async function generateMetadata({
  params,
}: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const l = await getListing(slug);
  if (!l) return {};
  const where = [l.suburb, l.state].filter(Boolean).join(", ");
  const title = `${l.full_name} — ${where || "Australia"}`;
  return {
    title,
    description:
      l.bio?.slice(0, 155) ??
      `${l.full_name} is a law practice listed in ${where || "Australia"} on the Aussie Lawyer Directory. See contact details and practice areas.`,
    alternates: { canonical: `/firm/${l.slug}` },
    robots: l.status === "removed" ? { index: false, follow: false } : undefined,
    openGraph: { title, url: `/firm/${l.slug}`, type: "profile" },
  };
}

export default async function FirmPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const listing = await getListing(slug);
  if (!listing || listing.status === "removed") notFound();

  const [nearby, allAreas, reviews, breakdown] = await Promise.all([
    getNearbyListings(listing, 4),
    getPracticeAreas(),
    getListingReviews(listing.id),
    getRatingBreakdown(listing.id),
  ]);

  const paid = isPaid(listing.tier);
  const areaMap = new Map(allAreas.map((a) => [a.slug, a]));
  const areas = (listing.practice_areas ?? []).map((s) => areaMap.get(s)).filter(Boolean);
  const stateSlug = STATES.find((s) => s.code === listing.state)?.slug;
  const where = [listing.suburb, listing.state].filter(Boolean).join(", ");

  return (
    <>
      <TrackView listingId={listing.id} source="firm-profile" />
      <PageHeader
        crumbs={[
          { href: "/", label: "Home" },
          ...(stateSlug ? [{ href: `/lawyers/${stateSlug}`, label: listing.state! }] : []),
          ...(listing.suburb && listing.state
            ? [{
                href: `/lawyers/${listing.suburb.toLowerCase().replace(/[^a-z0-9]+/g, "-")}-${listing.state.toLowerCase()}`,
                label: listing.suburb,
              }]
            : []),
          { label: listing.full_name },
        ]}
        title={listing.full_name}
        intro={paid ? listing.tagline : null}
        meta={
          <div className="flex flex-wrap items-center gap-3">
            <TierBadge tier={listing.tier} claimed={listing.is_claimed} />
            {listing.review_count > 0 && (
              <span className="inline-flex items-center gap-2 text-[13px] text-paper-400">
                <Stars value={listing.review_avg} />
                <span className="tabular">{listing.review_avg.toFixed(1)}</span>
                <span className="text-paper-600">({listing.review_count})</span>
              </span>
            )}
            {where && <span className="text-[13px] text-paper-400">{where}</span>}
            {listing.phone && (
              <TrackedPhone
                listingId={listing.id}
                phone={listing.phone}
                href={telHref(listing.phone)!}
                className="text-[13px] text-brand-400 hover:text-brand-200 tabular"
              />
            )}
          </div>
        }
      />

      <div className="mx-auto max-w-[1240px] px-5 pb-10">
        {!listing.is_claimed && (
          <ClaimBanner slug={listing.slug} name={listing.full_name} score={listing.profile_score} />
        )}

        <div className="grid gap-10 lg:grid-cols-[1fr_340px] lg:items-start mt-8">
          <div className="space-y-8">
            {/* ------------------------------------------------------ about */}
            <section className="surface rounded-[var(--radius-card)] p-6">
              <div className="flex items-start gap-4">
                <div className="shrink-0 size-14 rounded-xl grid place-items-center text-[18px] font-semibold
                                bg-brand-500/12 text-brand-200 border border-brand-500/25">
                  {initials(listing.full_name)}
                </div>
                <div className="min-w-0">
                  <h2 className="text-[16px] font-medium">About {listing.full_name}</h2>
                  {paid && listing.bio ? (
                    <p className="text-[14px] leading-relaxed text-paper-300 mt-3 whitespace-pre-line">
                      {listing.bio}
                    </p>
                  ) : (
                    <p className="text-[13.5px] leading-relaxed text-paper-500 mt-3">
                      This profile hasn&apos;t been completed by the firm. We hold their name,
                      location and phone number from public records — everything else is
                      waiting on them.
                    </p>
                  )}
                </div>
              </div>
            </section>

            {/* --------------------------------------------------- practice */}
            <section>
              <p className="eyebrow mb-3">Practice areas</p>
              <div className="flex flex-wrap gap-2">
                {areas.map((a) => (
                  <Link
                    key={a!.slug}
                    href={`/${a!.slug}`}
                    className="text-[13px] px-3.5 py-2 rounded-full edge text-paper-300
                               hover:text-paper-100 hover:border-brand-500/50 transition-colors"
                  >
                    {a!.name}
                  </Link>
                ))}
              </div>
              {!paid && (
                <p className="text-[12px] text-paper-600 mt-3">
                  Free listings show one category. Verified firms list up to eight.
                </p>
              )}
            </section>

            {/* ---------------------------------------------------- details */}
            <section>
              <p className="eyebrow mb-3">Contact &amp; location</p>
              <dl className="surface rounded-[var(--radius-card)] divide-y divide-white/[0.06]">
                <Row label="Address" value={listing.full_address || listing.address || where || "—"} />
                <Row
                  label="Phone"
                  value={
                    listing.phone ? (
                      <TrackedPhone
                        listingId={listing.id}
                        phone={listing.phone}
                        href={telHref(listing.phone)!}
                        className="text-brand-400 hover:text-brand-200 tabular"
                      />
                    ) : "—"
                  }
                />
                <Row
                  label="Website"
                  value={
                    paid && listing.website ? (
                      <TrackedLink
                        listingId={listing.id}
                        href={listing.website}
                        className="text-brand-400 hover:text-brand-200 break-all"
                      >
                        {listing.website}
                      </TrackedLink>
                    ) : (
                      <Locked slug={listing.slug} />
                    )
                  }
                />
                <Row
                  label="Email"
                  value={paid && listing.email ? listing.email : <Locked slug={listing.slug} />}
                />
                <Row
                  label="Opening hours"
                  value={paid ? "By appointment — see firm's website" : <Locked slug={listing.slug} />}
                />
                {listing.lat && listing.lng && (
                  <Row
                    label="Map"
                    value={
                      <a
                        href={`https://www.google.com/maps/search/?api=1&query=${listing.lat},${listing.lng}`}
                        target="_blank" rel="noopener noreferrer"
                        className="text-brand-400 hover:text-brand-200"
                      >
                        Open in Google Maps ↗
                      </a>
                    }
                  />
                )}
              </dl>
            </section>

            <section id="reviews" className="scroll-mt-24">
              <p className="eyebrow mb-3">Reviews</p>
              <RatingSummary
                avg={listing.review_avg}
                count={listing.review_count}
                breakdown={breakdown}
              />
              <ReviewList reviews={reviews} />
              <ReviewForm listingId={listing.id} firmName={listing.full_name} />
              <p className="text-[11.5px] leading-relaxed text-paper-600 mt-4">
                Every review is confirmed by email and read by a person before publication. We
                publish criticism as readily as praise, and no firm can pay to have a genuine
                review removed.{" "}
                <Link href="/review-policy" className="underline hover:text-paper-400">
                  Our review policy
                </Link>.
              </p>
            </section>

            <p className="text-[11.5px] leading-relaxed text-paper-600">
              Listing details are drawn from public records and firm submissions. Aussie Lawyer
              Directory is not a law firm and does not endorse or recommend any practice. Always
              verify a practitioner&apos;s current registration with the law society in their
              state before engaging them.{" "}
              <Link href="/remove-my-listing" className="underline hover:text-paper-400">
                Request removal or a correction
              </Link>
              .
            </p>
          </div>

          <aside className="lg:sticky lg:top-24 space-y-4">
            {paid ? (
              <EnquiryPanel listingId={listing.id} listingName={listing.full_name} />
            ) : (
              <div className="surface rounded-[var(--radius-card)] p-5">
                <p className="eyebrow mb-3">Contact this firm</p>
                {listing.phone ? (
                  <TrackedPhone
                    listingId={listing.id}
                    phone={listing.phone}
                    href={telHref(listing.phone)!}
                    className="btn btn-primary w-full !text-[14px]"
                  >
                    Call {listing.phone}
                  </TrackedPhone>
                ) : (
                  <p className="text-[13px] text-paper-500">No phone number on file.</p>
                )}
                <p className="text-[12px] leading-relaxed text-paper-600 mt-4">
                  This firm hasn&apos;t enabled online enquiries. Verified firms get a contact
                  form that delivers straight to their inbox.
                </p>
              </div>
            )}

            <div className="surface rounded-[var(--radius-card)] p-5">
              <p className="eyebrow mb-3">Nearby</p>
              <div className="space-y-2.5">
                {nearby.map((n) => (
                  <Link key={n.id} href={`/firm/${n.slug}`}
                    className="block text-[13px] text-paper-400 hover:text-paper-100 transition-colors">
                    {n.full_name}
                    <span className="block text-[11.5px] text-paper-600">{n.suburb}, {n.state}</span>
                  </Link>
                ))}
              </div>
            </div>
          </aside>
        </div>

        {nearby.length > 0 && (
          <section className="mt-14">
            <p className="eyebrow mb-4">Other firms in {listing.suburb || listing.state}</p>
            <div className="grid gap-3 lg:grid-cols-2">
              {nearby.map((n) => (
                <ListingCard key={n.id} listing={n} />
              ))}
            </div>
          </section>
        )}
      </div>

      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "LegalService",
            name: listing.full_name,
            url: `${SITE.url}/firm/${listing.slug}`,
            telephone: listing.phone ?? undefined,
            description: listing.bio ?? undefined,
            address: {
              "@type": "PostalAddress",
              streetAddress: listing.address ?? undefined,
              addressLocality: listing.suburb ?? undefined,
              addressRegion: listing.state ?? undefined,
              postalCode: listing.postcode ?? undefined,
              addressCountry: "AU",
            },
            geo: listing.lat && listing.lng
              ? { "@type": "GeoCoordinates", latitude: listing.lat, longitude: listing.lng }
              : undefined,
            areaServed: listing.suburb ?? listing.state ?? "Australia",
            aggregateRating: listing.review_count > 0
              ? {
                  "@type": "AggregateRating",
                  ratingValue: listing.review_avg,
                  reviewCount: listing.review_count,
                  bestRating: 5,
                  worstRating: 1,
                }
              : undefined,
            review: reviews.slice(0, 5).map((r) => ({
              "@type": "Review",
              author: { "@type": "Person", name: r.author_name },
              datePublished: (r.published_at ?? r.created_at).slice(0, 10),
              reviewBody: r.body.slice(0, 400),
              reviewRating: {
                "@type": "Rating", ratingValue: r.rating, bestRating: 5, worstRating: 1,
              },
            })),
          }),
        }}
      />
    </>
  );
}

function Row({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="grid grid-cols-[130px_1fr] gap-4 px-5 py-3.5">
      <dt className="text-[12.5px] text-paper-600">{label}</dt>
      <dd className="text-[13.5px] text-paper-200">{value}</dd>
    </div>
  );
}

function Locked({ slug }: { slug: string }) {
  return (
    <span className="inline-flex items-center gap-2">
      <span className="select-none blur-[3px] text-paper-600" aria-hidden="true">
        ████████████
      </span>
      <Link href={`/claim/${slug}`} className="text-[12px] text-gold-400 hover:text-gold-300 whitespace-nowrap">
        Claim to unlock
      </Link>
    </span>
  );
}
