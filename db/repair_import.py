#!/usr/bin/env python3
"""
Repair + enrich the legacy ALD import.

The 2026 bulk load put 5,929 records into `lawyers` but mangled phone numbers
("0297 2387 93") and dumped 92% of listings into a single `general-law` bucket.
This script re-reads the authoritative CSV export and:

  1. restores correctly formatted phone numbers
  2. rebuilds the `suburbs` table from real listing geography
  3. infers practice areas from firm names (a firm called "Smith Family Law"
     belongs in /family-lawyers/, not /general-practice/)
  4. writes original_url / legacy_post_id so old URLs can be preserved
  5. scores every profile 0-100 for completeness — this drives the "your listing
     is incomplete" nudge that powers the claim funnel

Usage:  SUPABASE_ACCESS_TOKEN=sbp_... python3 db/repair_import.py [--dry-run]
"""
import csv, json, os, re, sys, urllib.request, unicodedata

PROJECT_REF = os.environ.get("SUPABASE_PROJECT_REF", "vpumgmasnggconvgujho")
TOKEN = os.environ.get("SUPABASE_ACCESS_TOKEN")
CSV_PATH = os.environ.get(
    "ALD_CSV",
    "/Users/brendo/ACE-Obsidian-Memory/PROJECTS/ACE Profit Lab/Directories/ALD/ALD-EXISTING-LISTINGS.csv",
)
DRY = "--dry-run" in sys.argv

STATES = {"NSW", "VIC", "QLD", "WA", "SA", "TAS", "ACT", "NT"}
MAJOR = {
    "sydney", "melbourne", "brisbane", "perth", "adelaide", "canberra", "hobart",
    "darwin", "gold coast", "newcastle", "wollongong", "geelong", "townsville",
    "cairns", "toowoomba", "ballarat", "bendigo", "launceston", "sunshine coast",
    "parramatta", "liverpool", "penrith", "chatswood", "dandenong", "frankston",
}

# name keyword -> practice area slug. Ordered: first match wins for the primary.
KEYWORDS = [
    (r"\bconveyanc", "conveyancers"),
    (r"\bfamily\b|\bdivorce\b|\bcustody\b|\bmatrimonial\b", "family-lawyers"),
    (r"\bcriminal\b|\bdefence\b|\bdefense\b", "criminal-lawyers"),
    (r"\btraffic\b|\bdrink driv|\bdui\b", "traffic-lawyers"),
    (r"\bimmigration\b|\bmigration\b|\bvisa\b", "immigration-lawyers"),
    (r"\bcompensation\b|\bpersonal injur|\binjury\b|\bno win\b", "personal-injury-lawyers"),
    (r"\bworkers comp|\bworkcover\b", "workers-compensation-lawyers"),
    (r"\bmedical negligence\b|\bmed neg\b", "medical-negligence-lawyers"),
    (r"\bemployment\b|\bworkplace\b|\bindustrial\b", "employment-lawyers"),
    (r"\bwills?\b|\bestates?\b|\bprobate\b|\bsuccession\b", "wills-estates-lawyers"),
    (r"\bproperty\b|\breal estate\b|\bconvey", "property-lawyers"),
    (r"\bcommercial\b|\bcorporate\b|\bmergers\b", "commercial-lawyers"),
    (r"\bbusiness\b", "business-lawyers"),
    (r"\btax(ation)?\b", "tax-lawyers"),
    (r"\bintellectual propert|\bpatent\b|\btrade ?mark", "ip-lawyers"),
    (r"\bdefamation\b|\bmedia law\b", "defamation-lawyers"),
    (r"\binsolvency\b|\bbankrupt", "insolvency-lawyers"),
    (r"\bconstruction\b|\bbuilding\b", "construction-lawyers"),
    (r"\blitigation\b|\bdispute", "litigation-lawyers"),
    (r"\bdebt recovery\b|\bdebt collect", "debt-recovery-lawyers"),
    (r"\bfranchis", "franchise-lawyers"),
    (r"\bleasing\b|\btenanc", "tenancy-lawyers"),
    (r"\bplanning\b|\benvironment", "planning-environment-lawyers"),
    (r"\bbarrister|\bchambers\b|\b\bqc\b|\bsc\b", "barristers"),
    (r"\bmediat|\barbitrat", "mediators"),
    (r"\bnotary\b", "notary-public"),
    (r"\belder\b|\baged care\b", "elder-lawyers"),
]

