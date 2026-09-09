import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { db } from "@/lib/supabase";
import { requireAdmin } from "@/lib/admin";
import PageHeader from "@/components/PageHeader";
import ModerationQueue from "@/components/ModerationQueue";

export const dynamic = "force-dynamic";
export const metadata: Metadata = {
  title: "Review moderation",
  robots: { index: false, follow: false },
};

export default async function AdminReviewsPage() {
  const admin = await requireAdmin();
  if (!admin) redirect("/dashboard/login");

  const supabase = db();
  const { data: reviews } = await supabase
    .from("reviews")
    .select("id,listing_id,author_name,author_email,rating,title,body,matter_type,status,created_at,verified_at,report_reason,used_firm")
    .in("status", ["pending", "reported"])
    .order("created_at", { ascending: true })
    .limit(100);

  const ids = [...new Set((reviews ?? []).map((r) => r.listing_id))];
  const { data: listings } = ids.length
    ? await supabase.from("lawyers").select("id,full_name,slug").in("id", ids)
    : { data: [] };
  const firmById = Object.fromEntries((listings ?? []).map((l) => [l.id, l]));

  return (
    <>
      <PageHeader
        eyebrow="Admin"
        title="Review moderation"
        intro={`${(reviews ?? []).length} awaiting a decision. Approve genuine reviews whether they are flattering or not — the only questions are whether the person was a client and whether the content is lawful.`}
      />
      <div className="mx-auto max-w-[1000px] px-5 pb-16">
        {(reviews ?? []).length === 0 ? (
          <p className="surface rounded-[var(--radius-card)] p-8 text-[14px] text-paper-400">
            Queue is empty.{" "}
            <Link href="/" className="text-brand-400 hover:text-brand-200">Back to the site →</Link>
          </p>
        ) : (
          <ModerationQueue
            reviews={(reviews ?? []).map((r) => ({
              ...r,
              firmName: firmById[r.listing_id]?.full_name ?? "Unknown firm",
              firmSlug: firmById[r.listing_id]?.slug ?? "",
            }))}
          />
        )}
      </div>
    </>
  );
}
