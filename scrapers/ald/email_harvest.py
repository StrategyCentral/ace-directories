#!/usr/bin/env python3
"""
Stage 2 of enrichment: find a contact email for each firm that has a website.

This is where the outreach list actually comes from — Google Places has never
returned email addresses and never will. We visit the firm's own site, look at
the pages a human would (home, contact, about), and take the address they
publish for the public to use.

Deliberately conservative:
  * one firm at a time, with a pause between requests
  * honours robots.txt
  * a real contact User-Agent so anyone checking their logs can find us
  * skips personal-looking addresses in favour of role addresses
    (info@, admin@, reception@) — those are the right ones to write to
  * never touches a site more than once

Usage:
    SUPABASE_ACCESS_TOKEN=... python3 scrapers/ald/email_harvest.py --limit 100 --dry-run
    ... --limit 3000 --commit
"""
import argparse, json, os, re, sys, time, urllib.parse, urllib.request, urllib.error
from urllib.robotparser import RobotFileParser

PROJECT_REF = os.environ.get("SUPABASE_PROJECT_REF", "vpumgmasnggconvgujho")
SB_TOKEN = os.environ.get("SUPABASE_ACCESS_TOKEN")

UA = ("AussieLawyerDirectoryBot/1.0 (+https://aussielawyerdirectory.com.au/about; "
      "listing verification; support@aussielawyerdirectory.com.au)")

CONTACT_PATHS = ["", "/contact", "/contact-us", "/contact.html", "/about", "/about-us"]

EMAIL_RE = re.compile(r"[A-Za-z0-9._%+\-]+@[A-Za-z0-9.\-]+\.[A-Za-z]{2,}")
ROLE_PREFIXES = ("info", "admin", "reception", "enquiries", "enquiry", "contact",
                 "office", "mail", "hello", "legal", "law")
JUNK = ("example.com", "sentry.io", "wixpress.com", "squarespace.com", "godaddy",
        "wordpress.com", "@2x", ".png", ".jpg", ".gif", ".webp", "yourdomain",
        "domain.com", "email.com", "sentry-next")


def sql(query):
    req = urllib.request.Request(
        f"https://api.supabase.com/v1/projects/{PROJECT_REF}/database/query",
        data=json.dumps({"query": query}).encode(),
        headers={"Authorization": f"Bearer {SB_TOKEN}", "Content-Type": "application/json",
                 "User-Agent": "curl/8.7.1"},
        method="POST")
    try:
        return json.loads(urllib.request.urlopen(req, timeout=120).read())
    except urllib.error.HTTPError as e:
        raise SystemExit(f"SQL failed: {e.code} {e.read().decode()[:400]}")


def q(v):
    return "null" if v in (None, "") else "'" + str(v).replace("'", "''") + "'"


def robots_ok(base):
    try:
        rp = RobotFileParser()
        rp.set_url(urllib.parse.urljoin(base, "/robots.txt"))
        rp.read()
        return rp.can_fetch(UA, base)
    except Exception:
        return True  # no robots.txt, or unreachable — treat as permitted


def fetch(url, timeout=12):
    req = urllib.request.Request(url, headers={
        "User-Agent": UA,
        "Accept": "text/html,application/xhtml+xml",
        "Accept-Language": "en-AU,en;q=0.9",
    })
    try:
        with urllib.request.urlopen(req, timeout=timeout) as r:
            ctype = r.headers.get("content-type", "")
            if "html" not in ctype:
                return ""
            return r.read(600_000).decode("utf-8", errors="replace")
    except Exception:
        return ""


def score(email, host):
    """Prefer a role address on the firm's own domain."""
    local, _, domain = email.partition("@")
    s = 0
    if domain.lower() in host or host in domain.lower():
        s += 50                      # same domain as the website — almost certainly theirs
    if local.lower().startswith(ROLE_PREFIXES):
        s += 30                      # a shared inbox someone actually reads
    if len(local) <= 3:
        s -= 10
    if any(c.isdigit() for c in local):
        s -= 5
    return s


def harvest(website):
    base = website if website.startswith("http") else f"https://{website}"
    host = re.sub(r"^https?://(www\.)?", "", base).split("/")[0].lower()

    if not robots_ok(base):
        return None, "robots"

    seen = set()
    for path in CONTACT_PATHS:
        html = fetch(urllib.parse.urljoin(base, path))
        if not html:
            continue
        # mailto: links are the firm's own considered choice — trust them first
        for m in re.findall(r'mailto:([^"\'?>\s]+)', html):
            seen.add(m.strip().lower())
        for m in EMAIL_RE.findall(html):
            seen.add(m.strip().lower())
        if seen:
            break
        time.sleep(0.4)

    candidates = [e for e in seen if not any(j in e.lower() for j in JUNK)]
    if not candidates:
        return None, "none-found"
    best = max(candidates, key=lambda e: score(e, host))
    return (best, "ok") if score(best, host) > 0 else (None, "low-confidence")


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--limit", type=int, default=100)
    ap.add_argument("--commit", action="store_true")
    ap.add_argument("--dry-run", action="store_true")
    ap.add_argument("--sleep", type=float, default=1.5, help="seconds between firms")
    args = ap.parse_args()
    if not args.commit and not args.dry_run:
        raise SystemExit("pass --dry-run to preview or --commit to write")

    rows = sql(f"""
      select id, full_name, website
      from lawyers
      where status = 'live' and email is null and website is not null
      order by view_count desc
      limit {args.limit};
    """)
    print(f"{len(rows)} firms with a website and no email on file")

    stats = {"tried": 0, "found": 0, "robots": 0, "none": 0, "low": 0}
    updates = []

    for r in rows:
        stats["tried"] += 1
        email, why = harvest(r["website"])
        if email:
            stats["found"] += 1
            updates.append((r["id"], email))
            print(f"  {r['full_name'][:40]:42} {email}")
        else:
            stats["robots" if why == "robots" else "low" if why == "low-confidence" else "none"] += 1
        time.sleep(args.sleep)

        if args.commit and len(updates) >= 50:
            flush(updates); updates = []

    if args.commit and updates:
        flush(updates)

    print("\n" + json.dumps(stats, indent=1))
    if stats["tried"]:
        print(f"hit rate: {stats['found'] / stats['tried']:.0%}")


def flush(updates):
    values = ",".join(f"({q(i)}::uuid,{q(e)})" for i, e in updates)
    sql(f"""
      with v(id, email) as (values {values})
      update lawyers l set email = v.email, updated_at = now()
      from v where l.id = v.id and l.email is null;
    """)
    print(f"  ... wrote {len(updates)}")


if __name__ == "__main__":
    main()
