#!/usr/bin/env python3
"""
ALD Bulk Loader — Import existing lawyer/firm listings into Supabase.
Usage: python bulk_loader.py --csv ALD-EXISTING-LISTINGS.csv [--dry-run]
"""

import csv
import re
import sys
import argparse
import unicodedata
from supabase import create_client
from config import (
    SUPABASE_URL, SUPABASE_SERVICE_KEY,
    PRACTICE_AREA_INFERENCE, FIRM_SIGNALS
)
from tqdm import tqdm


def slugify(text: str) -> str:
    text = unicodedata.normalize("NFKD", text)
    text = text.encode("ascii", "ignore").decode("ascii")
    text = re.sub(r"[^\w\s-]", "", text).strip().lower()
    return re.sub(r"[-\s]+", "-", text)


def normalise_phone(phone: str, state: str = "") -> str:
    if not phone or not phone.strip():
        return ""
    phone = re.sub(r"[^\d+]", "", phone.strip())
    if len(phone) == 8:
        # Local number — prepend state area code
        area_codes = {"NSW": "02", "ACT": "02", "VIC": "03", "TAS": "03",
                      "QLD": "07", "SA": "08", "WA": "08", "NT": "08"}
        prefix = area_codes.get(state, "")
        phone = prefix + phone if prefix else phone
    if len(phone) == 10 and phone.startswith("0"):
        return f"{phone[:4]} {phone[4:8]} {phone[8:]}"
    return phone


def classify_entity(name: str) -> str:
    return "firm" if any(s.lower() in name.lower() for s in FIRM_SIGNALS) else "individual"


def infer_practice_areas(name: str) -> list[str]:
    name_lower = name.lower()
    found = []
    for keyword, area in PRACTICE_AREA_INFERENCE.items():
        if keyword in name_lower and area not in found:
            found.append(area)
    return found or ["general-law"]


def get_or_create_tenant(supabase, slug: str = "ald") -> str:
    result = supabase.table("tenants").select("id").eq("slug", slug).execute()
    if result.data:
        tid = result.data[0]["id"]
        print(f"✓ Found existing tenant '{slug}': {tid}")
        return tid
    # Create it
    row = supabase.table("tenants").insert({
        "slug": slug,
        "name": "Aussie Lawyer Directory",
        "tenant_type": "lawyer_directory",
        "country": "AU",
        "region": "national",
        "domain": "aussielawyerdirectory.com.au",
        "status": "building",
        "brand_json": {
            "primaryColor": "#1a3a5c",
            "accentColor": "#c9a84c",
            "agentName": "Lexie"
        }
    }).execute()
    tid = row.data[0]["id"]
    print(f"✓ Created tenant '{slug}': {tid}")
    return tid


def load_csv(path: str) -> list[dict]:
    with open(path, newline="", encoding="utf-8") as f:
        return list(csv.DictReader(f))


def build_lawyer_record(row: dict, tenant_id: str) -> dict:
    state = row.get("state", "").strip()
    name = row.get("name", "").strip()
    slug = row.get("slug", "").strip() or slugify(name)

    return {
        "tenant_id": tenant_id,
        "full_name": name,
        "slug": slug,
        "entity_type": classify_entity(name),
        "practice_areas": infer_practice_areas(name),
        "phone": normalise_phone(row.get("phone", ""), state),
        "website": row.get("website", "") or None,
        "address": row.get("street", "") or None,
        "suburb": row.get("city", "") or None,
        "state": state or None,
        "postcode": row.get("postcode", "") or None,
        "full_address": row.get("full_address", "") or None,
        "lat": float(row["lat"]) if row.get("lat") else None,
        "lng": float(row["lng"]) if row.get("lng") else None,
        "tier": "free",
        "source": "ald_historical_import",
        "source_url": row.get("original_url", "") or None,
        "outreach_status": "pending",
    }


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--csv", required=True, help="Path to ALD-EXISTING-LISTINGS.csv")
    parser.add_argument("--dry-run", action="store_true", help="Parse but don't write to Supabase")
    parser.add_argument("--batch-size", type=int, default=100)
    args = parser.parse_args()

    if not SUPABASE_SERVICE_KEY:
        print("ERROR: SUPABASE_SERVICE_ROLE_KEY not set in environment")
        sys.exit(1)

    supabase = create_client(SUPABASE_URL, SUPABASE_SERVICE_KEY)
    tenant_id = get_or_create_tenant(supabase)

    rows = load_csv(args.csv)
    print(f"Loaded {len(rows):,} records from CSV")

    records = [build_lawyer_record(r, tenant_id) for r in rows]

    # Filter out junk (non-AU states, missing names)
    au_states = {"NSW", "VIC", "QLD", "WA", "SA", "TAS", "ACT", "NT", ""}
    records = [r for r in records if r["state"] in au_states and r["full_name"]]
    print(f"After filtering: {len(records):,} valid records")

    if args.dry_run:
        print("DRY RUN — sample record:")
        import json
        print(json.dumps(records[0], indent=2))
        return

    # Batch upsert
    errors = 0
    for i in tqdm(range(0, len(records), args.batch_size), desc="Uploading"):
        batch = records[i:i + args.batch_size]
        try:
            supabase.table("lawyers").upsert(batch, on_conflict="slug").execute()
        except Exception as e:
            print(f"\nBatch {i}-{i+len(batch)} error: {e}")
            errors += 1

    print(f"\n✓ Done. {len(records):,} records processed. {errors} batch errors.")


if __name__ == "__main__":
    main()
