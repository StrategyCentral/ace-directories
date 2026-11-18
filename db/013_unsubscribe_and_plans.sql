-- Email opt-outs. One row per address; checked before every non-essential send.
create table if not exists email_suppressions (
  email      text primary key,
  reason     text not null default 'unsubscribe',
  created_at timestamptz not null default now()
);
alter table email_suppressions enable row level security;

-- Plans describe only what is built. Dominator and Multi-Office come off sale
-- until exclusivity, call tracking and multi-profile firms exist.
update plans set
  tagline = 'Take control of your page and get found.',
  features = '["Verified badge: shows the firm itself confirmed and manages this profile","Full control of your profile from the firm dashboard","Up to 3 practice areas (unclaimed listings get 1)","Logo, photos and a 600 word profile","Clickable website link and direct phone number","Enquiry form: new enquiries emailed straight to you","Client reviews, with your right of reply","Business hours, languages and accreditations","Ranked above every unclaimed listing in your suburb"]'::jsonb
where code = 'verified';
update plans set
  tagline = 'Stand out and sit above Verified firms.',
  features = '["Everything in Verified","Ranked above every Verified and unclaimed listing","Up to 8 practice areas, so you appear on more suburb pages","Larger gold Featured card that stands out in results","Lead dashboard: profile views, phone taps and enquiries"]'::jsonb
where code = 'featured';
update plans set is_public = false where code in ('dominator','firm');
