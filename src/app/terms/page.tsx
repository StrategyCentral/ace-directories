import type { Metadata } from "next";
import PageHeader from "@/components/PageHeader";
import { SITE } from "@/lib/site";

export const metadata: Metadata = {
  title: "Terms of Use",
  alternates: { canonical: "/terms" },
};

const SECTIONS: [string, string][] = [
  ["Not legal advice", "Aussie Lawyer Directory is a directory service. It is not a law firm, does not provide legal advice, and no lawyer–client relationship arises from using this site or contacting a firm through it."],
  ["Listing accuracy", "Listings are compiled from public records and firm submissions. We make reasonable efforts to keep them accurate but do not warrant that any detail — including a practitioner's registration status — is current. Always verify a practitioner's registration with the law society or bar association in their state."],
  ["No endorsement", "Inclusion in the directory is not an endorsement, recommendation or assessment of quality. Paid placement affects ranking and profile features only, and paid listings are labelled as such."],
  ["Enquiries", "Enquiries submitted through the site are forwarded to the firm you selected or to firms matching your criteria. We do not sell enquiries to third-party lead brokers. Firms are independent and we are not responsible for their conduct, fees or advice."],
  ["Subscriptions", "Paid listings are billed in advance monthly or yearly through Stripe. There is no minimum term. Cancelling stops future billing at the end of the current period; fees already paid are not refunded on a pro-rata basis. Cancelling reverts the listing to a basic record rather than deleting it."],
  ["Claims", "Starting a claim reserves a listing for 72 hours. If the claim is not completed within that window, the reservation lapses and the unclaimed listing is removed from the directory. Claims must be made by a person authorised to act for the firm; we may require further verification and may reverse a claim made without authority."],
  ["Acceptable use", "You may not scrape, resell or systematically copy directory data, or use it to send unsolicited commercial messages. Automated access outside our published sitemap and robots directives is not permitted."],
  ["Liability", "To the extent permitted by law, our liability arising out of your use of the site is limited to the amount you have paid us in the preceding twelve months. Nothing in these terms excludes rights you have under the Australian Consumer Law."],
  ["Changes", "We may update these terms. Material changes affecting paid listings will be notified by email to the account contact before they take effect."],
];

export default function TermsPage() {
  return (
    <>
      <PageHeader
        crumbs={[{ href: "/", label: "Home" }, { label: "Terms" }]}
        title="Terms of use"
        intro={`Applies to everyone using ${SITE.domain}, whether searching for a lawyer or maintaining a listing.`}
      />
      <div className="mx-auto max-w-[760px] px-5 pb-16 space-y-7">
        {SECTIONS.map(([h, body], i) => (
          <section key={h}>
            <h2 className="text-[15px] font-medium text-paper-100">{i + 1}. {h}</h2>
            <p className="text-[14px] leading-relaxed text-paper-400 mt-2">{body}</p>
          </section>
        ))}
        <p className="text-[12px] text-paper-600 pt-4 edge-t">
          Questions about these terms: <a href={`mailto:${SITE.supportEmail}`} className="text-brand-400">{SITE.supportEmail}</a>
        </p>
      </div>
    </>
  );
}
