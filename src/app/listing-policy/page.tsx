import type { Metadata } from "next";
import Link from "next/link";
import PageHeader from "@/components/PageHeader";

export const metadata: Metadata = {
  title: "Listing Policy",
  description:
    "How listings get into the Aussie Lawyer Directory, how ranking works, and what paid placement does and does not buy.",
  alternates: { canonical: "/listing-policy" },
};

export default function ListingPolicyPage() {
  return (
    <>
      <PageHeader
        crumbs={[{ href: "/", label: "Home" }, { label: "Listing policy" }]}
        eyebrow="Transparency"
        title="How ranking actually works"
        intro="Every directory sells placement. Most pretend otherwise. Here is exactly what money buys on this site."
      />
      <div className="mx-auto max-w-[760px] px-5 pb-16 space-y-7 text-[14px] leading-relaxed text-paper-400">
        <section>
          <h2 className="text-[15px] font-medium text-paper-100">Ranking order</h2>
          <p className="mt-2">
            Within any suburb or practice-area page, listings are ordered by plan tier first
            (Suburb Dominator, then Multi-Office Firm, then Featured, then Verified, then
            unclaimed), then by review volume, then alphabetically. Tier is shown on every card.
          </p>
        </section>
        <section>
          <h2 className="text-[15px] font-medium text-paper-100">What payment does not buy</h2>
          <ul className="list-disc pl-5 mt-2 space-y-1.5">
            <li>Removal or suppression of a competitor&apos;s listing.</li>
            <li>Deletion of genuine reviews.</li>
            <li>Any representation about the quality of a firm&apos;s work.</li>
            <li>Exclusion of unpaid firms from search results — they always appear.</li>
          </ul>
        </section>
        <section>
          <h2 className="text-[15px] font-medium text-paper-100">Suburb exclusivity</h2>
          <p className="mt-2">
            One firm may hold the top position for one practice area in one suburb. It prevents
            competitors appearing <em>above</em> them on that page. It never removes competitors
            from the page.
          </p>
        </section>
        <section>
          <h2 className="text-[15px] font-medium text-paper-100">Unclaimed listings</h2>
          <p className="mt-2">
            Listings sourced from public records show a name, suburb and phone number only.
            They stay live indefinitely unless a claim is started and then abandoned, or the
            firm asks for removal.{" "}
            <Link href="/remove-my-listing" className="text-brand-400 hover:text-brand-200">
              Removal is free
            </Link>.
          </p>
        </section>
      </div>
    </>
  );
}
