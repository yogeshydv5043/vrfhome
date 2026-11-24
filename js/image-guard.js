/* Best-effort deterrents against casually saving photographs and films.
   This is NOT download protection and NOT DRM -- see the honest limits at
   the bottom of this file. Keyboard navigation, text selection outside
   media, scrolling and every gallery click must keep working.

   Covers both stills and video. Video elements on this site are built at
   runtime by js/media-gallery.js, so the MutationObserver below is what
   actually catches them; they never exist in the served HTML. */
(() => {
  "use strict";

  const selector = "img, picture, svg[role='img'], video";

  function protect(node) {
    if (!(node instanceof Element)) return;

    const harden = (media) => {
      if (media.tagName === "IMG") {
        media.draggable = false;
        return;
      }
      /* video */
      media.draggable = false;
      /* Removes "Download" from the native control bar in Chrome, Edge and
         Safari, and blocks the Cast route, which otherwise hands the file
         to another device. Firefox honours neither and still shows its own
         menu -- noted in the limits below. */
      const list = media.getAttribute("controlsList") || "";
      if (!/\bnodownload\b/.test(list)) {
        media.setAttribute(
          "controlsList",
          (list + " nodownload noremoteplayback noplaybackrate").trim()
        );
      }
      /* Picture-in-picture pops the film into a floating window that sits
         outside this page's handlers, where the context menu is native. */
      media.disablePictureInPicture = true;
      media.setAttribute("disablePictureInPicture", "");
      media.setAttribute("disableRemotePlayback", "");
    };

    if (node.matches("img, video")) harden(node);
    node.querySelectorAll("img, video").forEach(harden);
  }

  protect(document.documentElement);

  new MutationObserver((records) => {
    records.forEach((record) => record.addedNodes.forEach(protect));
  }).observe(document.body, { childList: true, subtree: true });

  /* dragstart  -- stops dragging a file straight onto the desktop.
     contextmenu -- stops right-click "Save image as" / "Save video as".
     selectstart -- stops the drag-select that makes dragging easy.
     Scoped with closest() so text elsewhere on the page stays selectable. */
  ["dragstart", "contextmenu", "selectstart"].forEach((type) => {
    document.addEventListener(
      type,
      (event) => {
        if (event.target instanceof Element && event.target.closest(selector))
          event.preventDefault();
      },
      { capture: true }
    );
  });

  /* iOS and Android long-press opens a native "Save Image" sheet that the
     contextmenu handler above does not always receive. Cancelling the
     touch once it passes ~500 ms suppresses the sheet, while a normal tap
     -- which is far shorter -- still opens the lightbox. */
  let pressTimer = null;
  document.addEventListener(
    "touchstart",
    (event) => {
      if (!(event.target instanceof Element) || !event.target.closest(selector))
        return;
      pressTimer = setTimeout(() => {
        pressTimer = null;
      }, 500);
    },
    { passive: true, capture: true }
  );
  ["touchend", "touchcancel", "touchmove"].forEach((type) => {
    document.addEventListener(
      type,
      () => {
        if (pressTimer) {
          clearTimeout(pressTimer);
          pressTimer = null;
        }
      },
      { passive: true, capture: true }
    );
  });
})();

/* ---------------------------------------------------------------------
   WHAT THIS CANNOT DO -- please read before assuming the media is safe.

   Every photograph and film on this site is a public file. The browser
   has to download it in order to show it, so it is already on the
   visitor's machine by the time they see it. Anything below defeats the
   measures above in seconds, and nothing written in JavaScript can stop
   them:

     - opening the image URL directly, or View Source / DevTools
     - the browser's own cache folder, or Save Page As
     - any screenshot, on any device, including a phone camera
     - disabling JavaScript entirely
     - a browser extension, or curl

   What this file does is stop the casual save: the right-click, the
   drag-to-desktop, the long-press, the Download button in the player.
   That is the honest ceiling for a static site.

   If the photographs genuinely must be protected, the only measures that
   work are a visible watermark burnt into the image, uploading at a size
   too small to reprint, or serving from signed short-lived URLs behind a
   login. Ask before adding any of those -- each one has a real cost to
   how the site looks or how it is hosted.
   --------------------------------------------------------------------- */
