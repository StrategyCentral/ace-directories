import { NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Authenticated proxy to our private SearXNG instance.
 *
 * SearXNG runs on Railway's private network with no public domain, because an
 * open SearXNG instance on the internet gets discovered and abused quickly.
 * This route is the only way in, and it reuses CRON_SECRET so there is one
 * fewer credential to manage.
 *
 *   GET /api/search?q=...&engines=duckduckgo,brave
 *   Authorization: Bearer $CRON_SECRET
 */
const AGGREGATORS = [
  "yellowpages", "truelocal", "localsearch", "localitybiz", "lawchoice",
  "facebook.", "linkedin.", "instagram.", "twitter.", "x.com", "youtube.",
  "google.", "bing.", "duckduckgo.", "yelp.", "hotfrog", "aussieweb",
  "startlocal", "cylex", "purelocal", "wikipedia.", "abr.business.gov.au",
  "aussielawyerdirectory", "findalawyer", "lawyerlist", "lawsociety",
  "gumtree", "seek.com", "indeed.", "glassdoor", "crunchbase", "zoominfo",
  "apple.com", "archive.org", "reddit.", "tripadvisor", "whitepages",
  "pinkpages", "lawyersin.", "wordofmouth", "yellowpages.com.au", "localsearch.",
  "australianlawyers", "onlylawyers", "lawtap", "oneflare", "airtasker",
  "trustpilot", "productreview", "threebestrated", "cybo.com", "brownbook",
  "bestlawyers.com", "dlook.com", "gotocourt", "dailymail", "news.com.au",
  "smh.com.au", "theage.com.au", "abc.net.au", "couriermail", "heraldsun",
  "justlanded", "startupsmart", "bizapedia", "opencorporates", "dnb.com",
];

export async function GET(req: Request) {
  const url = new URL(req.url);
  const secret = process.env.CRON_SECRET;
  const auth = req.headers.get("authorization");
  if (!secret || (auth !== `Bearer ${secret}` && url.searchParams.get("token") !== secret)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const q = (url.searchParams.get("q") ?? "").trim();
  if (!q) return NextResponse.json({ error: "Missing q" }, { status: 400 });

  const base = process.env.SEARXNG_URL;
  if (!base) {
    return NextResponse.json({ error: "SEARXNG_URL is not configured" }, { status: 503 });
  }

  const target = new URL("/search", base);
  target.searchParams.set("q", q);
  target.searchParams.set("format", "json");
  target.searchParams.set("language", "en-AU");
  // Most engines refuse traffic from datacenter IPs, so a self-hosted SearXNG on
  // Railway gets zero results from Google, DuckDuckGo, Brave, Startpage, Qwant
  // and Mojeek. Bing and Yahoo still answer, and between them they index
  // Australian business sites well enough for this job. Measured, not assumed.
  const engines = url.searchParams.get("engines") ?? "bing,yahoo";
  target.searchParams.set("engines", engines);

  try {
    const res = await fetch(target, {
      headers: { accept: "application/json" },
      signal: AbortSignal.timeout(20_000),
      cache: "no-store",
    });
    if (!res.ok) {
      return NextResponse.json(
        { error: `searxng responded ${res.status}` },
        { status: 502 },
      );
    }

    const json = (await res.json()) as {
      results?: { url?: string; title?: string; content?: string }[];
    };

    // Collapse to unique root domains and drop the directories and social
    // profiles — the caller wants the firm's own site, nothing else.
    const seen = new Set<string>();
    const sites: { url: string; host: string; title: string }[] = [];
    for (const r of json.results ?? []) {
      if (!r.url) continue;
      let host: string;
      try {
        host = new URL(r.url).hostname.toLowerCase();
      } catch {
        continue;
      }
      if (AGGREGATORS.some((a) => host.includes(a))) continue;
      const root = host.replace(/^www\./, "");
      if (seen.has(root)) continue;
      seen.add(root);
      sites.push({ url: `https://${host}`, host, title: (r.title ?? "").slice(0, 120) });
      if (sites.length >= 6) break;
    }

    return NextResponse.json({ q, count: sites.length, sites });
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "search failed" },
      { status: 502 },
    );
  }
}
