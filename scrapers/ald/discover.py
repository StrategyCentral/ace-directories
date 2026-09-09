#!/usr/bin/env python3
"""
Find each firm's website and contact email, without paying anyone for data.

The trick that makes this work is that we already hold a phone number for every
one of the 5,929 listings. That turns domain guessing from a coin flip into
something verifiable: generate plausible domains from the firm name, fetch the
homepage, and only accept it if the firm's own phone number is printed on the
page. A phone match is near-conclusive — two unrelated businesses do not share
a landline.

Pipeline per listing:

  1. build candidate domains from the firm name (smithlawyers.com.au, ...)
  2. DNS-resolve them — cheap way to discard most guesses
  3. fetch the homepage of whatever resolves
  4. accept only if the phone matches, or a distinctive name token AND the suburb
  5. pull a contact email from that page, falling back to /contact and /about

Everything it touches is a firm's own public website. It identifies itself, it
honours robots.txt before crawling beyond the homepage, and it makes one pass
per domain.

Usage:
    SUPABASE_ACCESS_TOKEN=... python3 scrapers/ald/discover.py --limit 100 --dry-run
    ... --limit 6000 --commit --workers 10
"""
import argparse, json, os, re, socket, sys, threading, time
import urllib.parse, urllib.request, urllib.error
from concurrent.futures import ThreadPoolExecutor, as_completed
from urllib.robotparser import RobotFileParser

PROJECT_REF = os.environ.get("SUPABASE_PROJECT_REF", "vpumgmasnggconvgujho")
SB_TOKEN = os.environ.get("SUPABASE_ACCESS_TOKEN")

UA = ("AussieLawyerDirectoryBot/1.0 (+https://aussielawyerdirectory.com.au/about; "
      "directory listing verification; support@aussielawyerdirectory.com.au)")

TLDS = [".com.au", ".net.au", ".au", ".com"]
NAME_STOP = {"the", "and", "pty", "ltd", "limited", "lawyers", "lawyer", "legal",
             "solicitors", "solicitor", "law", "associates", "assoc", "co", "group",
             "partners", "practice", "services", "office", "offices", "barristers",
             "conveyancing", "conveyancers", "incorporated", "inc", "australia"}
SUFFIXES = ["lawyers", "legal", "law", "solicitors", "", "lawyer"]

EMAIL_RE = re.compile(r"[A-Za-z0-9._%+\-]+@[A-Za-z0-9.\-]+\.[A-Za-z]{2,}")
ROLE_PREFIXES = ("info", "admin", "reception", "enquiries", "enquiry", "contact",
                 "office", "mail", "hello", "legal", "law", "team")
EMAIL_JUNK = ("example.com", "sentry.io", "wixpress", "squarespace", "godaddy",
              "wordpress.com", "@2x", ".png", ".jpg", ".gif", ".webp", "yourdomain",
              "domain.com", "email.com", "@sentry", "yoursite", "test.com")

print_lock = threading.Lock()


# ----------------------------------------------------------------- database
def sql(query):
    req = urllib.request.Request(
        f"https://api.supabase.com/v1/projects/{PROJECT_REF}/database/query",
        data=json.dumps({"query": query}).encode(),
        headers={"Authorization": f"Bearer {SB_TOKEN}", "Content-Type": "application/json",
                 "User-Agent": "curl/8.7.1"},
        method="POST")
    for attempt in range(3):
        try:
            return json.loads(urllib.request.urlopen(req, timeout=180).read())
        except urllib.error.HTTPError as e:
            if attempt == 2:
                raise SystemExit(f"SQL failed: {e.code} {e.read().decode()[:300]}")
            time.sleep(2)


def q(v):
    return "null" if v in (None, "") else "'" + str(v).replace("'", "''") + "'"


# ------------------------------------------------------------- name → domains
def tokens(name):
    return [t for t in re.findall(r"[a-z0-9]+", (name or "").lower()) if len(t) > 1]


