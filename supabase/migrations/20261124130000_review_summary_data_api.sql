-- Reassert the public aggregate view for projects where the original view
-- migration was skipped or the PostgREST schema cache needs refreshing.
-- CREATE OR REPLACE keeps this idempotent and never creates a second view.
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
from public.reviews
where is_approved = true;

grant select on public.review_summary to anon, authenticated;
notify pgrst, 'reload schema';

comment on view public.review_summary is
  'Aggregate statistics over approved public reviews only; no review-level private data is exposed.';
