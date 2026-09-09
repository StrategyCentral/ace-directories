import type { Metadata } from "next";
import Link from "next/link";
import { getPracticeAreas, getSuburb, searchListings } from "@/lib/queries";
import PageHeader from "@/components/PageHeader";
import ListingCard from "@/components/ListingCard";
import SearchBar from "@/components/SearchBar";
import { STATE_BY_SLUG } from "@/lib/site";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Search the Directory",
  description: "Search 5,900+ Australian law firms and solicitors by name, suburb or practice area.",
  robots: { index: false, follow: true },
};

export default async function SearchPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const sp = await searchParams;
  const q = typeof sp.q === "string" ? sp.q : "";
  const practice = typeof sp.practice === "string" ? sp.practice : undefined;
  const place = typeof sp.place === "string" ? sp.place : undefined;
  const page = Number(typeof sp.page === "string" ? sp.page : 1) || 1;

  const state = place ? STATE_BY_SLUG[place] : undefined;
  const suburb = place && !state ? await getSuburb(place) : null;

  const [areas, { rows, total }] = await Promise.all([
    getPracticeAreas(),
    searchListings({
      q: q || undefined,
      practice,
      state: state?.code,
      suburbId: suburb?.id,
      page,
      perPage: 24,
    }),
  ]);

  const where = state?.name ?? (suburb ? `${suburb.name}, ${suburb.state}` : null);
  const pages = Math.ceil(total / 24);

  const qs = (p: number) => {
    const u = new URLSearchParams();
    if (q) u.set("q", q);
    if (practice) u.set("practice", practice);
    if (place) u.set("place", place);
    if (p > 1) u.set("page", String(p));
    return `/search?${u.toString()}`;
  };

  return (
    <>
      <PageHeader
        crumbs={[{ href: "/", label: "Home" }, { label: "Search" }]}
        title={q ? `Results for “${q}”` : where ? `Listings in ${where}` : "Search the directory"}
        intro={`${total.toLocaleString("en-AU")} ${total === 1 ? "listing" : "listings"} found.`}
      >
        <div className="mt-8">
          <SearchBar areas={areas} size="inline" initialPractice={practice} initialSuburb={suburb} />
        </div>
      </PageHeader>

      <div className="mx-auto max-w-[1240px] px-5 pb-14">
        <div className="grid gap-3 lg:grid-cols-2">
          {rows.map((l) => (
            <ListingCard key={l.id} listing={l} />
          ))}
        </div>

        {rows.length === 0 && (
          <div className="surface rounded-[var(--radius-card)] p-8">
            <p className="text-[14px] text-paper-300">Nothing matched that search.</p>
            <p className="text-[13px] text-paper-500 mt-2">
              Try a suburb name, or{" "}
              <Link href="/practice-areas" className="text-brand-400 hover:text-brand-200">
                browse by practice area
              </Link>
              .
            </p>
          </div>
        )}

        {pages > 1 && (
          <nav className="flex items-center justify-center gap-2 mt-10" aria-label="Pagination">
            {page > 1 && (
              <Link href={qs(page - 1)} className="btn btn-ghost !py-2 !px-4 !text-[13px]">
                Previous
              </Link>
            )}
            <span className="text-[12.5px] text-paper-600 px-3 tabular">
              Page {page} of {pages}
            </span>
            {page < pages && (
              <Link href={qs(page + 1)} className="btn btn-ghost !py-2 !px-4 !text-[13px]">
                Next
              </Link>
            )}
          </nav>
        )}
      </div>
    </>
  );
}
