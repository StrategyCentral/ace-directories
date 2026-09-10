import Link from "next/link";
import type { Listing } from "@/lib/types";
import { telHref } from "@/lib/format";
import { TrackedPhone } from "./Track";

/**
 * The paid profile, laid out in the order a hesitant person reads it:
 *
 *   the promise  ->  why you  ->  what it costs  ->  the worry  ->  contact
 *
 * A directory profile usually opens with the firm's history and buries the fee
 * question. That is backwards. Someone who has never hired a lawyer is deciding
 * two things — "do they handle my kind of problem" and "can I afford to ask" —
 * and every section here exists to answer one of them.
 */

interface Extras {
  headline?: string | null;
  intro?: string | null;
  usps?: string[] | null;
  free_consult?: boolean | null;
  free_consult_mins?: number | null;
  fee_approach?: string | null;
  fee_note?: string | null;
  response_commitment?: string | null;
  after_hours?: boolean | null;
  home_visits?: boolean | null;
  video_consults?: boolean | null;
  abn?: string | null;
  admitted_year?: number | null;
  principal_name?: string | null;
  memberships?: string[] | null;
  faqs?: { q: string; a: string }[] | null;
}

const FEE_LABEL: Record<string, string> = {
  fixed: "Fixed fees for most matters",
  hourly: "Hourly, with an estimate up front",
  "no-win-no-fee": "No win no fee",
  mixed: "Depends on the matter",
};

