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
              ["Add your firm description", "A few hundred words on who you act for and how you work."],
              ["Set your practice areas", "Your plan allows more than one — each unlocks a new set of suburb pages."],
              ["Upload your logo", "Profiles with a logo get noticeably more clicks in listing results."],
              ["Check your enquiry email", "Make sure enquiries route to an inbox someone actually watches."],
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
            <Link href="/dashboard" className="btn btn-primary">Open my dashboard</Link>
            <Link href={`/firm/${listing.slug}`} className="btn btn-ghost">View my public page</Link>
          </div>
        </div>
      </div>
    </>
  );
}
