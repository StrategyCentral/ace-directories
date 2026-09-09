import type { Metadata } from "next";
import PageHeader from "@/components/PageHeader";
import { SITE } from "@/lib/site";

export const metadata: Metadata = {
  title: "Remove My Listing",
  description:
    "How to have your law firm's listing corrected or removed from the Aussie Lawyer Directory. Free, no plan required, actioned within two business days.",
  alternates: { canonical: "/remove-my-listing" },
};

export default function RemoveListingPage() {
  return (
    <>
      <PageHeader
        crumbs={[{ href: "/", label: "Home" }, { label: "Remove my listing" }]}
        eyebrow="Listing control"
        title="Remove or correct your listing"
        intro="Removal is free and never requires a subscription. We will not try to sell you anything on the way out."
      />
      <div className="mx-auto max-w-[760px] px-5 pb-16 text-[14.5px] leading-relaxed text-paper-300 space-y-6">
        <p>
          Email <a href={`mailto:${SITE.supportEmail}`} className="text-brand-400 hover:text-brand-200">{SITE.supportEmail}</a>{" "}
          from an address at the firm&apos;s domain, or from an address we already hold for the
          listing, and include:
        </p>
        <ul className="list-disc pl-5 space-y-1.5 text-paper-400">
          <li>the firm name and the listing URL</li>
          <li>whether you want it corrected or removed entirely</li>
          <li>your name and role at the firm</li>
        </ul>
        <p>
          We action requests within two business days. Removed listings are delisted from the
          directory, drop out of the sitemap, and return a &ldquo;not found&rdquo; response so
          search engines stop showing them.
        </p>
        <div className="surface rounded-2xl p-6">
          <p className="text-[14px] text-paper-100">Where the data came from</p>
          <p className="text-[13px] text-paper-500 mt-2">
            Listings are compiled from publicly available business records — firm names,
            business addresses and published phone numbers. We do not publish private
            residential addresses, personal mobile numbers or any information about a
            practitioner&apos;s clients or matters.
          </p>
        </div>
      </div>
    </>
  );
}
