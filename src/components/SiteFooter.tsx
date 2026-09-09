import Link from "next/link";
import { Mark } from "./Logo";
import { SITE, STATES, LEGAL_AID } from "@/lib/site";
import { getPracticeAreas } from "@/lib/queries";
import type { PracticeArea } from "@/lib/types";

export default async function SiteFooter() {
  let areas: PracticeArea[] = [];
  try {
    areas = (await getPracticeAreas()).filter((a) => a.tier === 1).slice(0, 12);
  } catch {
    /* render without the dynamic column */
  }

  return (
    <footer className="edge-t mt-24 bg-ink-900">
      {/* Emergency band — always visible, never behind a paywall */}
      <div className="border-b border-white/[0.06] bg-gold-500/[0.045]">
        <div className="mx-auto max-w-[1240px] px-5 py-4 flex flex-wrap items-center gap-x-6 gap-y-2 text-[12.5px]">
          <span className="text-gold-300 font-medium">Need urgent help and can&apos;t afford a lawyer?</span>
          <span className="text-paper-400 text-paper-500">
            National Legal Aid{" "}
            <a href={`tel:${LEGAL_AID.NATIONAL.phone.replace(/\s/g, "")}`} className="text-paper-100 hover:text-brand-400">
              {LEGAL_AID.NATIONAL.phone}
            </a>
          </span>
          <Link href="/legal-aid" className="text-brand-400 hover:text-brand-200">
            Legal Aid in every state →
          </Link>
        </div>
      </div>

      <div className="mx-auto max-w-[1240px] px-5 py-14 grid gap-10 md:grid-cols-[1.4fr_1fr_1fr_1fr]">
        <div>
          <div className="flex items-center gap-2.5 mb-4">
            <Mark size={26} />
            <span className="text-[14px] font-semibold">{SITE.name}</span>
          </div>
          <p className="text-[13px] leading-relaxed text-paper-500 max-w-xs">
            An independent national directory of Australian law firms and solicitors, running since 2013.
            We are not a law firm and we do not give legal advice.
          </p>
          <div className="mt-5 flex gap-2.5">
            <Link href="/list-your-firm" className="btn btn-ghost !py-2 !px-4 !text-[12.5px]">List your firm</Link>
            <Link href="/claim" className="btn btn-ghost !py-2 !px-4 !text-[12.5px]">Claim a listing</Link>
          </div>
        </div>

        <FooterCol title="Practice areas">
          {areas.map((a) => (
            <FooterLink key={a.slug} href={`/${a.slug}`}>{a.name}</FooterLink>
          ))}
          <FooterLink href="/practice-areas">All areas →</FooterLink>
        </FooterCol>

        <FooterCol title="States & territories">
          {STATES.map((s) => (
            <FooterLink key={s.slug} href={`/lawyers/${s.slug}`}>{s.name}</FooterLink>
          ))}
        </FooterCol>

        <FooterCol title="Directory">
          <FooterLink href="/search">Search all listings</FooterLink>
          <FooterLink href="/guides">Legal guides</FooterLink>
          <FooterLink href="/pricing">Pricing</FooterLink>
          <FooterLink href="/dashboard">Firm login</FooterLink>
          <FooterLink href="/about">About ALD</FooterLink>
          <FooterLink href="/contact">Contact</FooterLink>
          <FooterLink href="/legal-aid">Legal Aid</FooterLink>
        </FooterCol>
      </div>

      <div className="edge-t">
        <div className="mx-auto max-w-[1240px] px-5 py-6 flex flex-col sm:flex-row gap-3 justify-between text-[12px] text-paper-600">
          <p>© {new Date().getFullYear()} {SITE.name}. All rights reserved.</p>
          <div className="flex flex-wrap gap-5">
            <Link href="/terms" className="hover:text-paper-300">Terms</Link>
            <Link href="/privacy" className="hover:text-paper-300">Privacy</Link>
            <Link href="/listing-policy" className="hover:text-paper-300">Listing policy</Link>
            <Link href="/remove-my-listing" className="hover:text-paper-300">Remove my listing</Link>
          </div>
        </div>
      </div>
    </footer>
  );
}

function FooterCol({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <p className="eyebrow mb-3.5">{title}</p>
      <ul className="space-y-2">{children}</ul>
    </div>
  );
}

function FooterLink({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <li>
      <Link href={href} className="text-[13px] text-paper-500 hover:text-paper-100 transition-colors">
        {children}
      </Link>
    </li>
  );
}
