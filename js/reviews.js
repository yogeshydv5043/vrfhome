/* Home page customer review slider and live Supabase rating summary.
   The slider uses permission-cleared local review excerpts; summary statistics
   are aggregated by the existing public.review_summary view. */
(() => {
  "use strict";
  const section = document.getElementById("client-reviews");
  if (!section) return;
  const config = window.VRF_REVIEWS_CONFIG || {};
  if (config.enabled === false) { section.hidden = true; return; }
  const supabaseConfig = window.VRF_SUPABASE_CONFIG || {};
  const averageNodes = Array.from(document.querySelectorAll("[data-rating-value]"));
  const scaleNodes = Array.from(document.querySelectorAll("[data-rating-scale]"));
  const countNodes = Array.from(document.querySelectorAll("[data-rating-count]"));
  const starsNode = section.querySelector("[data-rating-stars]");
  const statsStatus = section.querySelector("[data-rating-status]");
  const breakdown = section.querySelector("[data-rating-breakdown]");
  const proofPanel = document.getElementById("reviews-proof");
  let lastStatsFetch = 0;
  let statsRequest = null;
  let statsRefreshQueued = false;

  function setUnavailable() {
    averageNodes.forEach((node) => { node.textContent = "—"; });
    scaleNodes.forEach((node) => { node.hidden = true; });
    countNodes.forEach((node) => { node.textContent = "Review count unavailable"; });
    if (starsNode) { starsNode.textContent = ""; starsNode.hidden = true; }
    if (breakdown) { breakdown.replaceChildren(); breakdown.hidden = true; }
    if (statsStatus) statsStatus.textContent = "Live review statistics could not be loaded.";
    if (proofPanel) proofPanel.setAttribute("aria-label", "Live review statistics are unavailable");
  }

  function displayStatistics(row) {
    const total = Number(row?.total);
    const average = Number(row?.average);
    const ratings = [Number(row?.five_star), Number(row?.four_star), Number(row?.three_star), Number(row?.two_star), Number(row?.one_star)];
    if (!Number.isSafeInteger(total) || total < 0 || !Number.isFinite(average) || average < 0 || average > 5
        || ratings.some((count) => !Number.isSafeInteger(count) || count < 0)
        || ratings.reduce((sum, count) => sum + count, 0) !== total) throw new Error("invalid_review_summary");

    const hasRatings = total > 0;
    averageNodes.forEach((node) => { node.textContent = hasRatings ? average.toFixed(1) : "—"; });
    scaleNodes.forEach((node) => { node.hidden = !hasRatings; });
    countNodes.forEach((node) => { node.textContent = `${total.toLocaleString("en-IN")} approved ${total === 1 ? "review" : "reviews"}`; });
    if (starsNode) {
      const filled = Math.max(0, Math.min(5, Math.round(average)));
      starsNode.textContent = "★".repeat(filled) + "☆".repeat(5 - filled);
      starsNode.hidden = !hasRatings;
    }
    if (proofPanel) {
      proofPanel.setAttribute("aria-label", hasRatings
        ? `Average rating ${average.toFixed(1)} out of 5 from ${total} approved reviews`
        : "No approved customer reviews yet");
    }
    if (statsStatus) statsStatus.textContent = hasRatings
      ? "Average rating and star counts include approved customer reviews."
      : "No approved customer reviews yet.";

    if (breakdown) {
      breakdown.replaceChildren();
      ratings.forEach((count, index) => {
        const rating = 5 - index;
        const rowNode = document.createElement("div");
        rowNode.className = "proof-breakdown-row";
        const label = document.createElement("span");
        label.className = "proof-breakdown-label";
        label.textContent = `${rating} star`;
        const track = document.createElement("span");
        track.className = "proof-breakdown-track";
        track.setAttribute("aria-hidden", "true");
        const fill = document.createElement("span");
        fill.className = "proof-breakdown-fill";
        fill.style.width = hasRatings ? `${(count / total) * 100}%` : "0%";
        track.append(fill);
        const amount = document.createElement("span");
        amount.className = "proof-breakdown-count";
        amount.textContent = count.toLocaleString("en-IN");
        rowNode.append(label, track, amount);
        breakdown.append(rowNode);
      });
      breakdown.hidden = !hasRatings;
    }
  }

  async function refreshStatistics(force = false) {
    if (statsRequest) {
      if (force) statsRefreshQueued = true;
      return statsRequest;
    }
    if (!force && Date.now() - lastStatsFetch < 30000) return;
    let endpoint = "";
    try {
      const parsed = new URL(typeof supabaseConfig.url === "string" ? supabaseConfig.url.trim() : "");
      const local = ["localhost", "127.0.0.1"].includes(parsed.hostname);
      if (!parsed.username && !parsed.password && (parsed.protocol === "https:" || (local && parsed.protocol === "http:"))) {
        endpoint = parsed.href.replace(/\/+$/, "");
      }
    } catch (_) {}
    const key = typeof supabaseConfig.publishableKey === "string" ? supabaseConfig.publishableKey.trim() : "";
    if (!endpoint || !key) { setUnavailable(); return; }
    statsRequest = (async () => {
      const controller = new AbortController();
      const timeout = window.setTimeout(() => controller.abort(), 10000);
      try {
        const url = `${endpoint}/rest/v1/review_summary?select=total,average,five_star,four_star,three_star,two_star,one_star`;
        const response = await fetch(url, {
          headers: { apikey: key, Authorization: `Bearer ${key}`, Accept: "application/json" },
          cache: "no-store",
          signal: controller.signal,
        });
        if (!response.ok) throw new Error("review_summary_unavailable");
        const result = await response.json();
        const row = Array.isArray(result) ? result[0] : result;
        if (!row) throw new Error("review_summary_empty");
        displayStatistics(row);
        lastStatsFetch = Date.now();
      } catch (_) {
        setUnavailable();
      } finally {
        window.clearTimeout(timeout);
        statsRequest = null;
        if (statsRefreshQueued) {
          statsRefreshQueued = false;
          refreshStatistics(true);
        }
      }
    })();
    return statsRequest;
  }

  refreshStatistics();
  window.addEventListener("storage", (event) => {
    if (event.key === "vrf-review-stats-updated") refreshStatistics(true);
  });
  document.addEventListener("visibilitychange", () => {
    if (!document.hidden) refreshStatistics();
  });
  window.addEventListener("focus", () => refreshStatistics());

  // Trims a value, tolerating a missing one.
  const text = value => typeof value === "string" ? value.trim() : "";
  // Accepts only an http(s) link for the 'read the original' source.
  const safeSource = value => {
    try { const url = new URL(text(value)); return url.protocol === "https:" && !url.username && !url.password ? url.href : ""; }
    catch (_) { return ""; }
  };
  // Accepts only a real date, so a typo cannot render as Invalid Date.
  const validDate = value => {
    const raw = text(value);
    if (!/^\d{4}-\d{2}-\d{2}$/.test(raw)) return "";
    const date = new Date(raw + "T00:00:00Z");
    return Number.isFinite(date.getTime()) && date.toISOString().slice(0,10) === raw ? raw : "";
  };
  const published = (Array.isArray(config.reviews) ? config.reviews : [])
    .filter(item => item && item.published === true && text(item.name) && text(item.quote))
    .map(item => {
      const number = typeof item.rating === "number" || typeof item.rating === "string" ? Number(item.rating) : NaN;
      return {
        name:text(item.name), quote:text(item.quote), projectType:text(item.projectType),
        location:text(item.location), rating:Number.isInteger(number) && number >= 1 && number <= 5 ? number : null,
        date:validDate(item.date), sourceLabel:text(item.sourceLabel), sourceUrl:safeSource(item.sourceUrl),
      };
    });
  /* Only genuine, permission-cleared customer feedback is ever rendered.
     There is deliberately no invented/sample review fallback. */
  const emptyState = ["message","hide"].includes(config.emptyState) ? config.emptyState : "message";
  if (!published.length && emptyState === "hide") { section.hidden = true; return; }
  const reviews = published;
  const slider = section.querySelector(".testimonial-slider");
  const content = document.getElementById("testimonial-content");
  const controls = section.querySelector(".slider-controls");
  const note = document.getElementById("reviews-note");
  const quote = document.getElementById("testimonial-quote");
  const person = document.getElementById("testimonial-person");
  const rating = section.querySelector(".rating");
  const badge = document.getElementById("review-kind");
  const source = document.getElementById("review-source");
  const position = document.getElementById("review-position");
  const metaLine = document.getElementById("review-meta");
  const avatar = document.getElementById("review-avatar");
  const dots = section.querySelector(".slider-dots");
  content.hidden = reviews.length === 0;
  controls.hidden = reviews.length <= 1;
  note.textContent = published.length ? "Client feedback shared with permission." : "";
  note.hidden = !note.textContent;
  slider.setAttribute("aria-label", "Client reviews");
  if (!reviews.length) { slider.removeAttribute("aria-roledescription"); return; }
  if (reviews.length === 1) slider.removeAttribute("aria-roledescription");
  let active = 0;
  const dotButtons = reviews.map((item,i) => {
    const button = document.createElement("button");
    button.type = "button";
    button.className = "slider-dot";
    button.setAttribute("aria-label", `Show review ${i+1}: ${item.name}`);
    button.addEventListener("click", () => show(i));
    return button;
  });
  dots.replaceChildren(...dotButtons);
  // Renders one review: rating, quote, initials, name, location and date,
  // and updates the position counter and control states.
  function show(index) {
    active = (index + reviews.length) % reviews.length;
    const item = reviews[active];
    content.setAttribute("aria-busy","true");
    content.setAttribute("aria-label", `Review ${active+1} of ${reviews.length}`);
    quote.textContent = item.quote;
    person.textContent = item.name;

    /* Initials stand in for a photo: customers rarely supply one, and an
       empty circle looks broken. Two letters max, from the first two words. */
    if (avatar) {
      const initials = item.name
        .split(/\s+/)
        .filter(Boolean)
        .slice(0, 2)
        .map((word) => word[0])
        .join("")
        .toUpperCase();
      avatar.textContent = initials;
      avatar.hidden = !initials;
    }

    /* Project type and location on one line, the date on its own, so the
       card keeps a predictable height whichever fields a review supplies. */
    if (metaLine) {
      metaLine.replaceChildren();
      const details = [item.projectType, item.location].filter(Boolean);
      if (details.length) {
        const where = document.createElement("span");
        where.className = "review-where";
        where.textContent = details.join(" · ");
        metaLine.append(where);
      }
      if (item.date) {
        const time = document.createElement("time");
        time.className = "review-date";
        time.dateTime = item.date;
        time.textContent = new Intl.DateTimeFormat("en-IN", {
          day: "numeric", month: "short", year: "numeric", timeZone: "UTC",
        }).format(new Date(item.date + "T00:00:00Z"));
        metaLine.append(time);
      }
      metaLine.hidden = !metaLine.childNodes.length;
    }
    badge.hidden = true;
    badge.textContent = "";
    rating.hidden = item.rating === null;
    rating.replaceChildren();
    rating.removeAttribute("aria-label");
    if (item.rating !== null) {
      const stars = document.createElement("span");
      stars.className = "review-stars";
      stars.setAttribute("aria-hidden","true");
      stars.textContent = "★".repeat(item.rating) + "☆".repeat(5-item.rating);
      rating.append(stars);
      rating.setAttribute("aria-label",`${item.rating} out of 5 stars`);
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
    dotButtons.forEach((dot,i) => {
      dot.classList.toggle("active",i === active);
      dot.setAttribute("aria-pressed",String(i === active));
    });
    content.setAttribute("aria-busy","false");
  }
  show(0);
  if (reviews.length <= 1) return;
  section.querySelector(".testimonial-prev").addEventListener("click",() => show(active-1));
  section.querySelector(".testimonial-next").addEventListener("click",() => show(active+1));
  slider.addEventListener("keydown",event => {
    if (event.altKey || event.ctrlKey || event.metaKey) return;
    const indices = {ArrowLeft:active-1,ArrowRight:active+1,Home:0,End:reviews.length-1};
    if (Object.prototype.hasOwnProperty.call(indices,event.key)) { event.preventDefault(); show(indices[event.key]); }
  });
  let start = null;
  slider.addEventListener("touchstart",event => {
    start = event.touches.length === 1 ? {x:event.touches[0].clientX,y:event.touches[0].clientY} : null;
  },{passive:true});
  slider.addEventListener("touchcancel",() => { start = null; },{passive:true});
  slider.addEventListener("touchend",event => {
    if (!start || event.changedTouches.length !== 1) { start = null; return; }
    const dx = event.changedTouches[0].clientX-start.x,dy = event.changedTouches[0].clientY-start.y;
    start = null;
    if (Math.abs(dx)>60 && Math.abs(dx)>Math.abs(dy)*1.3) show(active+(dx<0?1:-1));
  },{passive:true});
})();
