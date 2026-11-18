import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getListing } from "@/lib/queries";
import PageHeader from "@/components/PageHeader";
import PaidCelebration from "@/components/PaidCelebration";
import OneClickUpsell from "@/components/OneClickUpsell";
import { getSession } from "@/lib/auth";
import { stripe } from "@/lib/stripe";
import { getAddons, exclusiveHolder } from "@/lib/addons";
import { getPracticeAreas } from "@/lib/queries";
import { db } from "@/lib/supabase";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Claim complete",
  robots: { index: false, follow: false },
};

export default async function ClaimDonePage({
  params, searchParams,
}: { params: Promise<{ slug: string }>; searchParams: Promise<{ session_id?: string }> }) {
  const { slug } = await params;
  const { session_id } = await searchParams;
  const listing = await getListing(slug);
  if (!listing) notFound();

  // One post-purchase offer, only to the person who just paid (signed in by
  // /api/checkout/complete). Verified buyers see Featured; Featured buyers
  // without an exclusive see Suburb Exclusive for the areas still free.
  let upsell: React.ReactNode = null;
  const session = await getSession();
  if (session && session_id) {
    try {
      const cs = await stripe().checkout.sessions.retrieve(session_id);
      const plan = cs.metadata?.plan_code;
      const per = cs.mode === "subscription" && (await stripe().checkout.sessions.listLineItems(session_id, { limit: 1 }))
        .data[0]?.price?.recurring?.interval === "year" ? "/yr" : "/mo";
      const { data: owner } = await db().from("claims").select("id").eq("listing_id", listing.id)
        .eq("email", session.email).limit(1).maybeSingle();
      if (owner && cs.metadata?.listing_id === listing.id) {
        if (plan === "verified") {
          upsell = <OneClickUpsell listingId={listing.id} kind="featured" price={0} per={per} suburb={listing.suburb} areas={[]} />;
        } else if (plan === "featured" && !cs.metadata?.exclusive_practice && listing.suburb_id) {
          const [addons, areas] = await Promise.all([getAddons(), getPracticeAreas()]);
          const ex = addons.find((a) => a.code === "exclusive");
          const mine = (listing.practice_areas ?? []).filter((a) => a !== "general-practice");
          const free: { slug: string; name: string }[] = [];
          for (const a of areas.filter((x) => mine.includes(x.slug))) {
            if (!(await exclusiveHolder(listing.suburb_id, a.slug))) free.push({ slug: a.slug, name: a.name });
          }
          if (ex && free.length) {
            upsell = <OneClickUpsell listingId={listing.id} kind="exclusive"
              price={per === "/yr" ? ex.yearly_price : ex.monthly_price} per={per} suburb={listing.suburb} areas={free} />;
          }
        }
      }
    } catch (e) {
      console.error("upsell lookup failed", e);
    }
  }

  return (
    <>
      <PageHeader
        eyebrow="Payment received"
        title={`${listing.full_name} is yours.`}
        intro="Your subscription is active and the listing is verified. Stripe will email your receipt separately. It can take a few seconds for the badge to appear on your public page."
      />

      <div className="mx-auto max-w-[1240px] px-5 pb-16">
        <PaidCelebration />
        {upsell}
        <div className="surface rounded-2xl p-7 md:p-9 max-w-[720px]">
          <p className="eyebrow mb-4">Do these next</p>
          <ol className="space-y-4">
            {[
              ["Write a headline about their problem", "Not about your firm. This one line does more than everything else on the page."],
              ["Answer the cost question", "Fear of an unknown bill stops more enquiries than the bill itself ever would."],
              ["Add three specific reasons to choose you", "Specialisations, languages, a niche you own. Not \"experienced\"."],
              ["Answer what they're too embarrassed to ask", "\"Can I afford this?\" \"Is it too late?\" These are the enquiries you're losing."],
            ].map(([t, d], i) => (
              <li key={t} className="flex gap-4">
                <span className="shrink-0 size-6 rounded-full bg-brand-500/15 text-brand-200 grid place-items-center text-[11px]">
                  {i + 1}
                </span>
                <span>
                  <span className="block text-[14px] text-paper-100">{t}</span>
                  <span className="block text-[12.5px] text-paper-500 mt-0.5">{d}</span>
                </span>
              </li>
            ))}
          </ol>

          <div className="flex flex-wrap gap-3 mt-8">
            <Link href="/dashboard/setup" className="btn btn-primary">Build my profile now</Link>
            <Link href={`/firm/${listing.slug}`} className="btn btn-ghost">View my public page</Link>
          </div>
        </div>
      </div>
    </>
  );
}
