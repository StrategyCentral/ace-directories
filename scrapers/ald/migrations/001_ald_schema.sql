-- ALD Schema Migration 001
-- Run against: Supabase project vpumgmasnggconvgujho
-- Creates all tables needed for the Aussie Lawyer Directory tenant

-- ============================================================
-- TENANTS TABLE (shared across all ACE Directories sites)
-- ============================================================
CREATE TABLE IF NOT EXISTS tenants (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug            text UNIQUE NOT NULL,
  name            text NOT NULL,
  tenant_type     text NOT NULL DEFAULT 'job_board',
  country         text NOT NULL DEFAULT 'AU',
  region          text,
  domain          text,
  status          text NOT NULL DEFAULT 'building',
  brand_json      jsonb,
  created_at      timestamptz DEFAULT now(),
  updated_at      timestamptz DEFAULT now()
);

-- ============================================================
-- PRACTICE AREAS
-- ============================================================
CREATE TABLE IF NOT EXISTS practice_areas (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug        text UNIQUE NOT NULL,
  name        text NOT NULL,
  description text,
  icon        text,
  parent_id   uuid REFERENCES practice_areas(id),
  sort_order  int DEFAULT 0
);

-- ============================================================
-- LAW FIRMS
-- ============================================================
CREATE TABLE IF NOT EXISTS law_firms (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id       uuid REFERENCES tenants(id) ON DELETE CASCADE,
  name            text NOT NULL,
  slug            text UNIQUE NOT NULL,
  address         text,
  suburb          text,
  state           text,
  postcode        text,
  phone           text,
  email           text,
  website         text,
  description     text,
  logo_url        text,
  practice_areas  text[],
  lawyer_count    int DEFAULT 0,
  tier            text DEFAULT 'free',
  google_place_id text,
  rating          float,
  review_count    int DEFAULT 0,
  source          text,
  created_at      timestamptz DEFAULT now(),
  updated_at      timestamptz DEFAULT now()
);

-- ============================================================
-- LAWYERS
-- ============================================================
CREATE TABLE IF NOT EXISTS lawyers (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id       uuid REFERENCES tenants(id) ON DELETE CASCADE,

  -- Identity
  full_name       text NOT NULL,
  slug            text UNIQUE NOT NULL,
  entity_type     text DEFAULT 'individual',  -- 'individual' | 'firm'
  gender          text,
  admission_year  int,

  -- Firm
  firm_id         uuid REFERENCES law_firms(id),
  firm_name       text,

  -- Location
  address         text,
  suburb          text,
  state           text,
  postcode        text,
  full_address    text,
  lat             float,
  lng             float,

  -- Contact
  phone           text,
  email           text,
  website         text,

  -- Practice
  practice_areas  text[],
  languages       text[],

  -- Registration
  law_society     text,
  registration_no text,
  registration_status text DEFAULT 'current',
  is_barrister    bool DEFAULT false,

  -- Listing tier
  tier            text DEFAULT 'free',
  stripe_customer_id text,

  -- Profile (paid tiers)
  photo_url       text,
  bio             text,
  achievements    text,

  -- Reviews
  review_count    int DEFAULT 0,
  review_avg      float DEFAULT 0,

  -- Google enrichment
  google_place_id text,
  rating          float,
  business_hours  text[],

  -- Data provenance
  source          text,
  source_url      text,
  last_verified   timestamptz,

  -- Outreach tracking
  outreach_status text DEFAULT 'pending',
  outreach_email_1_sent_at  timestamptz,
  outreach_email_2_sent_at  timestamptz,
  outreach_email_3_sent_at  timestamptz,
  outreach_email_4_sent_at  timestamptz,
  claimed_at                timestamptz,

  created_at      timestamptz DEFAULT now(),
  updated_at      timestamptz DEFAULT now()
);

-- Indexes for common queries
CREATE INDEX IF NOT EXISTS idx_lawyers_tenant ON lawyers(tenant_id);
CREATE INDEX IF NOT EXISTS idx_lawyers_state ON lawyers(state);
CREATE INDEX IF NOT EXISTS idx_lawyers_suburb ON lawyers(suburb);
CREATE INDEX IF NOT EXISTS idx_lawyers_tier ON lawyers(tier);
CREATE INDEX IF NOT EXISTS idx_lawyers_practice_areas ON lawyers USING GIN(practice_areas);
CREATE INDEX IF NOT EXISTS idx_lawyers_outreach ON lawyers(outreach_status);

-- ============================================================
-- LEGAL GUIDES (content silo)
-- ============================================================
CREATE TABLE IF NOT EXISTS legal_guides (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id     uuid REFERENCES tenants(id) ON DELETE CASCADE,
  slug          text UNIQUE NOT NULL,
  title         text NOT NULL,
  meta_desc     text,
  content_mdx   text,
  practice_area text,
  state         text,
  word_count    int,
  published     bool DEFAULT false,
  published_at  timestamptz,
  created_at    timestamptz DEFAULT now()
);

-- ============================================================
-- LAWYER ENQUIRIES
-- ============================================================
CREATE TABLE IF NOT EXISTS lawyer_enquiries (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id     uuid REFERENCES tenants(id) ON DELETE CASCADE,
  lawyer_id     uuid REFERENCES lawyers(id),
  name          text,
  email         text,
  phone         text,
  message       text,
  matter_type   text,
  state         text,
  sent_at       timestamptz DEFAULT now(),
  read_at       timestamptz,
  replied_at    timestamptz
);

-- ============================================================
-- LEXIE CONVERSATIONS (audit + improvement)
-- ============================================================
CREATE TABLE IF NOT EXISTS lexie_conversations (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id     uuid REFERENCES tenants(id) ON DELETE CASCADE,
  session_id    text,
  messages      jsonb,
  topic         text,
  state         text,
  referred_to   uuid REFERENCES lawyers(id),
  was_emergency bool DEFAULT false,
  created_at    timestamptz DEFAULT now()
);

-- ============================================================
-- REDIRECTS (URL preservation for SEO)
-- ============================================================
CREATE TABLE IF NOT EXISTS redirects (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id   uuid REFERENCES tenants(id) ON DELETE CASCADE,
  from_path   text NOT NULL,
  to_path     text NOT NULL,
  status_code int DEFAULT 301,
  note        text,
  created_at  timestamptz DEFAULT now(),
  UNIQUE(tenant_id, from_path)
);
