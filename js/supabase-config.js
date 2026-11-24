/* Public Supabase/Turnstile settings for the customer reviews page.
   These values are delivered to every visitor. Never put service-role,
   database-password, or Turnstile secret values in this file. */
window.VRF_SUPABASE_CONFIG = Object.freeze({
  url: "",
  publishableKey: "",
  /* Optional separate functions origin; leave empty to use {url}/functions/v1. */
  functionsUrl: "",
  turnstileSiteKey: "0x4AAAAAAGRA7iO5YcvUusYP",
  pageSize: 10,
  revealFormAfterLoadMore: false,
  timeoutMs: 12000,
});
