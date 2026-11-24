-- Public customer reviews. Run before 20260918120100_rate_limit.sql.
-- PostgreSQL 15+ is required for security_invoker views (Supabase supports it).
create table if not exists public.reviews (
  id uuid primary key default gen_random_uuid(),
  name varchar(30) not null,
  rating smallint not null,
  comment varchar(60) not null,
  location varchar(40) not null,
  created_at timestamptz not null default now(),
  constraint reviews_name_length check (char_length(regexp_replace(btrim(name), '[[:space:]]+', ' ', 'g')) between 3 and 30),
  constraint reviews_rating_range check (rating between 1 and 5),
  constraint reviews_comment_length check (char_length(regexp_replace(btrim(comment), '[[:space:]]+', ' ', 'g')) between 10 and 60),
  constraint reviews_location_length check (char_length(regexp_replace(btrim(location), '[[:space:]]+', ' ', 'g')) between 10 and 40)
);

create index if not exists reviews_created_at_desc_idx
  on public.reviews (created_at desc, id desc);

alter table public.reviews enable row level security;
drop policy if exists "Public can read reviews" on public.reviews;
create policy "Public can read reviews" on public.reviews
  for select to anon, authenticated using (true);

revoke all on table public.reviews from anon, authenticated;
grant select on table public.reviews to anon, authenticated;
revoke all on table public.reviews from service_role;
grant select, insert on table public.reviews to service_role;

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
from public.reviews;

grant select on public.review_summary to anon, authenticated;

comment on table public.reviews is 'Customer reviews. Public read only; public writes are mediated by submit-review.';
comment on view public.review_summary is 'Aggregate counts over the public written reviews; obeys caller RLS.';
