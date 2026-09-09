-- Keeps profile_score in step with what the firm has actually filled in.
create or replace function recompute_profile_score(listing uuid)
returns void language sql as $$
  update lawyers set profile_score = least(100,
      (case when phone   is not null then 20 else 0 end) +
      (case when website is not null then 15 else 0 end) +
      (case when email   is not null then 10 else 0 end) +
      (case when bio     is not null then 20 else 0 end) +
      (case when photo_url is not null or logo_url is not null then 15 else 0 end) +
      (case when coalesce(array_length(practice_areas,1),0) > 1 then 20 else 5 end))
  where id = listing;
$$;
