#!/usr/bin/env python3
"""
Google Places enrichment for ALD listings.
Adds: website, rating, review_count, business_hours, place_id.

Usage: python google_places_enricher.py [--state NSW] [--limit 1000] [--dry-run]
Cost:  ~$17 per 1,000 lookups (Text Search + Place Details)
"""

import time
import random
import argparse
import googlemaps
from supabase import create_client
from config import SUPABASE_URL, SUPABASE_SERVICE_KEY, GOOGLE_PLACES_API_KEY
from tqdm import tqdm


def search_place(gmaps, name: str, suburb: str, state: str) -> dict | None:
    query = f"{name} lawyers {suburb} {state} Australia"
    try:
        result = gmaps.places(query, type="lawyer")
        if result["status"] == "OK" and result["results"]:
            return result["results"][0]
    except Exception as e:
        print(f"Search error for '{name}': {e}")
    return None


def get_place_details(gmaps, place_id: str) -> dict | None:
    fields = [
        "name", "formatted_phone_number", "website",
        "rating", "user_ratings_total", "opening_hours",
        "formatted_address", "geometry"
    ]
    try:
        result = gmaps.place(place_id, fields=fields)
        if result["status"] == "OK":
            return result["result"]
    except Exception as e:
        print(f"Details error for place {place_id}: {e}")
    return None


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--state", help="Limit to state (e.g. NSW)")
    parser.add_argument("--limit", type=int, default=500)
    parser.add_argument("--dry-run", action="store_true")
    args = parser.parse_args()

    if not GOOGLE_PLACES_API_KEY:
        print("ERROR: GOOGLE_PLACES_API_KEY not set")
        return

    gmaps = googlemaps.Client(key=GOOGLE_PLACES_API_KEY)
    supabase = create_client(SUPABASE_URL, SUPABASE_SERVICE_KEY)

    # Fetch listings that haven't been enriched yet
    query = supabase.table("lawyers").select(
        "id,full_name,suburb,state,phone,website,google_place_id"
    ).is_("google_place_id", "null").eq("tier", "free")

    if args.state:
        query = query.eq("state", args.state)

    result = query.limit(args.limit).execute()
    listings = result.data
    print(f"Enriching {len(listings):,} listings...")

    enriched = 0
    for listing in tqdm(listings):
        place = search_place(gmaps, listing["full_name"],
                             listing.get("suburb", ""),
                             listing.get("state", ""))
        if not place:
            continue

        details = get_place_details(gmaps, place["place_id"])
        if not details:
            continue

        update = {
            "google_place_id": place["place_id"],
            "rating": details.get("rating"),
            "review_count": details.get("user_ratings_total"),
            "website": details.get("website") or listing.get("website"),
            "phone": details.get("formatted_phone_number") or listing.get("phone"),
        }
        hours = details.get("opening_hours", {}).get("weekday_text", [])
        if hours:
            update["business_hours"] = hours

        if not args.dry_run:
            supabase.table("lawyers").update(update).eq("id", listing["id"]).execute()

        enriched += 1
        time.sleep(random.uniform(0.5, 1.5))  # Respect rate limits

    print(f"\n✓ Enriched {enriched:,} listings")


if __name__ == "__main__":
    main()
