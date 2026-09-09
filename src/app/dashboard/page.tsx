import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { db } from "@/lib/supabase";
import { getListingActivity, getListingDaily, getPracticeAreas } from "@/lib/queries";
import type { Listing } from "@/lib/types";
import PageHeader from "@/components/PageHeader";
import ProfileEditor from "@/components/ProfileEditor";
import ActivityPanel from "@/components/ActivityPanel";
import FirmReviews from "@/components/FirmReviews";
import TierBadge from "@/components/TierBadge";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Firm Dashboard",
  robots: { index: false, follow: false },
};

export default async function DashboardPage() {
  const session = await getSession();
  if (!session) redirect("/dashboard/login");

  const supabase = db();

  const { data: claims } = await supabase
    .from("claims")
    .select("listing_id")
    .eq("email", session.email)
    .eq("status", "completed");

  const ids = (claims ?? []).map((c) => c.listing_id);
  if (ids.length === 0) {
    return (
      <PageHeader
        title="No listings on this account"
        intro={`We don't have a completed claim against ${session.email}. If you claimed a listing with a different work address, sign in with that one.`}
      >
        <div className="mt-7 flex gap-3">
          <Link href="/claim" className="btn btn-primary">Find my listing</Link>
          <form action="/api/auth/logout" method="post">
            <button className="btn btn-ghost">Sign out</button>
          </form>
        </div>
      </PageHeader>
    );
  }

  const [{ data: listings }, areas, { data: enquiries }, { data: reviewRows }] = await Promise.all([
    supabase.from("lawyers").select("*").in("id", ids),
    getPracticeAreas(),
    supabase
      .from("enquiries")
      .select("id,name,email,phone,matter,urgency,created_at,read_at,listing_id")
      .in("listing_id", ids)
      .order("created_at", { ascending: false })
      .limit(25),
    supabase
      .from("reviews")
      .select("id,listing_id,author_name,rating,title,body,published_at,created_at,reply,replied_at")
      .in("listing_id", ids)
      .eq("status", "approved")
      .order("published_at", { ascending: false })
      .limit(50),
  ]);

  const rows = (listings ?? []) as unknown as Listing[];

  // One activity read per listing — firms want to see the numbers before they
  // care about the edit form.
  const activity = Object.fromEntries(
    await Promise.all(
      rows.map(async (l) => [
        l.id,
        { stats: await getListingActivity(l.id), daily: await getListingDaily(l.id, 30) },
      ]),
    ),
  ) as Record<string, { stats: Awaited<ReturnType<typeof getListingActivity>>; daily: Awaited<ReturnType<typeof getListingDaily>> }>;

  return (
    <>
      <PageHeader
        eyebrow="Firm dashboard"
        title="Your listings"
        intro={`Signed in as ${session.email}.`}
        meta={
          <form action="/api/auth/logout" method="post">
            <button className="text-[12.5px] text-paper-500 hover:text-paper-200">Sign out</button>
          </form>
        }
      />

      <div className="mx-auto max-w-[1240px] px-5 pb-16 space-y-10">
        {rows.map((l) => (
          <section key={l.id} className="surface rounded-2xl p-6 md:p-8">
            <div className="flex items-start justify-between gap-4 flex-wrap mb-6">
              <div>
                <h2 className="text-[17px] font-medium flex items-center gap-2.5">
                  {l.full_name}
                  <TierBadge tier={l.tier} claimed={l.is_claimed} />
                </h2>
                <p className="text-[12.5px] text-paper-600 mt-1">
                  {[l.suburb, l.state].filter(Boolean).join(", ")} · profile {l.profile_score}% complete
                </p>
              </div>
              <div className="flex gap-2.5">
                <Link href={`/firm/${l.slug}`} className="btn btn-ghost !py-2 !px-4 !text-[12.5px]">
                  View public page
                </Link>
              </div>
            </div>

            <ActivityPanel activity={activity[l.id].stats} daily={activity[l.id].daily} />

            <ProfileEditor listing={l} areas={areas} />

            <FirmReviews
              reviews={(reviewRows ?? []).filter((r) => r.listing_id === l.id)}
              firmName={l.full_name}
            />
          </section>
        ))}

        <section>
          <p className="eyebrow mb-4">Recent enquiries</p>
          {(enquiries ?? []).length === 0 ? (
            <p className="surface rounded-[var(--radius-card)] p-6 text-[13.5px] text-paper-500">
              No enquiries yet. Completing your profile and adding practice areas puts you on
              more suburb pages, which is where enquiries come from.
            </p>
          ) : (
            <div className="grid gap-2.5">
              {(enquiries ?? []).map((e) => (
                <div key={e.id} className="surface rounded-[var(--radius-card)] p-5">
                  <div className="flex items-start justify-between gap-4 flex-wrap">
                    <div>
                      <p className="text-[14px] text-paper-100">{e.name || "Anonymous"}</p>
                      <p className="text-[12px] text-paper-600 mt-0.5">
                        <a href={`mailto:${e.email}`} className="hover:text-brand-400">{e.email}</a>
                        {e.phone && <span className="tabular"> · {e.phone}</span>}
                      </p>
                    </div>
                    <span className="text-[11px] px-2 py-0.5 rounded border border-white/[0.08] text-paper-500">
                      {e.urgency}
                    </span>
                  </div>
                  <p className="text-[13px] leading-relaxed text-paper-400 mt-3 whitespace-pre-line">
                    {e.matter}
                  </p>
                  <p className="text-[11px] text-paper-600 mt-3">
                    {new Date(e.created_at).toLocaleString("en-AU")}
                  </p>
                </div>
              ))}
            </div>
          )}
        </section>
      </div>
    </>
  );
}
