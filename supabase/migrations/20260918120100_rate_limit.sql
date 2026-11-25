-- Atomic server-side cooldown. Only the Edge Function's service_role may use it.
create table if not exists public.review_rate_limits (
  client_hash text primary key,
  last_submission_at timestamptz not null default now(),
  submission_count integer not null default 1,
  constraint review_rate_limits_hash_format check (client_hash ~ '^[0-9a-f]{64}$'),
  constraint review_rate_limits_count_positive check (submission_count > 0)
);

alter table public.review_rate_limits enable row level security;
revoke all on table public.review_rate_limits from anon, authenticated;
revoke all on table public.review_rate_limits from service_role;
grant select, insert, update, delete on table public.review_rate_limits to service_role;

create or replace function public.submit_review(
  p_client_hash text,
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
  v_claimed boolean := false;
  v_last timestamptz;
  v_retry integer;
  v_review public.reviews%rowtype;
begin
  if p_client_hash is null or p_client_hash !~ '^[0-9a-f]{64}$' then
    raise exception using errcode = '22023', message = 'invalid client hash';
  end if;
  if char_length(v_name) not between 3 and 30
     or char_length(v_comment) not between 10 and 60
     or char_length(v_location) not between 10 and 40
     or p_rating is null or p_rating not between 1 and 5
     or p_cooldown_seconds is null or p_cooldown_seconds not between 1 and 86400 then
    raise exception using errcode = '22023', message = 'review validation failed';
  end if;

  -- One atomic claim. PostgreSQL locks/rechecks a conflicting row, so two
  -- concurrent requests from the same client cannot both pass the cooldown.
  insert into public.review_rate_limits as rl
    (client_hash, last_submission_at, submission_count)
  values (p_client_hash, now(), 1)
  on conflict (client_hash) do update
    set last_submission_at = now(),
        submission_count = rl.submission_count + 1
    where rl.last_submission_at <= now() - make_interval(secs => p_cooldown_seconds)
  returning true into v_claimed;

  if not coalesce(v_claimed, false) then
    select last_submission_at into v_last
      from public.review_rate_limits where client_hash = p_client_hash;
    v_retry := greatest(1, ceil(extract(epoch from
      (v_last + make_interval(secs => p_cooldown_seconds) - now())))::integer);
    return jsonb_build_object('status', 'rate_limited', 'retry_after', v_retry);
  end if;

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

revoke all on function public.submit_review(text, text, integer, text, text, integer) from public, anon, authenticated;
grant execute on function public.submit_review(text, text, integer, text, text, integer) to service_role;

create or replace function public.prune_review_rate_limits(p_older_than interval default interval '1 day')
returns bigint
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_deleted bigint;
begin
  delete from public.review_rate_limits where last_submission_at < now() - p_older_than;
  get diagnostics v_deleted = row_count;
  return v_deleted;
end;
$$;

revoke all on function public.prune_review_rate_limits(interval) from public, anon, authenticated;
grant execute on function public.prune_review_rate_limits(interval) to service_role;

comment on table public.review_rate_limits is 'Salted client hashes only; no raw IP addresses are stored.';
comment on function public.submit_review(text, text, integer, text, text, integer) is 'Validates and atomically rate-limits a review insertion.';
