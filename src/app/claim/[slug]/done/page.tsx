import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getListing } from "@/lib/queries";
import PageHeader from "@/components/PageHeader";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Claim complete",
  robots: { index: false, follow: false },
};

export default async function ClaimDonePage({
  params,
}: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const listing = await getListing(slug);
  if (!listing) notFound();

  return (
    <>
      <PageHeader
        eyebrow="Payment received"
        title={`${listing.full_name} is yours.`}
        intro="Your subscription is active and the listing is verified. Stripe will email your receipt separately — it can take a few seconds for the badge to appear on your public page."
      />

      <div className="mx-auto max-w-[1240px] px-5 pb-16">
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
            <Link href="/dashboard/setup" className="btn btn-gold">Build my profile now</Link>
            <Link href={`/firm/${listing.slug}`} className="btn btn-ghost">View my public page</Link>
          </div>
        </div>
      </div>
    </>
  );
}
