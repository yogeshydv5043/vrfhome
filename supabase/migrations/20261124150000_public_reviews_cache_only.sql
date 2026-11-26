-- Apply this after deploying the frontend that reads approved_review_cache.
-- Prevent public clients from bypassing the shared 30-minute snapshot by
-- querying the base table directly. Service-role Edge Functions retain write
-- and returning-read access for submissions.

revoke select on public.reviews from public, anon, authenticated;
grant select, insert on public.reviews to service_role;

notify pgrst, 'reload schema';
