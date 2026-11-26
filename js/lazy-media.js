/* Site-wide deferred-media policy. Static images use native lazy loading;
   data-src media is promoted near the viewport, with explicit failure UI. */
(() => {
  "use strict";
  const canObserve = "IntersectionObserver" in window;
  const observer = canObserve
    ? new IntersectionObserver((entries) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return;
          activate(entry.target);
          observer.unobserve(entry.target);
        });
      }, { rootMargin: "320px 0px" })
    : null;

  function fallbackFor(image, failedSource) {
    if (!image.isConnected || image.dataset.mediaFailureHandled === "true" || image.classList.contains("image-error")) return;
    if ((image.currentSrc || image.src) !== failedSource || image.dataset.usedOriginal === "1") return;
    image.dataset.mediaFailureHandled = "true";
    const box = image.getBoundingClientRect();
    const width = Math.max(24, Math.round(box.width || Number(image.getAttribute("width")) || 320));
    const height = Math.max(24, Math.round(box.height || Number(image.getAttribute("height")) || width * 0.66));
    const placeholder = document.createElement("span");
    placeholder.className = "media-load-fallback";
    placeholder.setAttribute("role", image.alt ? "img" : "status");
    if (image.alt) placeholder.setAttribute("aria-label", `${image.alt} (image unavailable)`);
    placeholder.textContent = "Image unavailable";
    placeholder.style.setProperty("--media-fallback-width", `${width}px`);
    placeholder.style.setProperty("--media-fallback-ratio", `${width} / ${height}`);
    image.hidden = true;
    image.insertAdjacentElement("afterend", placeholder);
  }

  function watchImage(image) {
    if (image.dataset.mediaObserved === "true") return;
    image.dataset.mediaObserved = "true";
    const critical = image.fetchPriority === "high" || image.closest(".site-header, .hero, .story-hero");
    if (!image.hasAttribute("loading")) image.loading = critical ? "eager" : "lazy";
    if (!critical && !image.hasAttribute("decoding")) image.decoding = "async";
    image.addEventListener("error", () => {
      const failedSource = image.currentSrc || image.src;
      window.setTimeout(() => fallbackFor(image, failedSource), 0);
    });
    if (image.dataset.src || image.dataset.srcset) {
      image.loading = "lazy";
      if (observer) observer.observe(image);
      else activate(image);
    }
  }

  function watchVideo(video) {
    if (video.dataset.mediaObserved === "true") return;
    video.dataset.mediaObserved = "true";
    if (!video.hasAttribute("preload")) video.preload = "none";
    const deferredSource = video.dataset.src || video.querySelector("source[data-src]");
    if (deferredSource && observer) observer.observe(video);
    else if (deferredSource) {
      video.addEventListener("pointerdown", () => activate(video), { once: true });
      video.addEventListener("keydown", () => activate(video), { once: true });
      video.addEventListener("play", () => activate(video), { once: true });
    }
    video.addEventListener("error", () => {
      if (video.closest("#media-viewer")?.querySelector("#media-error")) return;
      const fallback = video.parentElement?.querySelector(".media-video-fallback");
      if (fallback) { fallback.hidden = false; return; }
      const note = document.createElement("p");
      note.className = "media-video-fallback";
      note.setAttribute("role", "status");
      note.textContent = "This video could not be loaded. Please try again later.";
      video.insertAdjacentElement("afterend", note);
    });
  }

  function activate(media) {
    if (media instanceof HTMLImageElement) {
      if (media.dataset.srcset) { media.srcset = media.dataset.srcset; delete media.dataset.srcset; }
      if (media.dataset.src) { media.src = media.dataset.src; delete media.dataset.src; }
      return;
    }
    if (!(media instanceof HTMLVideoElement)) return;
    let changed = false;
    if (media.dataset.src) { media.src = media.dataset.src; delete media.dataset.src; changed = true; }
    media.querySelectorAll("source[data-src]").forEach((source) => {
      source.src = source.dataset.src;
      delete source.dataset.src;
      changed = true;
    });
    if (changed) media.load();
  }

  function inspect(node) {
    if (!(node instanceof Element)) return;
    if (node.matches("img")) watchImage(node);
    if (node.matches("video")) watchVideo(node);
    node.querySelectorAll("img").forEach(watchImage);
    node.querySelectorAll("video").forEach(watchVideo);
  }

  inspect(document.documentElement);
  new MutationObserver((records) => {
    records.forEach((record) => record.addedNodes.forEach(inspect));
  }).observe(document.documentElement, { childList: true, subtree: true });
})();
