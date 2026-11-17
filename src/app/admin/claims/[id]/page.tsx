import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { db } from "@/lib/supabase";
import { requireAdmin } from "@/lib/admin";
import { validClaimSig } from "@/lib/claim-admin";
import PageHeader from "@/components/PageHeader";
import ClaimDecision from "@/components/ClaimDecision";

export const dynamic = "force-dynamic";
export const metadata: Metadata = {
  title: "Review claim",
  robots: { index: false, follow: false },
};

export default async function AdminClaimPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ sig?: string }>;
}) {
  const { id } = await params;
  const { sig } = await searchParams;
  if (!validClaimSig(id, sig) && !(await requireAdmin())) notFound();

  const supabase = db();
  const { data: claim } = await supabase
    .from("claims")
    .select("id,listing_id,email,full_name,phone,role_at_firm,status,started_at,verified_at")
    .eq("id", id)
    .maybeSingle();
  if (!claim) notFound();

  const { data: firm } = await supabase
    .from("lawyers")
    .select("full_name,slug,suburb,state,phone,website")
    .eq("id", claim.listing_id)
    .maybeSingle();
  if (!firm) notFound();

  const rows: [string, string | null][] = [
    ["Claimant", claim.full_name],
    ["Role", claim.role_at_firm],
    ["Email", claim.email],
    ["Phone", claim.phone],
    ["Started", new Date(claim.started_at).toLocaleString("en-AU", { timeZone: "Australia/Melbourne" })],
    ["Firm", `${firm.full_name} — ${[firm.suburb, firm.state].filter(Boolean).join(", ")}`],
    ["Firm phone on file", firm.phone],
    ["Firm website on file", firm.website ?? "none"],
  ];

  return (
    <>
      <PageHeader
        eyebrow="Admin"
        title="Review claim"
        intro="This person confirmed their email, but it isn't at the firm's own domain. Check they really act for the firm — a call to the firm's listed number settles it — then decide."
      />
      <div className="mx-auto max-w-[720px] px-5 pb-16 space-y-6">
        <dl className="surface rounded-[var(--radius-card)] divide-y divide-white/[0.06]">
          {rows.filter(([, v]) => v).map(([k, v]) => (
            <div key={k} className="grid grid-cols-[170px_1fr] gap-4 px-5 py-3.5">
              <dt className="text-[12.5px] text-paper-600">{k}</dt>
              <dd className="text-[13.5px] text-paper-200 break-words">{v}</dd>
            </div>
          ))}
        </dl>
        <ClaimDecision claimId={claim.id} sig={sig ?? ""} status={claim.status} />
      </div>
    </>
  );
}
