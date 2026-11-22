import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { db } from "@/lib/supabase";
import { requireAdmin } from "@/lib/admin";
import { validTestimonialSig } from "@/lib/claim-admin";
import PageHeader from "@/components/PageHeader";
import TestimonialDecision from "@/components/TestimonialDecision";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Review testimonial", robots: { index: false, follow: false } };

export default async function AdminTestimonialPage({
  params, searchParams,
}: { params: Promise<{ id: string }>; searchParams: Promise<{ sig?: string }> }) {
  const { id } = await params;
  const { sig } = await searchParams;
  if (!validTestimonialSig(id, sig) && !(await requireAdmin())) notFound();
  const { data: t } = await db().from("testimonials").select("*").eq("id", id).maybeSingle();
  if (!t) notFound();
  return (
    <>
      <PageHeader title="Review of ALD" intro={`${t.author_name}${t.author_role ? `, ${t.author_role}` : ""} · ${t.firm_name ?? ""} · ${t.place ?? ""}`} />
      <div className="mx-auto max-w-[1240px] px-5 pb-16">
        <div className="surface rounded-2xl p-7 max-w-[640px]">
          <p className="text-gold-400 text-[18px]">{"★".repeat(t.rating)}<span className="text-paper-700">{"★".repeat(5 - t.rating)}</span></p>
          <p className="text-[14.5px] leading-relaxed text-paper-200 mt-3 whitespace-pre-line">{t.body}</p>
          <TestimonialDecision id={t.id} sig={sig ?? ""} status={t.status} />
        </div>
      </div>
    </>
  );
}