# legacy slug -> new slug (arrays already in the DB)
LEGACY_MAP = {
    "family-law": "family-lawyers", "criminal-law": "criminal-lawyers",
    "property-law": "property-lawyers", "wills-estates": "wills-estates-lawyers",
    "employment-law": "employment-lawyers", "commercial-law": "commercial-lawyers",
    "immigration-law": "immigration-lawyers", "personal-injury": "personal-injury-lawyers",
    "intellectual-property": "ip-lawyers", "tax-law": "tax-lawyers",
    "environmental-law": "planning-environment-lawyers", "debt-insolvency": "insolvency-lawyers",
    "administrative-law": "administrative-lawyers", "media-defamation": "defamation-lawyers",
    "elder-law": "elder-lawyers", "traffic-law": "traffic-lawyers",
    "general-law": "general-practice",
}


def run_sql(sql):
    if DRY:
        print(sql[:400] + ("..." if len(sql) > 400 else ""))
        return []
    req = urllib.request.Request(
        f"https://api.supabase.com/v1/projects/{PROJECT_REF}/database/query",
        data=json.dumps({"query": sql}).encode(),
        headers={"Authorization": f"Bearer {TOKEN}", "Content-Type": "application/json",
                 "User-Agent": "curl/8.7.1"},
        method="POST")
    try:
        return json.loads(urllib.request.urlopen(req).read().decode())
    except urllib.error.HTTPError as e:
        raise SystemExit(f"SQL failed: {e.code} {e.read().decode()[:600]}\n---\n{sql[:600]}")


def q(v):
    """Quote a value for inline SQL."""
    if v is None or v == "":
        return "null"
    return "'" + str(v).replace("'", "''") + "'"


def slugify(s):
    s = unicodedata.normalize("NFKD", s or "").encode("ascii", "ignore").decode()
    s = re.sub(r"[^a-zA-Z0-9]+", "-", s).strip("-").lower()
    return re.sub(r"-{2,}", "-", s)


def format_phone(raw):
    """Normalise an Australian number to its conventional printed form."""
    if not raw:
        return None
    d = re.sub(r"\D", "", raw)
    if d.startswith("61") and len(d) in (11, 12):
        d = "0" + d[2:]
    if len(d) == 10 and d.startswith("04"):
        return f"{d[:4]} {d[4:7]} {d[7:]}"          # 0412 345 678
    if len(d) == 10 and d[:4] in ("1300", "1800"):
        return f"{d[:4]} {d[4:7]} {d[7:]}"          # 1300 123 456
    if len(d) == 10 and d.startswith("0"):
        return f"{d[:2]} {d[2:6]} {d[6:]}"          # 03 9123 4567
    if len(d) == 8:
        return f"{d[:4]} {d[4:]}"
    return raw.strip() or None


def infer_areas(name):
    hits = []
    low = " " + (name or "").lower() + " "
    for pattern, slug in KEYWORDS:
        if re.search(pattern, low) and slug not in hits:
            hits.append(slug)
    return hits[:3] or ["general-practice"]


