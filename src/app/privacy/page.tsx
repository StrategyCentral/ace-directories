import type { Metadata } from "next";
import PageHeader from "@/components/PageHeader";
import { SITE } from "@/lib/site";

export const metadata: Metadata = {
  title: "Privacy Policy",
  alternates: { canonical: "/privacy" },
};

const SECTIONS: [string, string][] = [
  ["What we collect", "For people searching: the details you type into an enquiry form — name, email, phone and a description of your matter — plus standard server logs. For firms: your contact details, billing information (held by Stripe, never by us) and the content you add to your profile."],
  ["Listing data", "Firm listings are compiled from publicly available business records: firm names, business addresses and published business phone numbers. We do not publish private residential addresses or personal mobile numbers, and we remove any listing on request at no charge."],
  ["How we use it", "Enquiry details are forwarded to the firm you selected or to firms matching your criteria, so they can respond to you. We do not sell enquiries to third-party lead brokers, data brokers or marketing lists."],
  ["Email", "Firms with a listing may receive email about that listing, including claim reminders. Every email carries an unsubscribe link and a removal link, as required by the Spam Act 2003 (Cth)."],
  ["Storage and processors", "Data is stored on infrastructure hosted in Australia and the United States. We use Supabase (database), Railway (hosting), Stripe (payments) and Resend (email). Each is bound by its own processing terms."],
  ["Access, correction and complaints", "You can ask us what we hold about you, have it corrected, or have it deleted. Contact us and we will respond within a reasonable period. If you are not satisfied you may complain to the Office of the Australian Information Commissioner (oaic.gov.au)."],
  ["Cookies", "We use only the cookies needed to keep you signed in to a firm dashboard. We do not run advertising or cross-site tracking cookies."],
];

export default function PrivacyPage() {
  return (
    <>
      <PageHeader
        crumbs={[{ href: "/", label: "Home" }, { label: "Privacy" }]}
        title="Privacy policy"
        intro="How we handle personal information, in line with the Privacy Act 1988 (Cth) and the Australian Privacy Principles."
      />
      <div className="mx-auto max-w-[760px] px-5 pb-16 space-y-7">
        {SECTIONS.map(([h, body]) => (
          <section key={h}>
            <h2 className="text-[15px] font-medium text-paper-100">{h}</h2>
            <p className="text-[14px] leading-relaxed text-paper-400 mt-2">{body}</p>
          </section>
        ))}
        <p className="text-[12px] text-paper-600 pt-4 edge-t">
          Privacy enquiries: <a href={`mailto:${SITE.supportEmail}`} className="text-brand-400">{SITE.supportEmail}</a> · {SITE.postal}
        </p>
      </div>
    </>
  );
}
