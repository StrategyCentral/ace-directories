# ALD Scraping Runbook

## Step 0: Check Existing Data First
Before scraping — check if ALD-EXISTING-LISTINGS.csv is available.
5,960 records already extracted from the old WordPress DB.
Run bulk_loader.py first. Scraping is for gap-filling only.

## Step 1: Import Existing Data
```bash
cd scrapers/ald
pip install -r requirements.txt

# Set env vars
export NEXT_PUBLIC_SUPABASE_URL=https://vpumgmasnggconvgujho.supabase.co
export SUPABASE_SERVICE_ROLE_KEY=your_service_key_here

# Dry run first
python bulk_loader.py --csv /path/to/ALD-EXISTING-LISTINGS.csv --dry-run

# Real import
python bulk_loader.py --csv /path/to/ALD-EXISTING-LISTINGS.csv
```

## Step 2: Google Places Enrichment
Adds: website, rating, review_count, business_hours.
Cost: ~$17/1,000 lookups.

```bash
export GOOGLE_PLACES_API_KEY=your_key_here

# Start with VIC (1,699 records) — biggest ROI
python google_places_enricher.py --state VIC --limit 500

# Then NSW
python google_places_enricher.py --state NSW --limit 500
```

## Step 3: Law Society Scrapes (for email + gap filling)
Focus on emails — the #1 missing field for outreach.

```bash
# NSW (largest)
python law_society_nsw.py

# VIC, QLD, SA, WA, TAS, ACT, NT — similar pattern
```

## Step 4: Priority URL Rebuilds
The 61 records in ald_run3_listing_recovery_database.csv are
confirmed Google-indexed. Rebuild these first and submit to
Google Indexing API for fastest SEO recovery.

## Data Quality Notes
- ~80% phone coverage from existing import
- Website coverage is low (~93 records) — Google Places enrichment fixes this
- Practice area inference is keyword-based — manually review flagged records
- AU-only filter removes ~28 non-AU records (foreign addresses from old WP demo data)
