-- 015: one row per reporter per review.
-- A single anonymous report used to unpublish any review instantly. Reports
-- now count by distinct reporter (a salted hash of the caller's IP); the API
-- unpublishes only at 3 distinct reporters and otherwise flags the review for
-- the moderation queue.
create table if not exists review_reports (
  id            uuid primary key default gen_random_uuid(),
  review_id     uuid not null references reviews(id) on delete cascade,
  reporter_hash text not null,
  reason        text,
  created_at    timestamptz not null default now()
);
create unique index if not exists review_reports_unique on review_reports (review_id, reporter_hash);
-- Server-only table: the service role bypasses RLS; anon/authenticated get nothing.
alter table review_reports enable row level security;
