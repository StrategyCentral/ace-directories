#!/usr/bin/env python3
"""
Stage 1 of enrichment: find each listing on Google and fill in the fields the
legacy import never had — website, a verified phone number, rating and hours.

Places does NOT return email addresses. Nothing does. This stage exists to get
the *website*, which `email_harvest.py` then crawls for a contact address.

Cost, at the pricing that took effect March 2025 (per-SKU free monthly caps
replaced the pooled $200 credit):

    Text Search Pro         $32 / 1,000   first 5,000 calls each month free
    Text Search Enterprise  $35 / 1,000   first 1,000 calls each month free

`websiteUri`, `nationalPhoneNumber` and `rating` are Enterprise-tier fields, so
one Text Search call per listing bills at the Enterprise rate. For 5,929
listings that is roughly:

    (5,929 - 1,000) x $35 / 1,000  =  ~$172

Spreading the run across two calendar months halves it again. --limit exists so
you can prove the match quality on 50 records before spending anything.

Usage:
    GOOGLE_MAPS_API_KEY=... SUPABASE_ACCESS_TOKEN=... \
      python3 scrapers/ald/places_enrich.py --limit 50 --dry-run
    ... --limit 6000 --commit
"""
import argparse, json, os, re, sys, time, urllib.request, urllib.error

PROJECT_REF = os.environ.get("SUPABASE_PROJECT_REF", "vpumgmasnggconvgujho")
SB_TOKEN = os.environ.get("SUPABASE_ACCESS_TOKEN")
GKEY = os.environ.get("GOOGLE_MAPS_API_KEY")

PLACES_URL = "https://places.googleapis.com/v1/places:searchText"
FIELD_MASK = ",".join([
    "places.id",
    "places.displayName",
    "places.formattedAddress",
    "places.websiteUri",           # Enterprise
    "places.nationalPhoneNumber",  # Enterprise
    "places.rating",               # Enterprise
    "places.userRatingCount",      # Enterprise
    "places.regularOpeningHours",  # Enterprise
    "places.location",
    "places.types",
])


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
    if v is None or v == "":
        return "null"
    return "'" + str(v).replace("'", "''") + "'"


def search_place(name, suburb, state):
    """One Text Search call. Returns the best candidate or None."""
    body = json.dumps({
        "textQuery": f"{name} {suburb or ''} {state or ''} Australia".strip(),
        "maxResultCount": 1,
        "languageCode": "en-AU",
        "regionCode": "AU",
    }).encode()
    req = urllib.request.Request(PLACES_URL, data=body, headers={
        "Content-Type": "application/json",
        "X-Goog-Api-Key": GKEY,
        "X-Goog-FieldMask": FIELD_MASK,
    })
    try:
        data = json.loads(urllib.request.urlopen(req, timeout=30).read())
    except urllib.error.HTTPError as e:
        detail = e.read().decode()[:200]
        print(f"    ! places {e.code}: {detail}", file=sys.stderr)
        return None
    places = data.get("places") or []
    return places[0] if places else None


def normalise_website(url):
    """Drop tracking junk and obvious non-firm hosts."""
    if not url:
        return None
    url = url.split("?")[0].rstrip("/")
    host = re.sub(r"^https?://(www\.)?", "", url).split("/")[0].lower()
    if any(bad in host for bad in (
        "facebook.com", "instagram.com", "linkedin.com", "twitter.com", "x.com",
        "google.com", "yelp.com", "yellowpages", "truelocal", "localsearch",
        "aussielawyerdirectory",
    )):
        return None
    return url


def token_overlap(a, b):
    """Cheap name-similarity guard so we don't attach the wrong business."""
    stop = {"the", "and", "pty", "ltd", "limited", "lawyers", "lawyer", "legal",
            "solicitors", "solicitor", "law", "associates", "co", "group", "&"}
    ta = {w for w in re.findall(r"[a-z]+", a.lower()) if w not in stop}
    tb = {w for w in re.findall(r"[a-z]+", b.lower()) if w not in stop}
    if not ta or not tb:
        return 0.0
    return len(ta & tb) / len(ta)


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--limit", type=int, default=50)
    ap.add_argument("--commit", action="store_true", help="write results to the database")
    ap.add_argument("--dry-run", action="store_true")
    ap.add_argument("--min-match", type=float, default=0.5,
                    help="minimum name-token overlap to accept a match")
    ap.add_argument("--sleep", type=float, default=0.12)
    args = ap.parse_args()

    if not args.commit and not args.dry_run:
        raise SystemExit("pass --dry-run to preview or --commit to write")
    if not GKEY:
        raise SystemExit("GOOGLE_MAPS_API_KEY is required")
    if args.commit and not SB_TOKEN:
        raise SystemExit("SUPABASE_ACCESS_TOKEN is required to commit")

    # Only listings we haven't already enriched, busiest first so any partial
    # run still improves the pages that matter most.
    rows = sql(f"""
      select id, full_name, suburb, state, phone
      from lawyers
      where status = 'live'
        and website is null
        and google_place_id is null
      order by view_count desc, full_name
      limit {args.limit};
    """)

    print(f"{len(rows)} listings to enrich "
          f"(~${max(0, len(rows) - 1000) * 0.035:.2f} at Enterprise rates after the free 1,000)")

    stats = {"searched": 0, "matched": 0, "rejected": 0, "website": 0, "phone": 0, "updated": 0}
    updates = []

    for i, r in enumerate(rows, 1):
        place = search_place(r["full_name"], r["suburb"], r["state"])
        stats["searched"] += 1
        time.sleep(args.sleep)
        if not place:
            continue

        got_name = (place.get("displayName") or {}).get("text", "")
        score = token_overlap(r["full_name"], got_name)
        if score < args.min_match:
            stats["rejected"] += 1
            continue
        stats["matched"] += 1

        website = normalise_website(place.get("websiteUri"))
        phone = place.get("nationalPhoneNumber")
        if website:
            stats["website"] += 1
        if phone:
            stats["phone"] += 1

        if i <= 12 or args.dry_run:
            print(f"  {r['full_name'][:38]:40} -> {got_name[:30]:32} "
                  f"{'web' if website else '   '} {'tel' if phone else '   '} ({score:.2f})")

        updates.append((r["id"], place.get("id"), website, phone,
                        place.get("rating"), place.get("userRatingCount")))

        if args.commit and len(updates) >= 100:
            stats["updated"] += flush(updates)
            updates = []

    if args.commit and updates:
        stats["updated"] += flush(updates)

    print("\n" + json.dumps(stats, indent=1))


def flush(updates):
    values = ",".join(
        f"({q(lid)}::uuid,{q(pid)},{q(web)},{q(tel)},"
        f"{rating if rating is not None else 'null'},{count if count is not None else 'null'})"
        for lid, pid, web, tel, rating, count in updates)
    sql(f"""
      with v(id, place_id, website, tel, rating, rating_count) as (values {values})
      update lawyers l set
        google_place_id = v.place_id,
        website         = coalesce(l.website, v.website),
        phone           = coalesce(l.phone, v.tel),
        phone_display   = coalesce(l.phone_display, v.tel),
        rating          = v.rating,
        review_count    = coalesce(v.rating_count, l.review_count),
        review_avg      = coalesce(v.rating, l.review_avg),
        last_verified   = now(),
        updated_at      = now()
      from v where l.id = v.id;
    """)
    return len(updates)


if __name__ == "__main__":
    main()
