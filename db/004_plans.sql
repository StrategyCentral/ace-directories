-- ALD 2026 — subscription plans (prices in cents, AUD, ex GST)
--
-- Anchoring: Australian legal Google Ads run $8–$45 per click and $200–$550 per
-- booked consultation. FindLaw (US) charges $2,000–$10,000/mo on 12–36 month
-- contracts. Yellow Pages AU sells $59–$99/mo *plus* $999–$3,999 setup on a 12
-- month lock. ALD undercuts the incumbents on price while beating all of them on
-- intent quality, and every tier is cheaper than a single acquired client.
--
-- There is no free plan. Free listings exist only as unclaimed legacy records.

insert into plans (code, name, tagline, monthly_price, yearly_price, tier,
                   max_practice_areas, max_suburbs, features, sort_order, is_popular) values

('verified', 'Verified', 'Own your listing and be found.',
  8900, 89000, 'verified', 3, 1,
  '["Verified badge — proof you are a real, current practice",
    "Full control of your profile via the firm dashboard",
    "Up to 3 practice areas (free listings get 1)",
    "Logo, photos and a 600-word profile",
    "Clickable website link and direct phone number",
    "Enquiry form — leads sent straight to your inbox",
    "Client reviews enabled",
    "Business hours, languages and accreditations",
    "Ranked above every unclaimed listing in your suburb"]'::jsonb,
  10, false),

('featured', 'Featured', 'Sit at the top of the pages that convert.',
  19900, 199000, 'featured', 8, 5,
  '["Everything in Verified",
    "Top-3 placement across 5 suburb pages you choose",
    "Up to 8 practice areas",
    "Enlarged featured card with photos and tagline",
    "Priority in AI matching — recommended first by Lexie",
    "Lead dashboard: enquiries, calls, profile views, search terms",
    "Featured block on your state hub page",
    "Contextual link from one legal guide in your practice area"]'::jsonb,
  20, true),

('dominator', 'Suburb Dominator', 'Own a suburb. Lock competitors out.',
  49900, 499000, 'dominator', 99, 10,
  '["Everything in Featured",
    "Exclusive #1 position for 1 practice area in 1 suburb",
    "No competing firm is shown above you on that page",
    "Unlimited practice areas, 10 suburbs",
    "First refusal on every enquiry from your suburb",
    "Homepage feature block for your suburb",
    "Call tracking number with recordings and attribution",
    "Quarterly ranking and lead report"]'::jsonb,
  30, false),

('firm', 'Multi-Office Firm', 'For practices with several offices and a team.',
  99900, 999000, 'firm', 99, 99,
  '["Everything in Suburb Dominator",
    "Up to 15 individual lawyer profiles under one firm page",
    "Unlimited office locations, each with its own suburb page presence",
    "3 suburb exclusivities included",
    "Dedicated firm brand page with team directory",
    "Bulk enquiry routing rules by practice area and office",
    "Named account manager and priority support"]'::jsonb,
  40, false)

on conflict (code) do update set
  name = excluded.name, tagline = excluded.tagline,
  monthly_price = excluded.monthly_price, yearly_price = excluded.yearly_price,
  tier = excluded.tier, max_practice_areas = excluded.max_practice_areas,
  max_suburbs = excluded.max_suburbs, features = excluded.features,
  sort_order = excluded.sort_order, is_popular = excluded.is_popular;
