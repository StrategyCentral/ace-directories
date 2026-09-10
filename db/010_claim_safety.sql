-- Close the competitor-sabotage hole in the claim funnel.
--
-- As originally built, anyone could start a claim on any listing with any email
-- address. Doing so reserved the listing (blocking the real firm from claiming
-- it) and started a 72-hour clock that ended in the listing being removed. A
-- competitor could clear every rival in a suburb, for free, from a throwaway
-- address. That is a destructive action triggered by an unauthenticated
-- stranger, which is not something a countdown timer should ever be able to do.
--
-- The fix: nothing destructive happens until the claimant proves they control
-- an inbox at the firm's own domain.
--
--   verification_level = 'domain'  work email matches the firm's known domain.
--                                  Confirmed by clicking the emailed link, this
--                                  is the firm itself. The clock may run.
--   verification_level = 'manual'  free webmail, or we hold no domain to check
--                                  against. Goes to a human. No clock, no
--                                  reservation, no removal — ever.
--
-- The clock now starts at verification rather than at submission, so `expires_at`
-- is null until then.

alter table claims add column if not exists verification_level text not null default 'manual';
alter table claims add column if not exists clock_started_at   timestamptz;
alter table claims alter column expires_at drop not null;
alter table claims alter column expires_at drop default;

-- Existing rows predate the change; leave their clocks alone but record how
-- they were verified so the cron can reason about them consistently.
update claims set verification_level = 'domain' where verified_at is not null;

create index if not exists claims_verification_idx on claims (verification_level, status);

-- Only a verified claim reserves a listing. This is what stops a stranger
-- locking the real firm out of its own page.
create or replace function listing_is_reserved(target uuid)
returns boolean language sql stable as $$
  select exists (
    select 1 from claims
    where listing_id = target
      and verified_at is not null
      and status in ('awaiting_payment', 'verifying')
      and (expires_at is null or expires_at > now())
  );
$$;

-- Rate limit: one IP should not be able to open claims across the directory.
create or replace function claims_from_ip(addr text, window_hours int default 24)
returns bigint language sql stable as $$
  select count(*) from claims
  where ip = addr and started_at > now() - (window_hours || ' hours')::interval;
$$;
