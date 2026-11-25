# Review page setup and operations

The review page is served at `/reviews/`. Its checked-in public settings point to the configured Supabase project and include the public Turnstile site key. Review writes remain unavailable until the database migrations and Edge Function secrets are provisioned and the function is deployed.

## Supabase provisioning

1. For a fresh Supabase project, run `supabase/migrations/20260918120000_reviews.sql`, `supabase/migrations/20260918120100_rate_limit.sql`, and `supabase/migrations/20261124100000_reviews_approval.sql` in timestamp order. The approval migration is safe to run after the initial schema and also upgrades existing installations to explicit `is_approved` filtering.
2. Deploy `supabase/functions/submit-review` and keep `verify_jwt = false` for that function as configured in `supabase/config.toml`. It still verifies the public browser key, allowed origin and Turnstile challenge, then calls the database through its private service-role key.
3. Create a Cloudflare Turnstile widget for `vrfhomeinteriors.com` (and `www.vrfhomeinteriors.com` if used).
4. Set function secrets in Supabase, never in frontend JavaScript:

   ```sh
   supabase secrets set \
     IP_HASH_SALT="$(openssl rand -hex 32)" \
     TURNSTILE_SECRET_KEY="<Cloudflare Turnstile secret>" \
     REVIEW_COOLDOWN_SECONDS=300 \
     ALLOWED_ORIGINS=https://vrfhomeinteriors.com,https://www.vrfhomeinteriors.com
   ```

   Supabase supplies `SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY` to Edge Functions. `TRUSTED_PROXY_HOPS` may be set only after confirming the deployed proxy chain. The function fails closed if required secrets, a trustworthy client address, or the CAPTCHA verification service are unavailable.
5. Confirm `url`, `publishableKey` (public/anon key only), `submitFunction`, `functionsUrl`, and `turnstileSiteKey` in `js/supabase-config.js` match the project. The page size is 10. Bump `?v=` on edited scripts because root hosting rules mark JavaScript as immutable.
6. Verify the public table policies and view, then exercise reads, submission, rate limits, CAPTCHA rejection, and deletion via the Supabase dashboard. Reviews publish immediately; there is no public edit/delete or moderation interface.

The service-role key, Turnstile secret, database password and IP hash salt must never be copied into browser-delivered files. `supabase/` is backend source and must not be included in a static website release. A nested Apache denial rule and the root `htaccess-root.txt` template provide additional protection if those files are accidentally present on Apache hosting.

`public.review_rate_limits` retains salted client hashes and timestamps for cooldown enforcement. Schedule `public.prune_review_rate_limits(interval '1 day')` with Supabase Cron (or another trusted scheduler) to remove expired limiter entries; the review rows themselves remain until removed by an authorized project operator.

## Local/offline behavior

When the public Supabase settings are empty, the page can render permission-cleared `pageReviews` from `window.VRF_REVIEWS_CONFIG` in `js/reviews-config.js`. It can also use published entries from that file’s existing `reviews` array. The fallback is not a write path. Do not add invented or unapproved testimonials to either array.

## Test checklist for an enabled deployment

- Read the first page and confirm newest-first order, exact count, summary totals and the next page at 10 items.
- Submit a valid review and confirm it appears at the top; confirm the database contains the cleaned four review fields and timestamp.
- Verify 422 field validation, failed Turnstile (403), missing Turnstile configuration (503), one accepted submission per configured cooldown (429), and recovery after the timer.
- As `anon`, verify `SELECT` succeeds and direct insert/update/delete plus `submit_review` execution are denied. Confirm the Edge Function’s service key is not present in any public asset.
- Test keyboard-only stars, field error announcements, reduced motion, dark theme, and real desktop/tablet/mobile browsers at narrow widths. Check browser console/network errors and horizontal overflow.

The frontend contains only the public Supabase URL and publishable key. This checkout does not verify that the live database migrations, Edge Function deployment or server-side secrets are in place, so an authorized operator must complete the live acceptance checklist against the deployed project.
