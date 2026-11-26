-- Shared, database-backed snapshot for public review list and summary.
-- The materialized view contains only approved, public review fields. A single
-- pg_cron job refreshes it every half hour for all site visitors.

create extension if not exists pg_cron with schema pg_catalog;

alter table public.reviews
  alter column is_approved set default true;

create materialized view if not exists public.approved_review_cache as
select
  id,
  name,
  location,
  rating,
  comment,
  created_at,
  true as is_approved
from public.reviews
where is_approved = true;

create unique index if not exists approved_review_cache_id_uidx
  on public.approved_review_cache (id);

create index if not exists approved_review_cache_created_idx
  on public.approved_review_cache (created_at desc, id desc);

revoke all on public.approved_review_cache from public, anon, authenticated;
grant select on public.approved_review_cache to anon, authenticated;

create or replace view public.review_summary
with (security_invoker = true)
as
select
  count(*)::bigint as total,
  coalesce(round(avg(rating)::numeric, 2), 0)::numeric(4,2) as average,
  count(*) filter (where rating = 5)::bigint as five_star,
  count(*) filter (where rating = 4)::bigint as four_star,
  count(*) filter (where rating = 3)::bigint as three_star,
  count(*) filter (where rating = 2)::bigint as two_star,
  count(*) filter (where rating = 1)::bigint as one_star
from public.approved_review_cache;

revoke all on public.review_summary from public, anon, authenticated;
grant select on public.review_summary to anon, authenticated;

comment on materialized view public.approved_review_cache is
  'Shared 30-minute public snapshot containing approved reviews only.';
comment on view public.review_summary is
  'Aggregate statistics over the shared approved-review snapshot.';

do $$
declare
  existing_job record;
begin
  for existing_job in
    select jobid
    from cron.job
    where jobname = 'refresh-approved-review-cache'
  loop
    perform cron.unschedule(existing_job.jobid);
  end loop;

  perform cron.schedule(
    'refresh-approved-review-cache',
    '*/30 * * * *',
    'refresh materialized view concurrently public.approved_review_cache'
  );
end;
$$;

notify pgrst, 'reload schema';