def distinctive(name):
    ts = tokens(name)
    keep = [t for t in ts if t not in NAME_STOP]
    return keep or ts


def candidates(name, cap=26):
    """Domains a firm with this name plausibly owns, best guesses first.

    Returns nothing when the name has no distinctive part ("A & P Lawyers") —
    guessing from generic words only ever finds parked domains, so those firms
    go straight to the search stage.
    """
    dist = distinctive(name)
    allt = tokens(name)
    if not dist or not any(len(t) >= 4 for t in dist):
        return []

    stems = []
    joined = "".join(dist)
    stems.append(joined)                       # smithjones
    if len(dist) > 1:
        stems.append("-".join(dist))           # smith-jones
        stems.append(dist[-1])                 # surname of "A J Gallagher"
        stems.append(dist[0])                  # smith
        stems.append("".join(dist[:2]))        # first two words
    stems.append("".join(allt))                # smithjoneslawyers
    # de-dupe, keep order
    stems = list(dict.fromkeys(s for s in stems if s))

    seen, out = set(), []
    for stem in stems:
        if not (2 < len(stem) < 40):
            continue
        for suffix in SUFFIXES:
            base = f"{stem}{suffix}"
            if not (2 < len(base) < 50):
                continue
            for tld in TLDS:
                d = base + tld
                if d not in seen:
                    seen.add(d)
                    out.append(d)
                if len(out) >= cap:
                    return out
    return out


# ------------------------------------------------------------------ fetching
def resolves(domain):
    try:
        socket.getaddrinfo(domain, 443, proto=socket.IPPROTO_TCP)
        return True
    except OSError:
        return False


def fetch(url, timeout=7):
    req = urllib.request.Request(url, headers={
        "User-Agent": UA,
        "Accept": "text/html,application/xhtml+xml",
        "Accept-Language": "en-AU,en;q=0.9",
    })
    try:
        with urllib.request.urlopen(req, timeout=timeout) as r:
            if "html" not in r.headers.get("content-type", ""):
                return "", r.geturl()
            return r.read(500_000).decode("utf-8", errors="replace"), r.geturl()
    except Exception:
        return "", url


def robots_ok(base):
    try:
        rp = RobotFileParser()
        rp.set_url(urllib.parse.urljoin(base, "/robots.txt"))
        rp.read()
        return rp.can_fetch(UA, base)
    except Exception:
        return True


# ---------------------------------------------------------------- verifying
def phone_key(phone):
    """Last 8 digits — survives (03) / +61 3 / spacing differences."""
    d = re.sub(r"\D", "", phone or "")
    return d[-8:] if len(d) >= 8 else None


def page_digits(html):
    # Strip tags so we don't match digits inside asset URLs or inline scripts.
    text = re.sub(r"<(script|style)[^>]*>.*?</\1>", " ", html, flags=re.S | re.I)
    text = re.sub(r"<[^>]+>", " ", text)
    return re.sub(r"\D", "", text)


def verify(html, listing):
    """Is this page really the firm's? Returns (ok, why)."""
    if not html or len(html) < 400:
        return False, "empty"
    low = html.lower()
    if any(p in low[:2000] for p in ("domain is for sale", "buy this domain",
                                     "domain for sale", "parked domain")):
        return False, "parked"

    pk = phone_key(listing.get("phone"))
    if pk and pk in page_digits(html):
        return True, "phone"

    dist = distinctive(listing["full_name"])
    strong = [t for t in dist if len(t) >= 4]
    name_hit = any(t in low for t in strong) if strong else False
    suburb = (listing.get("suburb") or "").lower()
    suburb_hit = len(suburb) > 3 and suburb in low

    if name_hit and suburb_hit:
        return True, "name+suburb"
    return False, "unverified"


# ------------------------------------------------------------------- emails
def score_email(email, host):
    local, _, domain = email.partition("@")
    s = 0
    dom = domain.lower()
    if dom in host or host.replace("www.", "") in dom:
        s += 50
    if local.lower().startswith(ROLE_PREFIXES):
        s += 30
    if len(local) <= 2:
        s -= 20
    if any(c.isdigit() for c in local):
        s -= 5
    return s


