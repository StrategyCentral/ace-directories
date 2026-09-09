import { notFound } from "next/navigation";
import { db } from "@/lib/supabase";
import { SITE, STATES } from "@/lib/site";

export const runtime = "nodejs";
export const revalidate = 86400;

const CHUNK = 20000;
const PAGE = 1000; // Supabase caps a response at 1,000 rows

interface Url {
  loc: string;
  priority?: number;
  changefreq?: string;
}

function render(urls: Url[]) {
  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls
  .map(
    (u) =>
      `  <url><loc>${u.loc}</loc>` +
      (u.changefreq ? `<changefreq>${u.changefreq}</changefreq>` : "") +
      (u.priority ? `<priority>${u.priority.toFixed(1)}</priority>` : "") +
      `</url>`,
  )
  .join("\n")}
</urlset>`;
  return new Response(xml, {
    headers: {
      "content-type": "application/xml",
      "cache-control": "public, s-maxage=86400, stale-while-revalidate=604800",
    },
  });
}

/** Page through suburbs, which exceed Supabase's 1,000-row response cap. */
async function suburbsWithAtLeast(min: number, max = 4000) {
  const out: { slug: string; listing_count: number }[] = [];
  for (let page = 0; page * PAGE < max; page++) {
    const { data } = await db()
      .from("suburbs")
      .select("slug,listing_count")
      .gte("listing_count", min)
      .order("listing_count", { ascending: false })
      .range(page * PAGE, page * PAGE + PAGE - 1);
    const rows = data ?? [];
    out.push(...rows);
    if (rows.length < PAGE) break;
  }
  return out;
}

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ file: string }> },
) {
  const { file } = await params;
  const name = file.replace(/\.xml$/, "");
  const supabase = db();

  /* ------------------------------------------------------------- core */
  if (name === "core") {
    const { data: areas } = await supabase
      .from("practice_areas").select("slug").order("listing_count", { ascending: false });
    return render([
      { loc: SITE.url, priority: 1.0, changefreq: "daily" },
      { loc: `${SITE.url}/practice-areas`, priority: 0.8 },
      { loc: `${SITE.url}/pricing`, priority: 0.7 },
      { loc: `${SITE.url}/list-your-firm`, priority: 0.7 },
      { loc: `${SITE.url}/claim`, priority: 0.7 },
      { loc: `${SITE.url}/guides`, priority: 0.6 },
      { loc: `${SITE.url}/legal-aid`, priority: 0.6 },
      { loc: `${SITE.url}/about`, priority: 0.4 },
      { loc: `${SITE.url}/contact`, priority: 0.4 },
      ...(areas ?? []).map((a) => ({
        loc: `${SITE.url}/${a.slug}`,
        priority: 0.9,
        changefreq: "weekly",
      })),
    ]);
  }

  /* ------------------------------------------------------------ places */
  if (name === "places") {
    const suburbs = await suburbsWithAtLeast(1);
    return render([
      ...STATES.map((s) => ({ loc: `${SITE.url}/lawyers/${s.slug}`, priority: 0.8 })),
      ...suburbs.map((s) => ({
        loc: `${SITE.url}/lawyers/${s.slug}`,
        priority: s.listing_count > 10 ? 0.7 : 0.5,
      })),
    ]);
  }

  /* ------------------------------------------------------------- firms */
  const firmMatch = name.match(/^firms-(\d+)$/);
  if (firmMatch) {
    const chunk = Number(firmMatch[1]) - 1;
    const out: { slug: string }[] = [];
    for (let p = 0; p < CHUNK / PAGE; p++) {
      const from = chunk * CHUNK + p * PAGE;
      const { data } = await supabase
        .from("lawyers")
        .select("slug")
        .eq("status", "live")
        .order("slug")
        .range(from, from + PAGE - 1);
      const rows = data ?? [];
      out.push(...rows);
      if (rows.length < PAGE) break;
    }
    return render(out.map((r) => ({ loc: `${SITE.url}/firm/${r.slug}`, priority: 0.6 })));
  }

  /* -------------------------------------------- practice × every place */
  const paMatch = name.match(/^practice-(.+)$/);
  if (paMatch) {
    const slug = paMatch[1];
    const { data: area } = await supabase
      .from("practice_areas").select("slug").eq("slug", slug).maybeSingle();
    if (!area) notFound();

    // Only emit suburb pages that will actually have bodies on them: either
    // firms in this specialty, or enough local general practices to be useful.
    const { data: rows } = await supabase.rpc("pa_suburb_counts", { pa: slug, lim: 1500 });
    const specific = (rows as { slug: string; n: number }[] | null) ?? [];

    const suburbs = await suburbsWithAtLeast(3, 3000);

    const seen = new Set(specific.map((s) => s.slug));
    return render([
      ...STATES.map((s) => ({ loc: `${SITE.url}/${slug}/${s.slug}`, priority: 0.8 })),
      ...specific.map((s) => ({ loc: `${SITE.url}/${slug}/${s.slug}`, priority: 0.7 })),
      ...suburbs
        .filter((s) => !seen.has(s.slug))
        .map((s) => ({ loc: `${SITE.url}/${slug}/${s.slug}`, priority: 0.4 })),
    ]);
  }

  notFound();
}
