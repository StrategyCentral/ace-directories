-- Turn a firm's listing into a landing page that actually converts.
--
-- A directory profile that lists a name, a phone number and a paragraph is a
-- business card. What wins the enquiry is the same thing that wins it on a good
-- law firm's own site: a specific promise, proof it is credible, the friction
-- removed from making contact, and an answer to the thing the visitor is
-- privately worried about (usually cost).
--
-- These fields exist so a firm can supply exactly that, and so the profile can
-- render it in the order a hesitant person reads it.

-- ------------------------------------------------------------ the promise
alter table lawyers add column if not exists headline        text;   -- "Family law, without the courtroom"
alter table lawyers add column if not exists intro           text;   -- 2-3 sentences under the headline
alter table lawyers add column if not exists usps            jsonb default '[]';  -- [{title, body}]

-- --------------------------------------------------- removing the friction
-- The single biggest reason someone doesn't call a lawyer is not knowing what
-- it will cost or whether they'll be charged for asking.
alter table lawyers add column if not exists free_consult        boolean default false;
alter table lawyers add column if not exists free_consult_mins   int;
alter table lawyers add column if not exists fee_approach        text;   -- fixed | hourly | no-win-no-fee | mixed
alter table lawyers add column if not exists fee_note            text;   -- plain-English explanation
alter table lawyers add column if not exists response_commitment text;   -- "same business day"
alter table lawyers add column if not exists after_hours         boolean default false;
alter table lawyers add column if not exists home_visits         boolean default false;
alter table lawyers add column if not exists video_consults      boolean default false;

-- ------------------------------------------------------------- the proof
alter table lawyers add column if not exists abn                text;
alter table lawyers add column if not exists admitted_year      int;
alter table lawyers add column if not exists principal_name     text;
alter table lawyers add column if not exists memberships        text[] default '{}';
alter table lawyers add column if not exists awards             text[] default '{}';
alter table lawyers add column if not exists case_results       jsonb default '[]';  -- [{matter, outcome, year}]

-- --------------------------------------------------- answering objections
alter table lawyers add column if not exists faqs               jsonb default '[]';  -- [{q, a}]
alter table lawyers add column if not exists team               jsonb default '[]';  -- [{name, role, bio, photo}]

-- ----------------------------------------------------------- onboarding
alter table lawyers add column if not exists onboarding_step    int not null default 0;
alter table lawyers add column if not exists onboarding_done_at timestamptz;

/**
 * Profile strength, weighted by what actually drives an enquiry rather than by
 * how many boxes are filled. A headline and a clear fee position move the
 * needle far more than an ABN, so they score accordingly.
 */
create or replace function conversion_score(target uuid)
returns int language sql stable as $$
  select least(100, (
    select
      (case when l.headline    is not null then 12 else 0 end) +
      (case when l.intro       is not null then 10 else 0 end) +
      (case when l.bio         is not null and length(l.bio) > 300 then 10 else 0 end) +
      (case when jsonb_array_length(coalesce(l.usps, '[]')) >= 3 then 10 else 0 end) +
      (case when l.free_consult then 10 else 0 end) +
      (case when l.fee_approach is not null then 8 else 0 end) +
      (case when l.response_commitment is not null then 6 else 0 end) +
      (case when l.logo_url    is not null then 6 else 0 end) +
      (case when l.photo_url   is not null then 4 else 0 end) +
      (case when l.website     is not null then 4 else 0 end) +
      (case when coalesce(array_length(l.practice_areas, 1), 0) > 1 then 6 else 0 end) +
      (case when jsonb_array_length(coalesce(l.faqs, '[]')) >= 3 then 8 else 0 end) +
      (case when l.review_count > 0 then 6 else 0 end)
    from lawyers l where l.id = target
  ));
$$;

-- Enquiries need to be workable, not just delivered: a firm that never marks
-- one as won cannot see which pages are earning its money.
alter table enquiries add column if not exists status        text not null default 'new';
alter table enquiries add column if not exists first_reply_at timestamptz;
alter table enquiries add column if not exists outcome       text;   -- won | lost | not-a-fit
alter table enquiries add column if not exists value_estimate int;
alter table enquiries add column if not exists notes         text;
create index if not exists enquiries_status_idx on enquiries (listing_id, status, created_at desc);
