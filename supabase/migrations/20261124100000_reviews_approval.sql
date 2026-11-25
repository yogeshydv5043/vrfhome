-- Upgrade existing installations to explicit automatic approval semantics.
-- The default approves new submissions; public reads remain limited to approved rows.
alter table public.reviews
  add column if not exists is_approved boolean not null default true;

update public.reviews set is_approved = true where is_approved is null;
alter table public.reviews alter column is_approved set default true;
alter table public.reviews alter column is_approved set not null;

create index if not exists reviews_approved_created_at_desc_idx
  on public.reviews (created_at desc, id desc)
  where is_approved = true;

drop policy if exists "Public can read reviews" on public.reviews;
create policy "Public can read reviews" on public.reviews
  for select to anon, authenticated using (is_approved = true);

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
comment on column public.reviews.is_approved is 'Publicly visible when true; new reviews are automatically approved by the submission RPC.';
