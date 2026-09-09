import type { Metadata } from "next";
import Link from "next/link";
import PageHeader from "@/components/PageHeader";
import { getStats } from "@/lib/queries";

export const revalidate = 86400;

export const metadata: Metadata = {
  title: "About the Directory",
  description:
    "Aussie Lawyer Directory is an independent national listing of Australian law firms and solicitors, running since 2013.",
  alternates: { canonical: "/about" },
};

export default async function AboutPage() {
  const stats = await getStats();
  return (
    <>
      <PageHeader
        crumbs={[{ href: "/", label: "Home" }, { label: "About" }]}
        eyebrow="About"
        title="An independent directory, not a lead broker."
        intro="We list Australian law firms so people can find one and contact them directly. We are not a law firm, we don't take a cut of anyone's matter, and we don't auction enquiries."
      />
      <div className="mx-auto max-w-[820px] px-5 pb-16 space-y-8 text-[14.5px] leading-relaxed text-paper-300">
        <p>
          Aussie Lawyer Directory has been listing Australian practices since 2013. Today we hold{" "}
          <strong className="text-paper-100">{stats.listings.toLocaleString("en-AU")}</strong> firms
          and solicitors across <strong className="text-paper-100">{stats.suburbs.toLocaleString("en-AU")}</strong>{" "}
          suburbs and all eight states and territories.
        </p>

        <div>
          <h2 className="display text-[1.6rem] mb-3">How listings work</h2>
          <p>
            Most listings started life as public record — a firm name, an address and a phone
            number. Those pages are deliberately thin: one category, no website link, no
            description. A firm can claim its listing at any time and take control of it.
          </p>
          <p className="mt-3">
            Paid listings rank above unclaimed ones and carry a badge saying so. We think that
            is the honest arrangement: money buys prominence, it never buys the ability to hide
            a competitor.
          </p>
        </div>

        <div>
          <h2 className="display text-[1.6rem] mb-3">What we are not</h2>
          <ul className="space-y-2 list-disc pl-5 text-paper-400">
            <li>We are not a law firm and cannot give legal advice.</li>
            <li>We do not verify the outcome or quality of any practitioner&apos;s work.</li>
            <li>We do not sell enquiries to third-party lead brokers.</li>
            <li>We do not accept payment to remove or suppress a competitor&apos;s listing.</li>
          </ul>
          <p className="mt-4 text-paper-400">
            Always confirm a practitioner&apos;s current registration with the law society or
            bar association in their state before engaging them.
          </p>
        </div>

        <div className="surface rounded-2xl p-6">
          <p className="text-[14px] text-paper-100">Something wrong on a listing?</p>
          <p className="text-[13px] text-paper-500 mt-2">
            We correct or remove listings on request, free, within two business days.
          </p>
          <div className="flex gap-3 mt-5">
            <Link href="/remove-my-listing" className="btn btn-ghost !text-[13px]">Request removal</Link>
            <Link href="/contact" className="btn btn-ghost !text-[13px]">Contact us</Link>
          </div>
        </div>
      </div>
    </>
  );
}
