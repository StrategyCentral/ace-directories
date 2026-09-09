-- Per-listing activity. This is what makes the claim pitch concrete: a firm is
-- far more likely to pay when the email says "your page was viewed 47 times and
-- your number was tapped 6 times last month" than when it says "claim your
-- listing".

create table if not exists listing_events (
  id          bigserial primary key,
  listing_id  uuid not null references lawyers(id) on delete cascade,
  kind        text not null,          -- view | call | website | enquiry | directions
  source      text,                   -- the page the action happened on
  referrer    text,
  ua_hash     text,                   -- coarse dedupe key, not an identifier
  created_at  timestamptz not null default now()
);

create index if not exists listing_events_listing_idx on listing_events (listing_id, created_at desc);
create index if not exists listing_events_kind_idx    on listing_events (kind, created_at desc);

alter table lawyers add column if not exists call_count int not null default 0;

-- 30/90-day rollup used by the dashboard and the outreach mail-merge.
create or replace function listing_activity(listing uuid)
returns table (
  views_30 bigint, calls_30 bigint, website_30 bigint, enquiries_30 bigint,
  views_90 bigint, calls_90 bigint, first_seen timestamptz
) language sql stable as $$
  select
    count(*) filter (where kind='view'     and created_at > now() - interval '30 days'),
    count(*) filter (where kind='call'     and created_at > now() - interval '30 days'),
    count(*) filter (where kind='website'  and created_at > now() - interval '30 days'),
    count(*) filter (where kind='enquiry'  and created_at > now() - interval '30 days'),
    count(*) filter (where kind='view'     and created_at > now() - interval '90 days'),
    count(*) filter (where kind='call'     and created_at > now() - interval '90 days'),
    min(created_at)
  from listing_events where listing_id = listing;
$$;

-- Daily series for the dashboard sparkline.
create or replace function listing_daily_views(listing uuid, days int default 30)
returns table (day date, views bigint, calls bigint) language sql stable as $$
  select d::date,
         count(*) filter (where e.kind='view'),
         count(*) filter (where e.kind='call')
  from generate_series(current_date - (days - 1), current_date, interval '1 day') d
  left join listing_events e
    on e.listing_id = listing and e.created_at::date = d::date
  group by d order by d;
$$;

-- Cheap counters on the listing row so ranking and cards don't need a join.
create or replace function bump_listing_counter() returns trigger language plpgsql as $$
begin
  if new.kind = 'view' then
    update lawyers set view_count = view_count + 1 where id = new.listing_id;
  elsif new.kind = 'call' then
    update lawyers set call_count = call_count + 1 where id = new.listing_id;
  elsif new.kind = 'enquiry' then
    update lawyers set enquiry_count = enquiry_count + 1 where id = new.listing_id;
  end if;
  return new;
end;
$$;

drop trigger if exists listing_events_counter on listing_events;
create trigger listing_events_counter after insert on listing_events
  for each row execute function bump_listing_counter();
