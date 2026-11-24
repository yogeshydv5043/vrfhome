/* Analytics placeholder — intentionally inert.
   No analytics or tracking is loaded and no requests are sent. Enabling
   anything here requires updating the privacy policy and adding consent
   controls first.
   Reintroducing measurement requires a privacy review and consent controls. */
(() => {
  "use strict";
  Studio.track = () => {};
  try {
    localStorage.removeItem("studio-measurement-consent");
  } catch (_) {
    // The site also works when browser storage is unavailable.
  }
})();
