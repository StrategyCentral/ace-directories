import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { db } from "@/lib/supabase";
import { getListingActivity, getListingDaily, getPlans, getPracticeAreas, getSuburbsByIds, getTeam } from "@/lib/queries";
import { getAddons, getBilling } from "@/lib/addons";
import { INCLUDED } from "@/lib/addon-types";
import PlanPanel from "@/components/PlanPanel";
import SuburbsPanel from "@/components/SuburbsPanel";
import TeamPanel, { type Member } from "@/components/TeamPanel";
import type { Listing } from "@/lib/types";
import PageHeader from "@/components/PageHeader";
import ProfileEditor from "@/components/ProfileEditor";
import ActivityPanel from "@/components/ActivityPanel";
import FirmReviews from "@/components/FirmReviews";
import TierBadge from "@/components/TierBadge";
import HideToggle from "@/components/HideToggle";
import TestimonialForm from "@/components/TestimonialForm";
import { isTestListing } from "@/lib/test-listing";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Firm Dashboard",
  robots: { index: false, follow: false },
};

export default async function DashboardPage({
  searchParams,
}: { searchParams: Promise<{ built?: string }> }) {
  const { built } = await searchParams;
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

  const { data: kids } = await supabase.from("lawyers").select("id").in("parent_listing_id", ids);
  const allIds = [...ids, ...(kids ?? []).map((k) => k.id)];

  const [{ data: listings }, areas, { data: enquiries }, { data: reviewRows }] = await Promise.all([
    supabase.from("lawyers").select("*").in("id", ids),
    getPracticeAreas(),
    supabase
      .from("enquiries")
      .select("id,name,email,phone,matter,urgency,created_at,read_at,listing_id")
      .in("listing_id", allIds)
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

  const rows = ((listings ?? []) as unknown as (Listing & { stripe_subscription_id: string | null })[])
    .filter((l) => !l.parent_listing_id);

  const [plans, addons] = await Promise.all([getPlans(), getAddons()]);
  const extras = Object.fromEntries(
    await Promise.all(
      rows.map(async (l) => [
        l.id,
        {
          billing: await getBilling(l.stripe_subscription_id),
          team: (await getTeam(l.id, true)) as unknown as Member[],
          suburbs: await getSuburbsByIds(l.extra_suburb_ids ?? []),
        },
      ]),
    ),
  ) as Record<string, { billing: Awaited<ReturnType<typeof getBilling>>; team: Member[]; suburbs: Awaited<ReturnType<typeof getSuburbsByIds>> }>;
  const areaList = areas.filter((a) => a.slug !== "general-practice").map((a) => ({ slug: a.slug, name: a.name }));

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
        {built === "1" && (
          <div className="rounded-2xl border border-brand-500/40 bg-brand-500/[0.08] px-6 py-4">
            <p className="text-[14.5px] font-medium">Your profile is saved and live.</p>
            <p className="text-[13px] text-paper-400 mt-1">
              It can take a few seconds to show on your public page. Everything below can be changed at any time.
            </p>
          </div>
        )}
        {rows.map((l) => (
          <section key={l.id} className={"surface rounded-2xl p-6 md:p-8" + (isTestListing(l) ? " test-glow-card" : "")}>
            {isTestListing(l) && (
              <p className="mb-5 rounded-lg border-2 border-red-500 bg-red-500/[0.12] px-4 py-2.5 text-center text-[13px] font-bold tracking-[0.12em] uppercase text-red-300">
                Admin test listing · not a real listing
              </p>
            )}
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
              <div className="flex gap-2.5 flex-wrap">
                <Link href={`/dashboard/setup?listing=${l.id}`} className="btn btn-primary !py-2 !px-4 !text-[12.5px]">
                  {l.profile_score < 60 ? "Build my profile" : "Improve my profile"}
                </Link>
                {l.status === "live" && (
                  <Link href={`/firm/${l.slug}`} className="btn btn-ghost !py-2 !px-4 !text-[12.5px]">
                    View public page
                  </Link>
                )}
              </div>
            </div>

            {(l.status === "live" || l.status === "hidden") && (
              <HideToggle listingId={l.id} hidden={l.status === "hidden"} />
            )}

            <ActivityPanel activity={activity[l.id].stats} daily={activity[l.id].daily} />

            <div className="mt-8">
              <PlanPanel
                listingId={l.id}
                suburb={l.suburb}
                planCode={l.plan_code ?? null}
                isFounder={Boolean(l.is_founder)}
                plans={plans.map((p) => ({ code: p.code, name: p.name, monthly_price: p.monthly_price, yearly_price: p.yearly_price }))}
                addons={addons}
                areas={areaList}
                billing={extras[l.id].billing}
              />
              <SuburbsPanel
                listingId={l.id}
                home={l.suburb}
                allowance={(INCLUDED[l.plan_code ?? ""]?.suburbs ?? 0) + (l.extra_suburb_slots ?? 0)}
                initial={extras[l.id].suburbs.map((s) => ({ id: s.id, name: s.name, state: s.state, postcode: s.postcode }))}
              />
              <TeamPanel
                listingId={l.id}
                allowance={(INCLUDED[l.plan_code ?? ""]?.team ?? 0) + (l.team_slots ?? 0)}
                members={extras[l.id].team}
                firmAreas={areaList.filter((a) => (l.practice_areas ?? []).includes(a.slug))}
              />
            </div>

            <ProfileEditor listing={l} areas={areas} />

            <div className="mt-8">
              <TestimonialForm listingId={l.id} />
            </div>

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
