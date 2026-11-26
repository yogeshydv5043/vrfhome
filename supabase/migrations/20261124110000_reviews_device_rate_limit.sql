-- Extend the review cooldown to cover both the originating IP and a
-- first-party browser/device identifier. Only salted hashes are stored.
-- Apply after the original reviews and rate-limit migrations.

drop function if exists public.submit_review(text, text, integer, text, text, integer);

create function public.submit_review(
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
begin
  if p_client_hash is null or p_client_hash !~ '^[0-9a-f]{64}$'
     or p_device_hash is null or p_device_hash !~ '^[0-9a-f]{64}$' then
    raise exception using errcode = '22023', message = 'invalid client hash';
  end if;
  if char_length(v_name) not between 3 and 30
     or char_length(v_comment) not between 10 and 60
     or char_length(v_location) not between 10 and 40
     or p_rating is null or p_rating not between 1 and 5
     or p_cooldown_seconds is null or p_cooldown_seconds not between 1 and 86400 then
    raise exception using errcode = '22023', message = 'review validation failed';
  end if;

  -- Serialize requests sharing either key in a consistent order. This makes
  -- the IP + device cooldown check and claim atomic even across concurrent
  -- submissions from different IPs using the same browser identifier.
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

  insert into public.reviews (name, rating, comment, location, is_approved)
  values (v_name, p_rating::smallint, v_comment, v_location, true)
  returning * into v_review;

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
    )
  );
end;
$$;

revoke all on function public.submit_review(text, text, text, integer, text, text, integer) from public, anon, authenticated;
grant execute on function public.submit_review(text, text, text, integer, text, text, integer) to service_role;

comment on function public.submit_review(text, text, text, integer, text, text, integer)
  is 'Validates and atomically rate-limits a review insertion by salted IP and browser/device hashes.';
comment on table public.review_rate_limits
  is 'Salted IP and browser/device hashes only; raw IP addresses and raw browser identifiers are not stored.';
