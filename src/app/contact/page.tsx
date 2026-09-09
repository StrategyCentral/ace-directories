import type { Metadata } from "next";
import PageHeader from "@/components/PageHeader";
import { SITE } from "@/lib/site";

export const metadata: Metadata = {
  title: "Contact",
  description: "Get in touch with the Aussie Lawyer Directory team.",
  alternates: { canonical: "/contact" },
};

export default function ContactPage() {
  return (
    <>
      <PageHeader
        crumbs={[{ href: "/", label: "Home" }, { label: "Contact" }]}
        title="Contact us"
        intro="Listing corrections, billing questions, removals and press enquiries all go to the same inbox and are answered within two business days."
      />
      <div className="mx-auto max-w-[820px] px-5 pb-16 grid gap-3 sm:grid-cols-2">
        {[
          ["General", SITE.email],
          ["Support & billing", SITE.supportEmail],
        ].map(([label, email]) => (
          <div key={email} className="surface rounded-[var(--radius-card)] p-6">
            <p className="eyebrow">{label}</p>
            <a href={`mailto:${email}`} className="text-[15px] text-brand-400 hover:text-brand-200 mt-2 block break-all">
              {email}
            </a>
          </div>
        ))}
        <div className="surface rounded-[var(--radius-card)] p-6 sm:col-span-2">
          <p className="eyebrow">Post</p>
          <p className="text-[14px] text-paper-300 mt-2">{SITE.postal}</p>
        </div>
      </div>
    </>
  );
}