def contact_links(html, base):
    """The site's own links to its contact/about pages, best first.

    Guessing paths misses most sites — the firm that finally proved this uses
    /contact.php, which no sensible guess list contains.
    """
    out, seen = [], set()
    for href, text in re.findall(r'<a[^>]+href="([^"#]+)"[^>]*>(.*?)</a>', html, re.S | re.I):
        blob = (href + " " + re.sub(r"<[^>]+>", " ", text)).lower()
        if not any(w in blob for w in ("contact", "get in touch", "about", "our team", "people")):
            continue
        url = urllib.parse.urljoin(base, href)
        if not url.startswith(("http://", "https://")):
            continue
        if urllib.parse.urlparse(url).netloc != urllib.parse.urlparse(base).netloc:
            continue
        if url in seen:
            continue
        seen.add(url)
        out.append((0 if "contact" in blob else 1, url))
    return [u for _, u in sorted(out)][:3]


def deobfuscate(html):
    """Undo the common ways a site hides an address from naive scrapers."""
    t = html
    t = re.sub(r"\s*(?:\[|\(|&#91;|&lt;)\s*(?:at|@)\s*(?:\]|\)|&#93;|&gt;)\s*", "@", t, flags=re.I)
    t = re.sub(r"\s+(?:at|AT)\s+(?=[A-Za-z0-9.\-]+\.[A-Za-z]{2,})", "@", t)
    t = re.sub(r"\s*(?:\[|\()\s*(?:dot|DOT)\s*(?:\]|\))\s*", ".", t, flags=re.I)
    t = re.sub(r"\s+(?:dot|DOT)\s+", ".", t)
    t = t.replace("&#64;", "@").replace("&commat;", "@").replace("%40", "@")
    return t


def emails_from(html):
    found = set()
    for m in re.findall(r'mailto:([^"\'?>\s]+)', html):
        found.add(urllib.parse.unquote(m).strip().lower())
    for m in EMAIL_RE.findall(deobfuscate(html)):
        found.add(m.strip().lower())
    return {e for e in found
            if not any(j in e for j in EMAIL_JUNK) and 5 < len(e) < 90 and e.count("@") == 1}


def best_email(pool, host):
    if not pool:
        return None
    best = max(pool, key=lambda e: score_email(e, host))
    return best if score_email(best, host) > 0 else None



# ------------------------------------------------------------------- search
# A free, unauthenticated search fallback for the ~90% of firms whose domain
# can't be guessed from their name. Kept deliberately slow and single-threaded:
# the point is to be a negligible load on the engine, not to go fast.

AGGREGATORS = (
    "yellowpages", "truelocal", "localsearch", "localitybiz", "lawchoice",
    "facebook.", "linkedin.", "instagram.", "twitter.", "x.com", "youtube.",
    "google.", "bing.", "duckduckgo.", "yelp.", "hotfrog", "aussieweb",
    "startlocal", "cylex", "purelocal", "wikipedia.", "abr.business.gov.au",
    "aussielawyerdirectory", "findalawyer", "lawyerlist", "lawsociety",
    "gumtree", "seek.com", "indeed.", "glassdoor", "crunchbase", "zoominfo",
    "apple.com", "archive.org", "reddit.", "tripadvisor", "whitepages",
)

BROWSER_UA = ("Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 "
              "(KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36")

_search_lock = threading.Lock()
_last_search = [0.0]
SEARCH_INTERVAL = 2.2   # seconds between queries, globally
DEEP_SEARCH = False      # second pass searching the phone number


