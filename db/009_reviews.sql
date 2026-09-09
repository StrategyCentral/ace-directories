-- Review engine.
--
-- Publishing public reviews of named legal professionals in Australia carries
-- real defamation exposure — a platform can be treated as the publisher of what
-- its users post. So this schema is moderation-first by design:
--
--   * a review is invisible until the author confirms their email AND a human
--     approves it (`status`), so nothing reaches the page unattended
--   * the firm always gets a right of reply, and replies publish immediately
--   * anyone can report a review, which pulls it straight back to 'reported'
--     for re-review rather than leaving it up while we think about it
--   * every review keeps the evidence trail (ip, ua, timestamps) needed to
--     respond to a complaint or a takedown request
--
-- Under the Australian Consumer Law it is also illegal to publish fake reviews
-- or to selectively suppress genuine negative ones. Moderation here is for
-- verification and legality, never for filtering out criticism.

alter table reviews add column if not exists status        text not null default 'pending';
alter table reviews add column if not exists verify_token  text unique;
alter table reviews add column if not exists verified_at   timestamptz;
alter table reviews add column if not exists published_at  timestamptz;
alter table reviews add column if not exists moderated_at  timestamptz;
alter table reviews add column if not exists moderated_by  text;
alter table reviews add column if not exists rejection_reason text;
alter table reviews add column if not exists reply         text;
alter table reviews add column if not exists replied_at    timestamptz;
alter table reviews add column if not exists reported_at   timestamptz;
alter table reviews add column if not exists report_reason text;
alter table reviews add column if not exists report_count  int not null default 0;
alter table reviews add column if not exists used_firm     boolean not null default true;
alter table reviews add column if not exists matter_year   int;
alter table reviews add column if not exists ip            text;
alter table reviews add column if not exists user_agent    text;

-- status: pending -> verifying -> approved | rejected | reported
create index if not exists reviews_listing_pub_idx on reviews (listing_id, status, published_at desc);
create index if not exists reviews_moderation_idx  on reviews (status, created_at desc);

-- Ratings on the listing row are derived, never written by hand.
create or replace function refresh_listing_rating(target uuid)
returns void language sql as $$
  update lawyers l set
    review_count = c.n,
    review_avg   = coalesce(c.avg_rating, 0),
    rank_score   = (case l.tier when 'dominator' then 1000 when 'firm' then 900
                                when 'featured'  then 500  when 'verified' then 250
                                else 0 end)
                   + (case when l.is_claimed then 50 else 0 end)
                   + coalesce(c.avg_rating, 0) * 10
                   + least(coalesce(c.n, 0), 25)
  from (
    select count(*) n, round(avg(rating)::numeric, 1) avg_rating
    from reviews where listing_id = target and status = 'approved'
  ) c
  where l.id = target;
$$;

create or replace function reviews_touch_rating() returns trigger language plpgsql as $$
begin
  perform refresh_listing_rating(coalesce(new.listing_id, old.listing_id));
  return coalesce(new, old);
end;
$$;

drop trigger if exists reviews_rating_sync on reviews;
create trigger reviews_rating_sync after insert or update or delete on reviews
  for each row execute function reviews_touch_rating();

-- Rating distribution for the 5/4/3/2/1 bars.
create or replace function listing_rating_breakdown(listing uuid)
returns table (rating int, n bigint) language sql stable as $$
  select g.r, count(v.id)
  from generate_series(1, 5) g(r)
  left join reviews v on v.listing_id = listing and v.rating = g.r and v.status = 'approved'
  group by g.r order by g.r desc;
$$;
