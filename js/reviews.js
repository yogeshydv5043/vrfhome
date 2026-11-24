/* Client reviews slider.
   Renders reviews from REVIEWS_CONFIG one at a time with previous and next
   controls, star rating, reviewer initials and the location and date line.
   With no reviews published it hides the card and shows the verified public
   rating panel instead.
   Manual and config-driven: no library, no fetch, no autoplay, no tracking. */
(() => {
  "use strict";
  const section = document.getElementById("client-reviews");
  if (!section) return;
  const config = window.VRF_REVIEWS_CONFIG || {};
  if (config.enabled === false) { section.hidden = true; return; }
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
  const empty = document.getElementById("reviews-empty");
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
  empty.hidden = reviews.length > 0;
  controls.hidden = reviews.length <= 1;
  note.textContent = published.length ? "Client feedback shared with permission." : "";
  note.hidden = !note.textContent;
  /* With no written reviews published yet, show the studio's real public
     rating instead of an empty box. Every figure comes from the live business
     listing, so nothing here is invented.

     It no longer links back to that listing: the outbound link was removed on
     request and SITE_CONFIG.publicRating.sourceUrl emptied with it, so the
     `if (link)` branch below now finds nothing and does nothing. The figures
     stand on the studio's word rather than on a click-through. */
  const publicRating =
    typeof SITE_CONFIG !== "undefined" ? SITE_CONFIG.publicRating : null;
  if (!published.length && publicRating) {
    const value = empty.querySelector("[data-rating-value]");
    const count = empty.querySelector("[data-rating-count]");
    const link = empty.querySelector("[data-rating-link]");
    const stars = empty.querySelector(".proof-stars");
    if (value && publicRating.value) value.textContent = publicRating.value;
    if (count && publicRating.count) count.textContent = Number(publicRating.count).toLocaleString("en-IN");
    if (stars && publicRating.value) {
      const filled = Math.round(Number(publicRating.value));
      if (filled >= 1 && filled <= 5) stars.textContent = "★".repeat(filled) + "☆".repeat(5 - filled);
    }
    if (link) {
      const href = safeSource(publicRating.sourceUrl);
      if (href) link.href = href;
      else link.hidden = true;
    }
    empty.setAttribute("role", "img");
    empty.setAttribute(
      "aria-label",
      `Verified public rating: ${publicRating.value} out of 5, from ${publicRating.count} customer ratings`,
    );
  }
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
