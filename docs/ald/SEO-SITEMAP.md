# ALD SEO Sitemap — Page Architecture

## Target: 50,000+ pages at launch → 200,000+ within 12 months

## Silo 1: Practice Area × Suburb (/[practice-area]/[suburb]-[state])
- Format: /family-lawyer/richmond-vic
- Scale: 30 practice areas × 2,000 AU suburbs = 60,000 pages
- Launch priority: top 30 practice areas × top 500 suburbs = 15,000 pages

## Silo 2: State Hubs (/[state]/[practice-area])
- Format: /vic/lawyers, /vic/family-lawyers, /nsw/criminal-lawyers
- Scale: 8 states × 30 practice areas + 8 state index = 248 pages

## Silo 3: Firm Profiles (/firm/[slug])
- Preserves old URL structure exactly — maximum SEO equity retention
- Scale: ~6,000 pages (from existing data)
- These are THE priority pages for SEO recovery

## Silo 4: Lawyer Profiles (/lawyers/[slug])
- Scale: 6,000 pages from import + grows as lawyers claim profiles

## Silo 5: Legal Guides (/guides/[topic])
- Topical authority content — plain-English legal guides
- Scale: seed with 200 guides, grow to 2,000+
- Examples:
  - /guides/how-to-find-a-family-lawyer-australia
  - /guides/what-does-a-conveyancer-do
  - /guides/drink-driving-laws-nsw
  - /guides/how-much-does-a-lawyer-cost

## Silo 6: Law Society Pages (/law-societies/[state])
- Trust signals + long-tail SEO
- Scale: ~20 pages

## Priority Rebuilds (SEO Recovery)
The 61 records in ald_run3_listing_recovery_database.csv are
confirmed Google-indexed from the old site. Build these FIRST at
their exact old URLs (/listing/[slug]/) and submit via Google Indexing API.

## Schema.org Markup (every lawyer page)
- LegalService schema
- LocalBusiness schema
- BreadcrumbList schema
- FAQPage schema (on guide pages)

## Internal Linking Rules
- Every suburb page → its state hub
- Every lawyer profile → firm, suburb, practice areas
- Every guide → 3-5 relevant lawyer profiles
- Every firm page → all its lawyers
- State hubs → top 20 suburb pages in that state
- Lexie surfaces 3 internal links in every answer
