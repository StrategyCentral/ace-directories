import { db } from "@/lib/supabase";
import { SITE, STATES } from "@/lib/site";

export const runtime = "nodejs";
export const revalidate = 86400;

/**
 * A single sitemap index pointing at chunked child sitemaps. The silo is far
 * too big for one file — practice × suburb alone runs into six figures.
 */
const CHUNK = 20000;

export async function GET() {
  const supabase = db();

  const [{ count: listingCount }, { count: suburbCount }, { data: areas }] = await Promise.all([
    supabase.from("lawyers").select("id", { count: "exact", head: true }).eq("status", "live"),
    supabase.from("suburbs").select("id", { count: "exact", head: true }).gt("listing_count", 0),
    supabase.from("practice_areas").select("slug"),
  ]);

  const firmPages = Math.ceil((listingCount ?? 0) / CHUNK) || 1;
  // Practice × suburb: one child sitemap per practice area.
  const areaCount = areas?.length ?? 0;

  const children = [
    `${SITE.url}/sitemaps/core.xml`,
    ...Array.from({ length: firmPages }, (_, i) => `${SITE.url}/sitemaps/firms-${i + 1}.xml`),
    `${SITE.url}/sitemaps/places.xml`,
    ...(areas ?? []).map((a) => `${SITE.url}/sitemaps/practice-${a.slug}.xml`),
  ];

  const now = new Date().toISOString();
  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${children.map((loc) => `  <sitemap><loc>${loc}</loc><lastmod>${now}</lastmod></sitemap>`).join("\n")}
</sitemapindex>`;

  return new Response(xml, {
    headers: {
      "content-type": "application/xml",
      "cache-control": "public, s-maxage=86400, stale-while-revalidate=604800",
      "x-sitemap-stats": `listings=${listingCount} suburbs=${suburbCount} areas=${areaCount}`,
    },
  });
}
