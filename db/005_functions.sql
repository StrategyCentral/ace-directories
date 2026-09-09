-- Aggregations the PostgREST query builder can't express. Used to build the
-- internal linking blocks that hold the SEO silos together.

create or replace function pa_suburb_counts(pa text, lim int default 40)
returns table (slug text, name text, state text, n bigint)
language sql stable as $$
  select s.slug, s.name, s.state, count(*) as n
  from lawyers l
  join suburbs s on s.id = l.suburb_id
  where l.status = 'live' and pa = any(l.practice_areas)
  group by s.slug, s.name, s.state
  order by n desc, s.name
  limit lim;
$$;

create or replace function pa_state_counts(pa text)
returns table (state text, n bigint)
language sql stable as $$
  select l.state, count(*) as n
  from lawyers l
  where l.status = 'live' and pa = any(l.practice_areas) and l.state is not null
  group by l.state
  order by n desc;
$$;

create or replace function suburb_pa_counts(sub uuid)
returns table (slug text, name text, n bigint)
language sql stable as $$
  select p.slug, p.name, count(*) as n
  from lawyers l
  join practice_areas p on p.slug = any(l.practice_areas)
  where l.status = 'live' and l.suburb_id = sub
  group by p.slug, p.name
  order by n desc, p.name;
$$;

create or replace function state_pa_counts(st text)
returns table (slug text, name text, n bigint)
language sql stable as $$
  select p.slug, p.name, count(*) as n
  from lawyers l
  join practice_areas p on p.slug = any(l.practice_areas)
  where l.status = 'live' and l.state = st
  group by p.slug, p.name
  order by n desc, p.name;
$$;

-- Suburbs geographically closest to another suburb, for "nearby" linking.
create or replace function nearby_suburbs(sub uuid, lim int default 12)
returns table (slug text, name text, state text, n int)
language sql stable as $$
  with origin as (select lat, lng, state from suburbs where id = sub)
  select s.slug, s.name, s.state, s.listing_count
  from suburbs s, origin o
  where s.id <> sub
    and s.listing_count > 0
    and s.lat is not null and o.lat is not null
  order by (s.lat - o.lat) ^ 2 + (s.lng - o.lng) ^ 2
  limit lim;
$$;
