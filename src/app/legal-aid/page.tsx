import type { Metadata } from "next";
import PageHeader from "@/components/PageHeader";
import { LEGAL_AID, STATES } from "@/lib/site";

export const metadata: Metadata = {
  title: "Legal Aid in Australia — Free Legal Help by State",
  description:
    "Contact details for Legal Aid commissions in every Australian state and territory, plus community legal centres and emergency lines.",
  alternates: { canonical: "/legal-aid" },
};

export default function LegalAidPage() {
  return (
    <>
      <PageHeader
        crumbs={[{ href: "/", label: "Home" }, { label: "Legal Aid" }]}
        eyebrow="Free help"
        title="If you can't afford a lawyer"
        intro="Every state and territory runs a Legal Aid commission offering free advice and, in some matters, representation. None of these services pay us and none of them are listings — they're here because you may need them more than you need a directory."
      />

      <div className="mx-auto max-w-[1240px] px-5 pb-16">
        <div className="surface rounded-2xl p-6 border-gold-500/25 mb-8">
          <p className="eyebrow text-gold-400">National</p>
          <p className="text-[16px] mt-2">{LEGAL_AID.NATIONAL.name}</p>
          <a href={`tel:${LEGAL_AID.NATIONAL.phone.replace(/\s/g, "")}`}
             className="display text-[clamp(1.6rem,3vw,2.2rem)] text-gold-300 tabular block mt-1">
            {LEGAL_AID.NATIONAL.phone}
          </a>
        </div>

        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {STATES.map((s) => {
            const aid = LEGAL_AID[s.code];
            return (
              <div key={s.code} className="surface rounded-[var(--radius-card)] p-5">
                <p className="text-[11px] tracking-[0.14em] uppercase text-paper-600">{s.name}</p>
                <p className="text-[14px] text-paper-100 mt-2">{aid.name}</p>
                <a href={`tel:${aid.phone.replace(/\s/g, "")}`}
                   className="text-[15px] text-brand-400 hover:text-brand-200 tabular block mt-1.5">
                  {aid.phone}
                </a>
                <a href={aid.url} target="_blank" rel="noopener noreferrer"
                   className="text-[12px] text-paper-500 hover:text-paper-300 mt-2 inline-block">
                  Website ↗
                </a>
              </div>
            );
          })}
        </div>

        <div className="surface rounded-2xl p-6 md:p-8 mt-10 max-w-[760px]">
          <p className="eyebrow">In an emergency</p>
          <ul className="mt-4 space-y-3 text-[14px] text-paper-300">
            <li><strong className="text-paper-100">Police, fire, ambulance</strong> — 000</li>
            <li><strong className="text-paper-100">1800RESPECT</strong> (family and sexual violence) — 1800 737 732</li>
            <li><strong className="text-paper-100">Lifeline</strong> — 13 11 14</li>
            <li><strong className="text-paper-100">Community legal centres</strong> — search “community legal centre” plus your suburb; most offer free 20-minute advice appointments.</li>
          </ul>
          <p className="text-[12px] leading-relaxed text-paper-600 mt-6">
            Aussie Lawyer Directory is not a law firm and provides general information only.
            Nothing on this site is legal advice.
          </p>
        </div>
      </div>
    </>
  );
}