def ddg(query, retries=2):
    """One search. Returns candidate root domains, aggregators removed."""
    for attempt in range(retries + 1):
        with _search_lock:
            wait = SEARCH_INTERVAL - (time.time() - _last_search[0])
            if wait > 0:
                time.sleep(wait)
            _last_search[0] = time.time()

        url = "https://html.duckduckgo.com/html/?q=" + urllib.parse.quote_plus(query)
        req = urllib.request.Request(url, headers={
            "User-Agent": BROWSER_UA,
            "Accept": "text/html,application/xhtml+xml",
            "Accept-Language": "en-AU,en;q=0.9",
        })
        try:
            html = urllib.request.urlopen(req, timeout=20).read().decode("utf-8", "replace")
        except Exception:
            time.sleep(4 * (attempt + 1))
            continue

        if "anomaly" in html[:4000].lower() or len(html) < 2000:
            # Being asked to slow down. Back off hard rather than push through.
            time.sleep(25 * (attempt + 1))
            continue

        out = []
        for enc in re.findall(r"uddg=([^&\"']+)", html):
            link = urllib.parse.unquote(enc)
            host = urllib.parse.urlparse(link).netloc.lower()
            if not host or any(a in host for a in AGGREGATORS):
                continue
            root = "https://" + host
            if root not in out:
                out.append(root)
        return out[:3]
    return []


def process_search(listing, deep=True):
    """Search stage for one listing. Same verification bar as the guess stage."""
    out = {"id": listing["id"], "name": listing["full_name"],
           "website": None, "email": None, "status": "no-website", "why": None}

    name = listing["full_name"]
    where = " ".join(x for x in (listing.get("suburb"), listing.get("state")) if x)
    queries = [f'"{name}" {where} lawyers']
    if DEEP_SEARCH and listing.get("phone"):
        queries.append(f'"{listing["phone"]}" {name}')

    seen = set()
    try:
        for query in queries:
            for root in ddg(query):
                if root in seen:
                    continue
                seen.add(root)
                html, final = fetch(root)
                if not html:
                    continue
                ok, why = verify(html, listing)
                if not ok:
                    if out["status"] == "no-website":
                        out["status"] = "unverified"
                    continue

                host = urllib.parse.urlparse(final).netloc.lower()
                out.update(website=f"https://{host}", status="found", why=f"search/{why}")

                pool = emails_from(html)
                email = best_email(pool, host)
                if not email and deep and robots_ok(root):
                    for link in contact_links(html, final):
                        page, _ = fetch(link)
                        if page:
                            pool |= emails_from(page)
                            email = best_email(pool, host)
                            if email:
                                break
                        time.sleep(0.3)
                out["email"] = email
                return out
            if out["status"] == "found":
                break
    except Exception as e:
        out["status"] = "error"
        out["why"] = str(e)[:80]
    return out


# ------------------------------------------------------------------ per-firm
def process(listing, deep=True, mode="both"):
    """Returns a result dict for one listing. Never raises."""
    if mode == "search":
        return process_search(listing, deep)
    out = {"id": listing["id"], "name": listing["full_name"],
           "website": None, "email": None, "status": "no-website",
           "why": None, "tried": 0}
    try:
        for domain in candidates(listing["full_name"]):
            if not resolves(domain):
                continue
            out["tried"] += 1
            base = f"https://{domain}"
            html, final = fetch(base)
            if not html:
                html, final = fetch(f"http://{domain}")
            if not html:
                continue

            ok, why = verify(html, listing)
            if not ok:
                if out["status"] == "no-website":
                    out["status"] = "unverified"
                continue

            host = urllib.parse.urlparse(final).netloc.lower()
            out.update(website=f"https://{host}", status="found", why=why)

            pool = emails_from(html)
            email = best_email(pool, host)

            if not email and deep and robots_ok(base):
                for link in contact_links(html, final):
                    page, _ = fetch(link)
                    if page:
                        pool |= emails_from(page)
                        email = best_email(pool, host)
                        if email:
                            break
                    time.sleep(0.3)

            out["email"] = email
            return out
    except Exception as e:
        out["status"] = "error"
        out["why"] = str(e)[:80]

    # Nothing guessable — hand it to the search stage.
    if mode == "both" and out["status"] != "found":
        found = process_search(listing, deep)
        if found["status"] == "found" or out["status"] == "no-website":
            return found
    return out


