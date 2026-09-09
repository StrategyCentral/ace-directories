-- ALD 2026 — business model layer (claim funnel, plans, geo silos, exclusivity)
-- Additive: keeps the existing `lawyers` table and its 5,929 imported records.
create extension if not exists pg_trgm;

-- ------------------------------------------------------------ taxonomy uplift
alter table practice_areas add column if not exists singular      text;
alter table practice_areas add column if not exists intent_terms  text[] default '{}';
alter table practice_areas add column if not exists blurb         text;
alter table practice_areas add column if not exists tier          int not null default 2;
alter table practice_areas add column if not exists listing_count int not null default 0;
alter table practice_areas add column if not exists hero_question text;

-- ------------------------------------------------------------ geography silo
create table if not exists suburbs (
  id            uuid primary key default gen_random_uuid(),
  slug          text unique not null,
  name          text not null,
  state         text not null,
  postcode      text,
  lat           double precision,
  lng           double precision,
  is_major      boolean not null default false,
  listing_count int not null default 0
);
create index if not exists suburbs_state_idx on suburbs (state);
create index if not exists suburbs_name_trgm on suburbs using gin (name gin_trgm_ops);

alter table lawyers add column if not exists suburb_id uuid references suburbs(id);

-- ------------------------------------------------------------ listing uplift
alter table lawyers add column if not exists status          text not null default 'live';
alter table lawyers add column if not exists is_claimed      boolean not null default false;
alter table lawyers add column if not exists verified_at     timestamptz;
alter table lawyers add column if not exists owner_user_id   uuid;
alter table lawyers add column if not exists stripe_subscription_id text;
alter table lawyers add column if not exists plan_code       text;
alter table lawyers add column if not exists plan_renews_at  timestamptz;
alter table lawyers add column if not exists rank_score      numeric not null default 0;
alter table lawyers add column if not exists profile_score   int not null default 0;
alter table lawyers add column if not exists view_count      int not null default 0;
alter table lawyers add column if not exists enquiry_count   int not null default 0;
alter table lawyers add column if not exists tagline         text;
alter table lawyers add column if not exists logo_url        text;
alter table lawyers add column if not exists founded_year    int;
alter table lawyers add column if not exists team_size       int;
alter table lawyers add column if not exists socials         jsonb;
alter table lawyers add column if not exists accreditations  text[] default '{}';
alter table lawyers add column if not exists video_url       text;
alter table lawyers add column if not exists original_url    text;
alter table lawyers add column if not exists legacy_post_id  int;
alter table lawyers add column if not exists priority_rebuild boolean not null default false;
alter table lawyers add column if not exists phone_display   text;
alter table lawyers add column if not exists search_text     text;

create index if not exists lawyers_status_idx  on lawyers (status);
create index if not exists lawyers_suburb_idx  on lawyers (suburb_id);
create index if not exists lawyers_state_idx   on lawyers (state);
create index if not exists lawyers_rank_idx    on lawyers (rank_score desc);
create index if not exists lawyers_name_trgm   on lawyers using gin (full_name gin_trgm_ops);
create index if not exists lawyers_pa_gin      on lawyers using gin (practice_areas);

create table if not exists listing_service_areas (
  listing_id uuid references lawyers(id) on delete cascade,
  suburb_id  uuid references suburbs(id) on delete cascade,
  primary key (listing_id, suburb_id)
);

create table if not exists exclusivity (
  id               uuid primary key default gen_random_uuid(),
  listing_id       uuid references lawyers(id) on delete cascade,
  practice_area_id uuid references practice_areas(id) on delete cascade,
  suburb_id        uuid references suburbs(id) on delete cascade,
  starts_at        timestamptz not null default now(),
  ends_at          timestamptz,
  unique (practice_area_id, suburb_id)
);

-- ------------------------------------------------------------ accounts
create table if not exists users (
  id            uuid primary key default gen_random_uuid(),
  email         text unique not null,
  password_hash text,
  full_name     text,
  phone         text,
  role          text not null default 'lawyer',
  email_verified_at timestamptz,
  last_login_at timestamptz,
  created_at    timestamptz not null default now()
);

-- ------------------------------------------------------------ the claim funnel
create table if not exists claims (
  id             uuid primary key default gen_random_uuid(),
  listing_id     uuid not null references lawyers(id) on delete cascade,
  user_id        uuid references users(id),
  email          text not null,
  full_name      text,
  phone          text,
  role_at_firm   text,
  status         text not null default 'started',
  verify_token   text unique,
  verified_at    timestamptz,
  started_at     timestamptz not null default now(),
  expires_at     timestamptz not null default (now() + interval '3 days'),
  completed_at   timestamptz,
  expired_at     timestamptz,
  emails_sent    int not null default 0,
  last_email_at  timestamptz,
  selected_plan  text,
  ip             text,
  user_agent     text
);
create index if not exists claims_active_idx on claims (status, expires_at);
create index if not exists claims_listing_idx on claims (listing_id);

-- ------------------------------------------------------------ billing
create table if not exists plans (
  code               text primary key,
  name               text not null,
  tagline            text,
  monthly_price      int not null,
  yearly_price       int not null,
  tier               text not null,
  max_practice_areas int not null default 1,
  max_suburbs        int not null default 1,
  features           jsonb not null default '[]',
  stripe_price_monthly text,
  stripe_price_yearly  text,
  sort_order         int not null default 100,
  is_public          boolean not null default true,
  is_popular         boolean not null default false
);

create table if not exists subscriptions (
  id            uuid primary key default gen_random_uuid(),
  listing_id    uuid references lawyers(id) on delete cascade,
  user_id       uuid references users(id),
  plan_code     text references plans(code),
  bill_interval text not null default 'month',
  status        text not null,
  stripe_subscription_id text unique,
  stripe_customer_id     text,
  current_period_end     timestamptz,
  cancel_at_period_end   boolean not null default false,
  created_at    timestamptz not null default now()
);

-- ------------------------------------------------------------ demand side
create table if not exists enquiries (
  id            uuid primary key default gen_random_uuid(),
  listing_id    uuid references lawyers(id) on delete set null,
  practice_area text,
  suburb_id     uuid references suburbs(id),
  name          text,
  email         text,
  phone         text,
  matter        text,
  urgency       text,
  state         text,
  source        text default 'profile',
  lead_score    int,
  read_at       timestamptz,
  created_at    timestamptz not null default now()
);

create table if not exists reviews (
  id           uuid primary key default gen_random_uuid(),
  listing_id   uuid references lawyers(id) on delete cascade,
  author_name  text not null,
  author_email text,
  rating       int not null check (rating between 1 and 5),
  title        text,
  body         text,
  matter_type  text,
  is_published boolean not null default false,
  created_at   timestamptz not null default now()
);

-- ------------------------------------------------------------ ops
create table if not exists email_log (
  id          uuid primary key default gen_random_uuid(),
  to_email    text not null,
  template    text not null,
  listing_id  uuid references lawyers(id) on delete set null,
  claim_id    uuid references claims(id) on delete set null,
  provider_id text,
  status      text default 'sent',
  sent_at     timestamptz not null default now()
);
