/* Public Supabase/Turnstile settings for the customer reviews page.
   These values are delivered to every visitor. Never put service-role,
   database-password, or Turnstile secret values in this file. */
window.VRF_SUPABASE_CONFIG = Object.freeze({
  url: "https://rryfjuzvdlymtbiqtqeu.supabase.co",
  publishableKey: "sb_publishable_xERYpOzqM7NsKBNmT6qoHg__92K9ULi",
  submitFunction: "submit-review",
  functionsUrl: "https://rryfjuzvdlymtbiqtqeu.supabase.co/functions/v1",
  turnstileSiteKey: "0x4AAAAAAGRA7iO5YcvUusYP",
  pageSize: 10,
  revealFormAfterLoadMore: true,
  timeoutMs: 12000,
});
