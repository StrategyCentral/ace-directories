import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { db } from "@/lib/supabase";
import type { Listing } from "@/lib/types";
import PageHeader from "@/components/PageHeader";
import ProfileWizard from "@/components/ProfileWizard";

export const dynamic = "force-dynamic";
export const metadata: Metadata = {
  title: "Build your profile",
  robots: { index: false, follow: false },
};

export default async function SetupPage({
  searchParams,
}: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const session = await getSession();
  if (!session) redirect("/dashboard/login");

  const supabase = db();
  const { data: claims } = await supabase
    .from("claims").select("listing_id").eq("email", session.email).eq("status", "completed");
  const ids = (claims ?? []).map((c) => c.listing_id);
  if (ids.length === 0) redirect("/dashboard");

  const sp = await searchParams;
  const wanted = typeof sp.listing === "string" ? sp.listing : null;
  const { data: rows } = await supabase.from("lawyers").select("*").in("id", ids);
  const listings = (rows ?? []) as unknown as Listing[];
  const listing = listings.find((l) => l.id === wanted) ?? listings[0];

  return (
    <>
      <PageHeader
        eyebrow="Profile builder"
        title="Turn your listing into a page that wins work"
        intro={`Five steps for ${listing.full_name}. Everything saves as you go, and you can stop and come back. The guidance in each step is the same advice a conversion copywriter would give — the difference between a directory entry and a landing page.`}
        meta={
          <div className="flex gap-3">
            <Link href="/dashboard" className="text-[12.5px] text-paper-500 hover:text-paper-200">
              ← Back to dashboard
            </Link>
            <Link href={`/firm/${listing.slug}`} className="text-[12.5px] text-brand-400 hover:text-brand-200">
              View public page
            </Link>
          </div>
        }
      />
      <div className="mx-auto max-w-[1240px] px-5 pb-16">
        <ProfileWizard listing={listing} />
      </div>
    </>
  );
}