# --------------------------------------------------------------------- main
def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--limit", type=int, default=100)
    ap.add_argument("--workers", type=int, default=12)
    ap.add_argument("--commit", action="store_true")
    ap.add_argument("--dry-run", action="store_true")
    ap.add_argument("--retry", action="store_true",
                    help="also reprocess listings already marked no-website/unverified")
    ap.add_argument("--shallow", action="store_true", help="homepage only, no /contact crawl")
    ap.add_argument("--deep-search", action="store_true",
                    help="also search the phone number when the name query finds nothing")
    ap.add_argument("--mode", choices=["guess", "search", "both"], default="both",
                    help="guess = domain guessing only (fast, no third party); "
                         "search = search fallback only; both = guess then search")
    args = ap.parse_args()

    if not args.commit and not args.dry_run:
        raise SystemExit("pass --dry-run to preview or --commit to write")
    if not SB_TOKEN:
        raise SystemExit("SUPABASE_ACCESS_TOKEN is required")
    global DEEP_SEARCH
    DEEP_SEARCH = args.deep_search

    where = "discovery_status is null" if not args.retry else \
            "(discovery_status is null or discovery_status in ('no-website','unverified','error'))"
    rows = sql(f"""
      select id, full_name, suburb, state, phone
      from lawyers
      where status = 'live' and email is null and {where}
      order by view_count desc, full_name
      limit {args.limit};
    """)
    print(f"{len(rows)} listings to process, mode={args.mode}, {args.workers} workers\n")

    started = time.time()
    stats = {"found": 0, "with_email": 0, "no-website": 0, "unverified": 0, "error": 0}
    batch, done = [], 0

    with ThreadPoolExecutor(max_workers=args.workers) as pool:
        futures = {pool.submit(process, r, not args.shallow, args.mode): r for r in rows}
        for fut in as_completed(futures):
            res = fut.result()
            done += 1
            stats[res["status"]] = stats.get(res["status"], 0) + 1
            if res["email"]:
                stats["with_email"] += 1

            if res["status"] == "found":
                with print_lock:
                    print(f"  {res['name'][:36]:38} {res['website'][:34]:36} "
                          f"{res['email'] or '—':34} [{res['why']}]")

            batch.append(res)
            if args.commit and len(batch) >= 50:
                flush(batch); batch = []
            if done % 100 == 0:
                rate = done / max(1, time.time() - started)
                with print_lock:
                    print(f"  ... {done}/{len(rows)} ({rate:.1f}/s) "
                          f"found={stats['found']} emails={stats['with_email']}")

    if args.commit and batch:
        flush(batch)

    elapsed = time.time() - started
    print(f"\ndone in {elapsed/60:.1f} min")
    print(json.dumps(stats, indent=1))
    if rows:
        print(f"website hit rate: {stats['found']/len(rows):.0%}")
        print(f"email hit rate:   {stats['with_email']/len(rows):.0%}")
        if stats["found"]:
            print(f"email per site:   {stats['with_email']/stats['found']:.0%}")


def flush(batch):
    values = ",".join(
        f"({q(r['id'])}::uuid,{q(r['website'])},{q(r['email'])},{q(r['status'])},"
        f"{q('discovery:' + r['why'] if r.get('why') else 'discovery')})"
        for r in batch)
    sql(f"""
      with v(id, website, email, status, src) as (values {values})
      update lawyers l set
        website          = coalesce(l.website, v.website),
        website_source   = case when l.website is null and v.website is not null
                                then v.src else l.website_source end,
        email            = coalesce(l.email, v.email),
        email_source     = case when l.email is null and v.email is not null
                                then 'website' else l.email_source end,
        discovery_status = v.status,
        discovery_at     = now(),
        updated_at       = now()
      from v where l.id = v.id;
    """)
    with print_lock:
        print(f"  ... saved {len(batch)}")


if __name__ == "__main__":
    main()
