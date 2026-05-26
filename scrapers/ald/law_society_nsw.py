#!/usr/bin/env python3
"""
Law Society NSW public register scraper.
Target: lawsociety.com.au/for-the-public/find-a-solicitor
Adds ~35,000 solicitor records.
"""

import time
import random
import re
import requests
from bs4 import BeautifulSoup
from supabase import create_client
from config import SUPABASE_URL, SUPABASE_SERVICE_KEY, USER_AGENT, SCRAPE_RATE_LIMIT_SECONDS
from bulk_loader import slugify, build_lawyer_record, get_or_create_tenant

BASE_URL = "https://www.lawsociety.com.au"
SEARCH_URL = f"{BASE_URL}/for-the-public/find-a-solicitor"

def fetch_page(session, url: str, params: dict = None) -> BeautifulSoup | None:
    time.sleep(random.uniform(*SCRAPE_RATE_LIMIT_SECONDS))
    try:
        resp = session.get(url, params=params, timeout=10)
        resp.raise_for_status()
        return BeautifulSoup(resp.text, "html.parser")
    except Exception as e:
        print(f"Error fetching {url}: {e}")
        return None


def parse_listing(row) -> dict | None:
    """Parse a single solicitor row from the search results table."""
    cells = row.find_all("td")
    if len(cells) < 4:
        return None
    return {
        "full_name": cells[0].get_text(strip=True),
        "firm_name": cells[1].get_text(strip=True),
        "suburb": cells[2].get_text(strip=True),
        "state": "NSW",
        "practice_areas": [],
        "source": "law_society_nsw",
        "tier": "free",
    }


def run():
    session = requests.Session()
    session.headers.update({"User-Agent": USER_AGENT})
    supabase = create_client(SUPABASE_URL, SUPABASE_SERVICE_KEY)
    tenant_id = get_or_create_tenant(supabase)

    # NOTE: The Law Society NSW find-a-solicitor search may require JavaScript
    # rendering. Use Playwright if requests+BS4 returns empty results.
    # The structure below is a starting pattern — inspect the live page and
    # adjust selectors accordingly before running at scale.

    print("Fetching Law Society NSW solicitor register...")
    print("NOTE: If results are empty, the page requires JS — switch to Playwright.")
    print("Run: playwright install chromium && python law_society_nsw_playwright.py")

    # Alphabet search — iterate A-Z to get paginated results
    all_lawyers = []
    for letter in "ABCDEFGHIJKLMNOPQRSTUVWXYZ":
        page = 1
        while True:
            soup = fetch_page(session, SEARCH_URL, {"q": letter, "page": page})
            if not soup:
                break

            rows = soup.select("table.results tbody tr")
            if not rows:
                break

            for row in rows:
                record = parse_listing(row)
                if record:
                    record["slug"] = slugify(record["full_name"] + "-nsw")
                    all_lawyers.append(record)

            # Check for next page
            next_btn = soup.select_one("a.next-page")
            if not next_btn:
                break
            page += 1

    print(f"Scraped {len(all_lawyers):,} NSW solicitors")

    # Batch upsert
    for i in range(0, len(all_lawyers), 100):
        batch = all_lawyers[i:i+100]
        try:
            supabase.table("lawyers").upsert(
                [{"tenant_id": tenant_id, **r} for r in batch],
                on_conflict="slug"
            ).execute()
        except Exception as e:
            print(f"Batch error: {e}")

    print("✓ NSW scrape complete")


if __name__ == "__main__":
    run()
