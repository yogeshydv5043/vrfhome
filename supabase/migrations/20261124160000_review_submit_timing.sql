-- Add internal database insert timing for review-flow diagnostics.
-- The Edge Function consumes this field and exposes it only through an
-- opt-in Server-Timing response header; it is never returned to the browser
-- as JSON. Submission validation, approval and cooldown logic are unchanged.

create or replace function public.submit_review(
  p_client_hash text,
  p_device_hash text,
  p_name text,
  p_rating integer,
  p_comment text,
  p_location text,
  p_cooldown_seconds integer default 300
) returns jsonb
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_name text := regexp_replace(btrim(coalesce(p_name, '')), '[[:space:]]+', ' ', 'g');
  v_comment text := regexp_replace(btrim(coalesce(p_comment, '')), '[[:space:]]+', ' ', 'g');
  v_location text := regexp_replace(btrim(coalesce(p_location, '')), '[[:space:]]+', ' ', 'g');
  v_last timestamptz;
  v_retry integer;
  v_lock_hash text;
  v_review public.reviews%rowtype;
  v_insert_started timestamptz;
  v_insert_ms numeric;
begin
  if p_client_hash is null or p_client_hash !~ '^[0-9a-f]{64}$'
     or p_device_hash is null or p_device_hash !~ '^[0-9a-f]{64}$' then
    raise exception using errcode = '22023', message = 'invalid client hash';
  end if;
  if char_length(v_name) not between 3 and 30
     or char_length(v_comment) not between 10 and 3000
     or cardinality(regexp_split_to_array(v_comment, '[[:space:]]+')) > 50
     or char_length(v_location) not between 10 and 40
     or p_rating is null or p_rating not between 1 and 5
     or p_cooldown_seconds is null or p_cooldown_seconds not between 1 and 86400 then
    raise exception using errcode = '22023', message = 'review validation failed';
  end if;

  for v_lock_hash in
    select distinct keys.client_hash
      from unnest(array[p_client_hash, p_device_hash]) as keys(client_hash)
     order by keys.client_hash
  loop
    perform pg_advisory_xact_lock(hashtextextended(v_lock_hash, 0));
  end loop;

  select max(last_submission_at) into v_last
    from public.review_rate_limits
   where client_hash in (p_client_hash, p_device_hash);

  if v_last is not null and v_last > now() - make_interval(secs => p_cooldown_seconds) then
    v_retry := greatest(1, ceil(extract(epoch from
      (v_last + make_interval(secs => p_cooldown_seconds) - now())))::integer);
    return jsonb_build_object('status', 'rate_limited', 'retry_after', v_retry);
  end if;

  insert into public.review_rate_limits as rl
    (client_hash, last_submission_at, submission_count)
  select distinct keys.client_hash, now(), 1
    from unnest(array[p_client_hash, p_device_hash]) as keys(client_hash)
  on conflict (client_hash) do update
    set last_submission_at = excluded.last_submission_at,
        submission_count = rl.submission_count + 1;

  v_insert_started := clock_timestamp();
  insert into public.reviews (name, rating, comment, location, is_approved)
  values (v_name, p_rating::smallint, v_comment, v_location, true)
  returning * into v_review;
  v_insert_ms := extract(epoch from (clock_timestamp() - v_insert_started)) * 1000;

  return jsonb_build_object(
    'status', 'created',
    'review', jsonb_build_object(
      'id', v_review.id,
      'name', v_review.name,
      'rating', v_review.rating,
      'comment', v_review.comment,
      'location', v_review.location,
      'is_approved', v_review.is_approved,
      'created_at', v_review.created_at
    ),
    'timing', jsonb_build_object('db_insert_ms', round(v_insert_ms, 3))
  );
end;
$$;

comment on function public.submit_review(text, text, text, integer, text, text, integer)
  is 'Validates and rate-limits review writes; reports insert duration internally for opt-in diagnostics.';
