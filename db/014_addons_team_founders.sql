-- Add-ons sold on top of a plan, and what a firm has bought.
create table if not exists addons (
  code                 text primary key,
  name                 text not null,
  blurb                text not null,
  monthly_price        integer not null,
  yearly_price         integer not null,
  stripe_product       text,
  stripe_price_monthly text,
  stripe_price_yearly  text,
  sort_order           integer not null default 0
);
alter table addons enable row level security;

insert into addons (code,name,blurb,monthly_price,yearly_price,stripe_product,stripe_price_monthly,stripe_price_yearly,sort_order) values
 ('exclusive','Suburb Exclusive','The number one position for one practice area in your suburb. One firm only. When it is taken, it is taken.',29900,299000,'prod_VeHsEqm9GQTvJU','price_1UczIXGSMhVWY7Y0jBwvZZc1','price_1UczIYGSMhVWY7Y0WS4pCQ6D',10),
 ('extra_suburb','Extra suburb','Appear on one more suburb''s pages, ranked at your plan level.',3900,39000,'prod_VeHsO5UU0oIQoA','price_1UczIYGSMhVWY7Y0Cn15Ms6u','price_1UczIYGSMhVWY7Y055oSBduT',20),
 ('team_profile','Lawyer profile','An individual profile page for one of your lawyers, linked to the firm and shown in search.',1900,19000,'prod_VeHs3ao1IBzw1m','price_1UczIZGSMhVWY7Y0bBWzL1en','price_1UczIZGSMhVWY7Y0423wYq2Q',30)
on conflict (code) do nothing;

alter table lawyers add column if not exists extra_suburb_slots integer not null default 0;
alter table lawyers add column if not exists team_slots         integer not null default 0;
alter table lawyers add column if not exists extra_suburb_ids   uuid[]  not null default '{}';
alter table lawyers add column if not exists parent_listing_id  uuid references lawyers(id) on delete cascade;
alter table lawyers add column if not exists role_title         text;
alter table lawyers add column if not exists is_founder         boolean not null default false;
create index if not exists lawyers_extra_suburbs_idx on lawyers using gin (extra_suburb_ids);
create index if not exists lawyers_parent_idx on lawyers (parent_listing_id) where parent_listing_id is not null;

-- One live holder per suburb and practice area. The database enforces the
-- promise, so two firms can never both be sold the same position.
alter table exclusivity add column if not exists practice_slug text;
create unique index if not exists exclusivity_one_holder
  on exclusivity (suburb_id, practice_slug) where ends_at is null;
create index if not exists exclusivity_listing_idx on exclusivity (listing_id);

insert into app_settings (key,value) values ('founder_coupon','FOUNDER80'), ('founder_cap','100')
on conflict (key) do nothing;

update plans set features = '["Everything in Verified","Ranked above every Verified and unclaimed listing","Up to 8 practice areas, so you appear on more suburb pages","Appear in 2 extra suburbs of your choice","3 individual lawyer profiles included","Larger gold Featured card that stands out in results","Lead dashboard: profile views, phone taps and enquiries","Can add Suburb Exclusive: the number one spot, one firm only"]'::jsonb where code='featured';