export default function ConversionProfile({ listing }: { listing: Listing }) {
  const x = listing as unknown as Extras;
  const usps = (x.usps ?? []).filter(Boolean);
  const faqs = (x.faqs ?? []).filter((f) => f?.q?.trim() && f?.a?.trim());
  const access = [
    x.after_hours && "After-hours appointments",
    x.home_visits && "Home and hospital visits",
    x.video_consults && "Video consultations",
  ].filter(Boolean) as string[];

  const hasAny =
    x.headline || x.intro || usps.length || x.free_consult || x.fee_approach || faqs.length;
  if (!hasAny) return null;

  return (
    <div className="space-y-8">
      {/* ---------------------------------------------------- the promise */}
      {(x.headline || x.intro) && (
        <section className="surface rounded-2xl p-6 md:p-8 border-brand-500/20">
          {x.headline && (
            <h2 className="display text-[clamp(1.5rem,3vw,2.2rem)] leading-tight">{x.headline}</h2>
          )}
          {x.intro && (
            <p className="text-[15px] leading-relaxed text-paper-300 mt-4 max-w-[62ch]">{x.intro}</p>
          )}

          {(x.free_consult || x.response_commitment) && (
            <div className="flex flex-wrap gap-2.5 mt-6">
              {x.free_consult && (
                <span className="text-[12.5px] px-3 py-1.5 rounded-full bg-gold-500/15 text-gold-300 border border-gold-500/30">
                  Free {x.free_consult_mins ? `${x.free_consult_mins}-minute ` : ""}first consultation
                </span>
              )}
              {x.response_commitment && (
                <span className="text-[12.5px] px-3 py-1.5 rounded-full edge text-paper-300">
                  Replies {x.response_commitment}
                </span>
              )}
            </div>
          )}
        </section>
      )}

      {/* --------------------------------------------------------- why you */}
      {usps.length > 0 && (
        <section>
          <p className="eyebrow mb-4">Why this firm</p>
          <div className="grid gap-3 sm:grid-cols-3">
            {usps.slice(0, 6).map((u) => (
              <div key={u} className="surface rounded-[var(--radius-card)] p-5">
                <span className="text-brand-400 text-[13px]" aria-hidden="true">✓</span>
                <p className="text-[13.5px] leading-relaxed text-paper-200 mt-2">{u}</p>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* ------------------------------------------------------- the money */}
      {(x.fee_approach || x.fee_note) && (
        <section className="surface rounded-2xl p-6">
          <p className="eyebrow mb-3">What it costs</p>
          {x.fee_approach && (
            <p className="text-[15px] text-paper-100">
              {FEE_LABEL[x.fee_approach] ?? x.fee_approach}
            </p>
          )}
          {x.fee_note && (
            <p className="text-[13.5px] leading-relaxed text-paper-400 mt-3 max-w-[62ch]">
              {x.fee_note}
            </p>
          )}
          <p className="text-[11.5px] text-paper-600 mt-4">
            Fees are set by the firm, not by this directory. Ask for a written costs agreement
            before any work starts — you are entitled to one.
          </p>
        </section>
      )}

      {/* ---------------------------------------------------------- proof */}
      {(x.admitted_year || x.principal_name || (x.memberships ?? []).length > 0 || x.abn || access.length > 0) && (
        <section>
          <p className="eyebrow mb-4">Credentials</p>
          <dl className="surface rounded-[var(--radius-card)] divide-y divide-white/[0.06]">
            {x.principal_name && <Row label="Principal" value={x.principal_name} />}
            {x.admitted_year && <Row label="Admitted" value={String(x.admitted_year)} />}
            {(x.memberships ?? []).length > 0 && (
              <Row label="Accreditations" value={(x.memberships ?? []).join(" · ")} />
            )}
            {access.length > 0 && <Row label="Availability" value={access.join(" · ")} />}
            {x.abn && <Row label="ABN" value={x.abn} />}
          </dl>
        </section>
      )}

      {/* --------------------------------------------------- the objection */}
      {faqs.length > 0 && (
        <section>
          <p className="eyebrow mb-4">Questions people ask before calling</p>
          <div className="space-y-3">
            {faqs.slice(0, 8).map((f) => (
              <details key={f.q} className="surface rounded-[var(--radius-card)] p-5 group">
                <summary className="text-[14.5px] font-medium text-paper-100 cursor-pointer list-none flex justify-between gap-4">
                  {f.q}
                  <span className="text-paper-600 shrink-0 transition-transform group-open:rotate-45" aria-hidden="true">+</span>
                </summary>
                <p className="text-[13.5px] leading-relaxed text-paper-400 mt-3 whitespace-pre-line">{f.a}</p>
              </details>
            ))}
          </div>
          <script
            type="application/ld+json"
            dangerouslySetInnerHTML={{
              __html: JSON.stringify({
                "@context": "https://schema.org",
                "@type": "FAQPage",
                mainEntity: faqs.map((f) => ({
                  "@type": "Question",
                  name: f.q,
                  acceptedAnswer: { "@type": "Answer", text: f.a },
                })),
              }),
            }}
          />
        </section>
      )}

      {/* -------------------------------------------------------- the ask */}
      <section className="surface rounded-2xl p-6 md:p-8 border-brand-500/25 bg-gradient-to-br from-brand-500/[0.06] to-transparent">
        <h3 className="text-[16px] font-medium">
          {x.free_consult
            ? `Talk to ${listing.full_name} at no cost`
            : `Get in touch with ${listing.full_name}`}
        </h3>
        <p className="text-[13.5px] leading-relaxed text-paper-400 mt-2 max-w-[58ch]">
          {x.free_consult
            ? "The first conversation is free. You are not committing to anything by asking whether you have a problem worth acting on."
            : "Send a short summary of your situation and they will come back to you directly."}
        </p>
        <div className="flex flex-wrap gap-3 mt-5">
          {listing.phone && (
            <TrackedPhone
              listingId={listing.id}
              phone={listing.phone}
              href={telHref(listing.phone)!}
              className="btn btn-primary"
            >
              Call {listing.phone}
            </TrackedPhone>
          )}
          <a href="#enquire" className="btn btn-ghost">Send an enquiry</a>
        </div>
        <p className="text-[11px] leading-relaxed text-paper-600 mt-5">
          Contacting a firm through this directory does not create a lawyer–client relationship.
          That begins only when a firm formally accepts your matter.{" "}
          <Link href="/legal-aid" className="underline hover:text-paper-400">
            Legal Aid
          </Link>{" "}
          is available if cost is the barrier.
        </p>
      </section>
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="grid grid-cols-[130px_1fr] gap-4 px-5 py-3.5">
      <dt className="text-[12.5px] text-paper-600">{label}</dt>
      <dd className="text-[13.5px] text-paper-200">{value}</dd>
    </div>
  );
}