def main():
    if not TOKEN and not DRY:
        raise SystemExit("SUPABASE_ACCESS_TOKEN is required")

    rows = list(csv.DictReader(open(CSV_PATH, newline="", encoding="utf-8-sig")))
    print(f"read {len(rows)} rows from CSV")

    # ---------------------------------------------------------------- suburbs
    subs = {}
    for r in rows:
        city, state = (r["city"] or "").strip(), (r["state"] or "").strip().upper()
        if not city or state not in STATES:
            continue
        slug = f"{slugify(city)}-{state.lower()}"
        if slug not in subs:
            subs[slug] = {
                "slug": slug, "name": city.title(), "state": state,
                "postcode": (r["postcode"] or "").strip()[:4] or None,
                "lat": r["lat"] or None, "lng": r["lng"] or None,
                "is_major": city.lower() in MAJOR,
            }
    print(f"derived {len(subs)} suburbs")

    values = ",".join(
        f"({q(s['slug'])},{q(s['name'])},{q(s['state'])},{q(s['postcode'])},"
        f"{s['lat'] or 'null'},{s['lng'] or 'null'},{str(s['is_major']).lower()})"
        for s in subs.values())
    run_sql("insert into suburbs (slug,name,state,postcode,lat,lng,is_major) values "
            + values +
            " on conflict (slug) do update set is_major = excluded.is_major, "
            "postcode = coalesce(suburbs.postcode, excluded.postcode);")

    # ------------------------------------------------------- listing repairs
    # Remap any legacy practice-area slugs still sitting in the arrays.
    for old, new in LEGACY_MAP.items():
        run_sql(f"update lawyers set practice_areas = array_replace(practice_areas, {q(old)}, {q(new)}) "
                f"where {q(old)} = any(practice_areas);")
    print("remapped legacy practice-area slugs")

    batch, done = [], 0
    for r in rows:
        slug = (r["slug"] or "").strip()
        if not slug:
            continue
        phone = format_phone(r["phone"])
        areas = infer_areas(r["name"])
        state = (r["state"] or "").strip().upper()
        city = (r["city"] or "").strip()
        sub_slug = f"{slugify(city)}-{state.lower()}" if city and state in STATES else None
        batch.append(
            f"({q(slug)},{q(phone)},array[{','.join(q(a) for a in areas)}]::text[],"
            f"{q(sub_slug)},{r['post_id'] or 'null'},{q(r['original_url'])},{q(r['street'])})")
        if len(batch) >= 400:
            done += flush(batch)
            batch = []
    if batch:
        done += flush(batch)
    print(f"repaired {done} listings")

    # ------------------------------------------------- derived scores + counts
    run_sql("""
      update lawyers set
        phone_display = phone,
        search_text   = lower(coalesce(full_name,'') || ' ' || coalesce(suburb,'') || ' ' ||
                              coalesce(state,'') || ' ' || coalesce(array_to_string(practice_areas,' '),'')),
        profile_score = least(100,
            (case when phone   is not null then 20 else 0 end) +
            (case when website is not null then 15 else 0 end) +
            (case when email   is not null then 10 else 0 end) +
            (case when bio     is not null then 20 else 0 end) +
            (case when photo_url is not null or logo_url is not null then 15 else 0 end) +
            (case when array_length(practice_areas,1) > 1 then 20 else 5 end)),
        rank_score = (case tier when 'dominator' then 1000 when 'featured' then 500
                                when 'verified' then 250 else 0 end)
                     + (case when is_claimed then 50 else 0 end)
                     + coalesce(review_avg,0) * 10
                     + least(coalesce(review_count,0), 25);
    """)
    run_sql("update suburbs s set listing_count = (select count(*) from lawyers l "
            "where l.suburb_id = s.id and l.status = 'live');")
    run_sql("update practice_areas p set listing_count = (select count(*) from lawyers l "
            "where p.slug = any(l.practice_areas) and l.status = 'live');")
    print("recomputed scores and counts")

    for row in run_sql("select slug, listing_count from practice_areas order by listing_count desc limit 12;"):
        print(f"  {row['slug']:34} {row['listing_count']}")


def flush(batch):
    run_sql(f"""
      with v(slug, phone, areas, sub_slug, post_id, orig_url, street) as (values {",".join(batch)})
      update lawyers l set
        phone          = v.phone,
        phone_display  = v.phone,
        practice_areas = v.areas,
        suburb_id      = s.id,
        legacy_post_id = v.post_id::int,
        original_url   = v.orig_url,
        address        = coalesce(l.address, v.street)
      from v left join suburbs s on s.slug = v.sub_slug
      where l.slug = v.slug;
    """)
    return len(batch)


if __name__ == "__main__":
    main()
