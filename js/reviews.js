/* Home page review carousel: newest approved reviews from the shared public
   snapshot. Ratings are deliberately not shown here. */
(() => {
  "use strict";
  const section = document.getElementById("client-reviews");
  if (!section) return;
  const config = window.VRF_REVIEWS_CONFIG || {};
  if (config.enabled === false) { section.hidden = true; return; }

  const slider = section.querySelector(".testimonial-slider");
  const content = document.getElementById("testimonial-content");
  const controls = section.querySelector(".slider-controls");
  const note = document.getElementById("reviews-note");
  const quote = document.getElementById("testimonial-quote");
  const ratingNode = document.getElementById("review-rating");
  const ratingStars = ratingNode?.querySelector(".review-rating-stars");
  const ratingValue = ratingNode?.querySelector(".review-rating-value");
  const person = document.getElementById("testimonial-person");
  const source = document.getElementById("review-source");
  const position = document.getElementById("review-position");
  const metaLine = document.getElementById("review-meta");
  const avatar = document.getElementById("review-avatar");
  const dots = section.querySelector(".slider-dots");
  const supabaseConfig = window.VRF_SUPABASE_CONFIG || {};
  const limit = 5;

  function clean(value) { return typeof value === "string" ? value.trim() : ""; }
  function safeEndpoint(value) {
    try {
      const url = new URL(typeof value === "string" ? value.trim() : "");
      const local = ["localhost", "127.0.0.1"].includes(url.hostname);
      if (url.username || url.password || (url.protocol !== "https:" && !(local && url.protocol === "http:"))) return "";
      return url.href.replace(/\/+$/, "");
    } catch (_) { return ""; }
  }
  function validDate(value) {
    const raw = clean(value);
    if (!raw) return "";
    const timestamp = Date.parse(raw);
    return Number.isFinite(timestamp) ? new Date(timestamp).toISOString() : "";
  }
  function safeSource(value) {
    try {
      const url = new URL(clean(value));
      return url.protocol === "https:" && !url.username && !url.password ? url.href : "";
    } catch (_) { return ""; }
  }
  function normalizeRow(row) {
    const name = clean(row?.name);
    const text = clean(row?.comment);
    const rating = Number(row?.rating);
    if (!name || !text) return null;
    return {
      id: clean(String(row?.id ?? "")),
      name,
      quote: text,
      rating: Number.isInteger(rating) && rating >= 1 && rating <= 5 ? rating : null,
      location: clean(row?.location),
      date: validDate(row?.created_at),
      sourceLabel: "",
      sourceUrl: "",
    };
  }
  function localFallback() {
    return (Array.isArray(config.reviews) ? config.reviews : [])
      .filter((item) => item && item.published === true)
      .map((item) => {
        const normalized = normalizeRow({
          id: item.id,
          name: item.name,
          comment: item.quote,
          rating: item.rating,
          location: [clean(item.projectType), clean(item.location)].filter(Boolean).join(" · "),
          created_at: item.date,
        });
        if (!normalized) return null;
        normalized.sourceLabel = clean(item.sourceLabel);
        normalized.sourceUrl = safeSource(item.sourceUrl);
        return normalized;
      })
      .filter(Boolean)
      .sort((a, b) => (Date.parse(b.date) || 0) - (Date.parse(a.date) || 0))
      .slice(0, limit);
  }
  async function fetchLatestApproved() {
    const endpoint = safeEndpoint(supabaseConfig.url);
    const key = typeof supabaseConfig.publishableKey === "string" ? supabaseConfig.publishableKey.trim() : "";
    if (!endpoint || !key) throw new Error("review_service_unavailable");

    const url = new URL(`${endpoint}/rest/v1/approved_review_cache`);
    url.searchParams.set("select", "id,name,rating,comment,location,created_at");
    url.searchParams.set("is_approved", "eq.true");
    url.searchParams.set("order", "created_at.desc,id.desc");
    url.searchParams.set("limit", String(limit));
    const controller = new AbortController();
    const timeout = window.setTimeout(() => controller.abort(), 10000);
    try {
      const response = await fetch(url.href, {
        headers: { apikey: key, Authorization: `Bearer ${key}`, Accept: "application/json" },
        cache: "no-store",
        signal: controller.signal,
      });
      if (!response.ok) throw new Error("approved_reviews_unavailable");
      const rows = await response.json();
      if (!Array.isArray(rows)) throw new Error("approved_reviews_invalid");
      return rows.map(normalizeRow).filter(Boolean).slice(0, limit);
    } finally {
      window.clearTimeout(timeout);
    }
  }
  function displayDate(value) {
    const date = validDate(value);
    return date ? new Intl.DateTimeFormat("en-IN", {
      day: "numeric", month: "short", year: "numeric", timeZone: "UTC",
    }).format(new Date(date)) : "";
  }

  async function initialize() {
    let reviews;
    try { reviews = await fetchLatestApproved(); }
    catch (_) { reviews = localFallback(); }

    if (!reviews.length && config.emptyState === "hide") {
      section.hidden = true;
      return;
    }
    content.hidden = reviews.length === 0;
    controls.hidden = reviews.length <= 1;
    note.textContent = reviews.length
      ? "Browse up to five of our latest approved customer reviews."
      : "No approved customer reviews are available yet.";
    note.hidden = false;
    slider.setAttribute("aria-label", "Latest customer reviews");
    if (reviews.length <= 1) slider.removeAttribute("aria-roledescription");
    if (!reviews.length) return;

    let active = 0;
    const dotButtons = reviews.map((item, index) => {
      const button = document.createElement("button");
      button.type = "button";
      button.className = "slider-dot";
      button.setAttribute("aria-label", `Show review ${index + 1}: ${item.name}`);
      button.addEventListener("click", () => navigateTo(index));
      return button;
    });
    dots.replaceChildren(...dotButtons);

    let rotationTimer = 0;
    let touchResumeTimer = 0;
    const motionPreference = window.matchMedia?.("(prefers-reduced-motion: reduce)");
    let reducedMotion = motionPreference?.matches === true;
    let hovered = false;
    let focused = false;
    let touching = false;

    function updateRotationTimer() {
      if (rotationTimer) window.clearInterval(rotationTimer);
      rotationTimer = 0;
      if (reducedMotion || hovered || focused || touching || document.hidden) return;
      rotationTimer = window.setInterval(() => show(active + 1, true), 6000);
    }
    function navigateTo(index) {
      show(index);
      updateRotationTimer();
    }
    function show(index, automatic = false) {
      active = (index + reviews.length) % reviews.length;
      const item = reviews[active];
      content.setAttribute("aria-busy", "true");
      content.setAttribute("aria-live", automatic ? "off" : "polite");
      content.setAttribute("aria-label", `Review ${active + 1} of ${reviews.length}`);
      quote.textContent = item.quote;
      person.textContent = item.name;
      if (ratingNode) {
        ratingNode.hidden = item.rating === null;
        ratingNode.removeAttribute("aria-label");
        if (ratingStars) ratingStars.textContent = item.rating === null ? "" : "★".repeat(item.rating) + "☆".repeat(5 - item.rating);
        if (ratingValue) ratingValue.textContent = item.rating === null ? "" : `${item.rating}/5`;
        if (item.rating !== null) ratingNode.setAttribute("aria-label", `${item.rating} out of 5 stars`);
      }

      if (avatar) {
        avatar.textContent = item.name.split(/\s+/).filter(Boolean).slice(0, 2)
          .map((word) => word[0]).join("").toUpperCase();
        avatar.hidden = !avatar.textContent;
      }
      if (metaLine) {
        metaLine.replaceChildren();
        if (item.location) {
          const location = document.createElement("span");
          location.className = "review-where";
          location.textContent = item.location;
          metaLine.append(location);
        }
        const formattedDate = displayDate(item.date);
        if (formattedDate) {
          const time = document.createElement("time");
          time.className = "review-date";
          time.dateTime = item.date;
          time.textContent = formattedDate;
          metaLine.append(time);
        }
        metaLine.hidden = !metaLine.childNodes.length;
      }

      source.hidden = !item.sourceUrl;
      source.removeAttribute("href");
      source.textContent = "";
      if (item.sourceUrl) {
        source.href = item.sourceUrl;
        source.textContent = item.sourceLabel ? `Read original review on ${item.sourceLabel}` : "Read original review";
      }
      position.replaceChildren();
      const current = document.createElement("strong");
      current.textContent = String(active + 1);
      position.append(current, document.createTextNode(` of ${reviews.length}`));
      dotButtons.forEach((dot, dotIndex) => {
        dot.classList.toggle("active", dotIndex === active);
        dot.setAttribute("aria-pressed", String(dotIndex === active));
      });
      content.setAttribute("aria-busy", "false");
    }

    show(0);
    if (reviews.length <= 1) return;
    section.querySelector(".testimonial-prev").addEventListener("click", () => navigateTo(active - 1));
    section.querySelector(".testimonial-next").addEventListener("click", () => navigateTo(active + 1));
    slider.addEventListener("keydown", (event) => {
      if (event.altKey || event.ctrlKey || event.metaKey) return;
      const indices = { ArrowLeft: active - 1, ArrowRight: active + 1, Home: 0, End: reviews.length - 1 };
      if (Object.prototype.hasOwnProperty.call(indices, event.key)) {
        event.preventDefault();
        navigateTo(indices[event.key]);
      }
    });
    slider.addEventListener("mouseenter", () => { hovered = true; updateRotationTimer(); });
    slider.addEventListener("mouseleave", () => { hovered = false; updateRotationTimer(); });
    slider.addEventListener("focusin", () => { focused = true; updateRotationTimer(); });
    slider.addEventListener("focusout", (event) => {
      if (!slider.contains(event.relatedTarget)) { focused = false; updateRotationTimer(); }
    });
    document.addEventListener("visibilitychange", updateRotationTimer);
    motionPreference?.addEventListener?.("change", (event) => {
      reducedMotion = event.matches;
      updateRotationTimer();
    });

    let start = null;
    function pauseForTouch() {
      touching = true;
      updateRotationTimer();
      if (touchResumeTimer) window.clearTimeout(touchResumeTimer);
      touchResumeTimer = window.setTimeout(() => {
        touching = false;
        updateRotationTimer();
      }, 2500);
    }
    slider.addEventListener("touchstart", (event) => {
      pauseForTouch();
      start = event.touches.length === 1 ? { x: event.touches[0].clientX, y: event.touches[0].clientY } : null;
    }, { passive: true });
    slider.addEventListener("touchcancel", () => { start = null; pauseForTouch(); }, { passive: true });
    slider.addEventListener("touchend", (event) => {
      if (start && event.changedTouches.length === 1) {
        const dx = event.changedTouches[0].clientX - start.x;
        const dy = event.changedTouches[0].clientY - start.y;
        if (Math.abs(dx) > 60 && Math.abs(dx) > Math.abs(dy) * 1.3) navigateTo(active + (dx < 0 ? 1 : -1));
      }
      start = null;
      pauseForTouch();
    }, { passive: true });
    updateRotationTimer();
  }

  initialize();
})();
