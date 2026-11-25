/* Reviews page: newest-first listing, summary, pagination and guarded submission.
   Supabase keys in the browser are publishable/read-only. Every write goes
   through the submit-review Edge Function and is validated again server-side. */
(() => {
  "use strict";
  const config = window.VRF_SUPABASE_CONFIG || {};
  const form = document.getElementById("review-form");
  if (!form) return;

  const RULES = Object.freeze({
    name: { min: 3, max: 30, label: "name" },
    comment: { min: 10, max: 60, label: "review" },
    location: { min: 10, max: 40, label: "location" },
  });
  const DEFAULT_COMMENTS = Object.freeze({
    1: "Poor experience. I expected better service.",
    2: "Average experience. Improvements are needed.",
    3: "Good experience. There is room for improvement.",
    4: "Very good experience! I really liked the service.",
    5: "Excellent experience! I am very satisfied with the service.",
  });
  const RATING_PROMPTS = Object.freeze({
    1: "We're sorry. Please tell us about your experience.",
    2: "Sorry to hear that. What could have been better?",
    3: "Good! What could we improve?",
    4: "Great! What made your experience positive?",
    5: "Excellent! What did you love about our service?",
  });
  const RATING_WORDS = Object.freeze({ 1: "poor", 2: "below average", 3: "average", 4: "very good", 5: "excellent" });
  const pageSize = Number.isInteger(config.pageSize) ? Math.max(1, Math.min(config.pageSize, 50)) : 10;
  const endpoint = normalizeEndpoint(config.url);
  const publishableKey = typeof config.publishableKey === "string" ? config.publishableKey.trim() : "";
  const supabaseReady = !!(endpoint && publishableKey);
  const formReady = supabaseReady && !!(typeof config.turnstileSiteKey === "string" && config.turnstileSiteKey.trim());
  const timeoutMs = Number.isFinite(config.timeoutMs) ? Math.max(1000, Math.min(config.timeoutMs, 30000)) : 12000;

  const list = document.getElementById("reviews-list");
  const loading = document.getElementById("reviews-loading");
  const errorPanel = document.getElementById("reviews-error");
  const errorText = errorPanel?.querySelector("[data-error-text]");
  const showing = document.getElementById("reviews-showing");
  const modeNote = document.getElementById("reviews-mode-note");
  const empty = document.getElementById("reviews-empty");
  const actions = document.getElementById("reviews-actions");
  const moreButton = document.getElementById("load-more-reviews");
  const moreLabel = moreButton?.querySelector("[data-load-label]");
  const moreStatus = document.getElementById("load-more-status");
  const summaryBars = document.getElementById("summary-bars");
  const summaryEmpty = document.getElementById("summary-bars-empty");
  const formSection = document.getElementById("review-form-section");
  const formDisabled = document.getElementById("review-form-disabled");
  const nameInput = document.getElementById("review-name");
  const locationInput = document.getElementById("review-location");
  const commentInput = document.getElementById("review-comment");
  const ratingGroup = document.getElementById("review-rating");
  const ratingHint = document.getElementById("rating-hint");
  const commentCount = document.getElementById("review-comment-count");
  const submitButton = document.getElementById("review-submit");
  const submitLabel = submitButton?.querySelector("[data-submit-label]");
  const status = document.getElementById("review-form-status");
  const cooldownBox = document.getElementById("review-cooldown");
  const cooldownTime = document.getElementById("review-cooldown-time");
  const captchaHost = document.getElementById("review-captcha");
  const fields = { name: nameInput, location: locationInput, comment: commentInput };
  const errors = {
    name: document.getElementById("review-name-error"),
    location: document.getElementById("review-location-error"),
    rating: document.getElementById("review-rating-error"),
    comment: document.getElementById("review-comment-error"),
  };
  let reviews = [];
  let fallbackItems = [];
  let total = 0;
  let offset = 0;
  let selectedRating = 0;
  let busy = false;
  let loadingMore = false;
  let touched = new Set();
  let summary = null;
  let turnstileWidget = null;
  let captchaToken = "";
  let captchaLoad = null;
  let cooldownTimer = 0;
  let cooldownUntil = 0;
  let formRevealed = config.revealFormAfterLoadMore !== true;

  function normalizeEndpoint(value) {
    if (typeof value !== "string" || !value.trim()) return "";
    try {
      const url = new URL(value.trim());
      const local = ["localhost", "127.0.0.1"].includes(url.hostname);
      if (url.username || url.password || (url.protocol !== "https:" && !(local && url.protocol === "http:"))) return "";
      return url.href.replace(/\/+$/, "");
    } catch (_) { return ""; }
  }
  function clean(value) { return String(value ?? "").trim().replace(/\s+/gu, " "); }
  function length(value) { return Array.from(value).length; }
  function byId(id) { return document.getElementById(id); }
  function setMessage(node, text) { if (node) node.textContent = text; }
  function setBusy(value) {
    busy = value;
    if (list) list.setAttribute("aria-busy", String(value));
    if (loading) loading.hidden = !value;
    updateSubmit();
  }
  function showError(text) {
    if (errorPanel) errorPanel.hidden = false;
    setMessage(errorText, text || "We could not load the reviews just now.");
  }
  function clearError() { if (errorPanel) errorPanel.hidden = true; }
  function setStatus(text, kind = "") {
    if (!status) return;
    status.textContent = text;
    status.className = `form-status${kind ? ` ${kind}` : ""}`;
    status.hidden = !text;
  }
  function inputValue(name) { return clean(fields[name]?.value || ""); }
  function problemFor(name) {
    if (name === "rating") return selectedRating >= 1 && selectedRating <= 5 ? "" : "Please choose a rating from 1 to 5.";
    const rule = RULES[name];
    if (!rule) return "";
    const value = inputValue(name);
    const size = length(value);
    if (!value) return `Please enter your ${rule.label}.`;
    if (size < rule.min) return `Please use at least ${rule.min} characters (${size} so far).`;
    if (size > rule.max) return `Please keep this to ${rule.max} characters or fewer.`;
    return "";
  }
  function markField(name, problem) {
    const control = fields[name];
    if (control) control.setAttribute("aria-invalid", String(!!problem));
    setMessage(errors[name], problem);
  }
  function validateField(name, revealEmpty = false) {
    const problem = problemFor(name);
    if (revealEmpty || inputValue(name)) markField(name, problem);
    else markField(name, "");
    return !problem;
  }
  function updateCount() {
    const size = length(commentInput?.value || "");
    if (commentCount) {
      commentCount.textContent = `${size}/60`;
      commentCount.classList.toggle("is-over", size > RULES.comment.max);
    }
  }
  function updateSubmit() {
    if (!submitButton) return;
    const valid = !problemFor("name") && !problemFor("location") && !problemFor("comment") && !problemFor("rating");
    const cooldown = cooldownUntil > Date.now();
    submitButton.disabled = !formReady || busy || !valid || !captchaToken || cooldown;
  }
  function fieldSummary(invalid) {
    if (invalid.length === 1) return "One field still needs attention.";
    return `${invalid.length} fields still need attention.`;
  }
  function validateAll() {
    const invalid = [];
    for (const name of ["name", "location", "rating", "comment"]) {
      touched.add(name);
      if (!validateField(name, true)) invalid.push(name);
    }
    updateCount();
    updateSubmit();
    if (invalid.length) {
      setStatus(fieldSummary(invalid), "error");
      const first = fields[invalid[0]] || ratingGroup;
      first?.focus();
      return false;
    }
    return true;
  }

  function buildStars() {
    if (!ratingGroup) return;
    ratingGroup.replaceChildren();
    for (let value = 1; value <= 5; value += 1) {
      const button = document.createElement("button");
      button.type = "button";
      button.className = "review-star";
      button.dataset.rating = String(value);
      button.setAttribute("role", "radio");
      button.setAttribute("aria-checked", "false");
      button.setAttribute("aria-label", `${value} star${value === 1 ? "" : "s"} – ${RATING_WORDS[value]}`);
      button.tabIndex = value === 1 ? 0 : -1;
      button.textContent = "★";
      button.addEventListener("click", () => setRating(value));
      button.addEventListener("mouseenter", () => paintStars(value));
      button.addEventListener("focus", () => paintStars(value));
      ratingGroup.append(button);
    }
    ratingGroup.addEventListener("mouseleave", () => paintStars(selectedRating));
    ratingGroup.addEventListener("keydown", (event) => {
      const keys = { ArrowRight: 1, ArrowUp: 1, ArrowLeft: -1, ArrowDown: -1 };
      let value = selectedRating || Number(event.target.dataset.rating) || 1;
      if (Object.prototype.hasOwnProperty.call(keys, event.key)) value = Math.max(1, Math.min(5, value + keys[event.key]));
      else if (event.key === "Home") value = 1;
      else if (event.key === "End") value = 5;
      else if (event.key === " " || event.key === "Enter") value = Number(event.target.dataset.rating) || value;
      else return;
      event.preventDefault();
      setRating(value, true);
    });
  }
  function paintStars(value) {
    ratingGroup?.querySelectorAll("[role=radio]").forEach((button) => {
      const lit = Number(button.dataset.rating) <= value;
      button.classList.toggle("is-lit", lit);
    });
  }
  function setRating(value, moveFocus = false) {
    const next = Number(value);
    if (!Number.isInteger(next) || next < 1 || next > 5) return;
    const changed = next !== selectedRating;
    selectedRating = next;
    ratingGroup?.querySelectorAll("[role=radio]").forEach((button) => {
      const selected = Number(button.dataset.rating) === next;
      button.setAttribute("aria-checked", String(selected));
      button.tabIndex = selected ? 0 : -1;
    });
    paintStars(next);
    setMessage(ratingHint, RATING_PROMPTS[next]);
    markField("rating", "");
    if (changed) {
      commentInput.value = DEFAULT_COMMENTS[next];
      updateCount();
      if (touched.has("comment")) validateField("comment", true);
    }
    if (moveFocus) ratingGroup?.querySelector(`[data-rating="${next}"]`)?.focus();
    if (status && status.classList.contains("error")) setStatus("");
    updateSubmit();
  }

  function formatDate(value) {
    const date = new Date(value);
    if (!Number.isFinite(date.getTime())) return "";
    try { return new Intl.DateTimeFormat("en-GB", { day: "numeric", month: "long", year: "numeric", timeZone: "UTC" }).format(date); }
    catch (_) { return date.toISOString().slice(0, 10); }
  }
  function createReviewCard(item, isNew = false) {
    const card = document.createElement("li");
    card.className = `review-entry${isNew ? " is-new" : ""}`;
    const head = document.createElement("div");
    head.className = "review-entry-head";
    const person = document.createElement("strong");
    person.className = "review-entry-name";
    person.textContent = clean(item.name);
    const stars = document.createElement("span");
    stars.className = "review-entry-rating";
    stars.setAttribute("role", "img");
    stars.setAttribute("aria-label", `${item.rating} out of 5 stars, ${RATING_WORDS[item.rating] || "rated"}`);
    for (let n = 1; n <= 5; n += 1) {
      const star = document.createElement("span");
      if (n > item.rating) star.className = "is-off";
      star.textContent = "★";
      stars.append(star);
    }
    head.append(person, stars);
    const comment = document.createElement("p");
    comment.className = "review-entry-comment";
    comment.textContent = clean(item.comment);
    const meta = document.createElement("div");
    meta.className = "review-entry-meta";
    const location = document.createElement("span");
    location.textContent = clean(item.location);
    meta.append(location);
    const dateText = formatDate(item.created_at);
    if (dateText) {
      const dot = document.createElement("span");
      dot.className = "review-entry-separator";
      dot.setAttribute("aria-hidden", "true");
      const time = document.createElement("time");
      time.dateTime = item.created_at;
      time.textContent = dateText;
      meta.append(dot, time);
    }
    card.append(head, comment, meta);
    return card;
  }
  function render() {
    if (!list) return;
    list.replaceChildren(...reviews.map((item) => createReviewCard(item)));
    const current = Math.min(reviews.length, total);
    if (showing) {
      showing.textContent = `Showing ${current} of ${total} ${total === 1 ? "review" : "reviews"}`;
      showing.hidden = total === 0;
    }
    if (empty) empty.hidden = reviews.length > 0 || busy || !!errorPanel && !errorPanel.hidden;
    const hasMore = reviews.length < total;
    if (actions) actions.hidden = !hasMore;
    if (moreButton) moreButton.hidden = !hasMore;
    updateSummary();
  }
  function renderSummary(value) {
    syncHeadlineRating(value);
    if (!summaryBars || !value || Number(value.total) < 1) {
      if (summaryBars) { summaryBars.replaceChildren(); summaryBars.hidden = true; }
      if (summaryEmpty) summaryEmpty.hidden = false;
      return;
    }
    const totalReviews = Math.max(0, Number(value.total) || 0);
    const counts = [value.five_star, value.four_star, value.three_star, value.two_star, value.one_star].map((n) => Math.max(0, Number(n) || 0));
    summaryBars.replaceChildren();
    summaryBars.setAttribute("role", "img");
    summaryBars.removeAttribute("aria-hidden");
    summaryBars.setAttribute("aria-label", counts.map((count, index) => `${count} of ${totalReviews} gave ${5 - index} stars`).join(". "));
    counts.forEach((count, index) => {
      const row = document.createElement("div");
      row.className = "summary-bar-row";
      const label = document.createElement("span");
      label.className = "summary-bar-label";
      label.append(document.createTextNode(`${5 - index} `));
      const star = document.createElement("span");
      star.className = "star";
      star.setAttribute("aria-hidden", "true");
      star.textContent = "★";
      label.append(star);
      const track = document.createElement("span");
      track.className = "summary-bar-track";
      track.setAttribute("aria-hidden", "true");
      const fill = document.createElement("span");
      fill.className = "summary-bar-fill";
      fill.style.width = `${Math.min(100, count / totalReviews * 100)}%`;
      track.append(fill);
      const percentage = document.createElement("span");
      percentage.className = "summary-bar-value";
      percentage.textContent = `${Math.round(count / totalReviews * 100)}%`;
      row.append(label, track, percentage);
      summaryBars.append(row);
    });
    summaryBars.hidden = false;
    if (summaryEmpty) summaryEmpty.hidden = true;
  }
  function updateSummary() {
    if (summary) return renderSummary(summary);
    if (supabaseReady) {
      if (summaryEmpty) summaryEmpty.textContent = "The written-review breakdown is temporarily unavailable.";
      return renderSummary(null);
    }
    if (summaryEmpty) summaryEmpty.textContent = "The written-review breakdown will appear as reviews are published here.";
    if (!reviews.length) return renderSummary(null);
    const counts = [5, 4, 3, 2, 1].map((rating) => reviews.filter((item) => Number(item.rating) === rating).length);
    renderSummary({ total: reviews.length, five_star: counts[0], four_star: counts[1], three_star: counts[2], two_star: counts[3], one_star: counts[4] });
  }
  function syncHeadlineRating(value) {
    const total = value && Number.isSafeInteger(Number(value.total)) ? Number(value.total) : null;
    const average = value && Number.isFinite(Number(value.average)) ? Number(value.average) : null;
    const averageNode = document.querySelector("[data-rating-value]");
    const scaleNode = document.querySelector("[data-rating-scale]");
    const countNode = document.querySelector("[data-rating-count]");
    const starsNode = document.querySelector(".summary-stars");
    const available = total !== null && total > 0 && average !== null;
    if (averageNode) averageNode.textContent = available ? average.toFixed(1) : "—";
    if (scaleNode) scaleNode.hidden = !available;
    if (countNode) countNode.textContent = total === null
      ? (supabaseReady ? "Review count unavailable" : "0 approved reviews")
      : `${total.toLocaleString("en-IN")} approved ${total === 1 ? "review" : "reviews"}`;
    if (starsNode) {
      const filled = available ? Math.max(0, Math.min(5, Math.round(average))) : 0;
      starsNode.textContent = "★".repeat(filled) + "☆".repeat(5 - filled);
      starsNode.hidden = !available;
    }
  }
  function parseTotal(response, countFallback) {
    const header = response.headers.get("content-range") || "";
    const match = header.match(/\/(\d+|\*)$/);
    return match && match[1] !== "*" ? Number(match[1]) : countFallback;
  }
  async function timedFetch(url, options = {}) {
    const controller = new AbortController();
    const timer = window.setTimeout(() => controller.abort(), timeoutMs);
    try { return await fetch(url, { ...options, signal: controller.signal }); }
    finally { window.clearTimeout(timer); }
  }
  async function fetchSummary() {
    if (!supabaseReady) return null;
    const response = await timedFetch(`${endpoint}/rest/v1/review_summary?select=*`, { headers: supabaseHeaders(), cache: "no-store" });
    if (!response.ok) throw new Error("summary_failed");
    const rows = await response.json();
    const row = Array.isArray(rows) ? rows[0] : rows;
    return row || null;
  }
  function supabaseHeaders(extra = {}) {
    return { apikey: publishableKey, Authorization: `Bearer ${publishableKey}`, Accept: "application/json", ...extra };
  }
  async function fetchPage(start, limit) {
    const url = new URL(`${endpoint}/rest/v1/reviews`);
    url.searchParams.set("select", "id,name,rating,comment,location,created_at");
    url.searchParams.set("is_approved", "eq.true");
    url.searchParams.set("order", "created_at.desc,id.desc");
    url.searchParams.set("limit", String(limit));
    url.searchParams.set("offset", String(start));
    const response = await timedFetch(url.href, { headers: supabaseHeaders({ Prefer: "count=exact" }), cache: "no-store" });
    if (!response.ok) throw new Error(response.status === 401 || response.status === 403 ? "permission_denied" : "fetch_failed");
    const data = await response.json();
    if (!Array.isArray(data)) throw new Error("invalid_response");
    return { data, total: parseTotal(response, start + data.length) };
  }
  function readFallback() {
    const reviewConfig = window.VRF_REVIEWS_CONFIG || {};
    const values = Array.isArray(reviewConfig.pageReviews) && reviewConfig.pageReviews.length
      ? reviewConfig.pageReviews
      : (Array.isArray(reviewConfig.reviews) ? reviewConfig.reviews.filter((item) => item?.published === true) : []);
    return values.map((item) => ({
      ...item,
      id: String(item?.id || `${item?.created_at || "fallback"}-${item?.name || "guest"}`),
      name: clean(item?.name), rating: Number(item?.rating), comment: clean(item?.comment || item?.quote),
      location: clean(item?.location), created_at: String(item?.created_at || item?.date || ""),
    })).filter((item) => item.name && item.comment && item.location && Number.isInteger(item.rating) && item.rating >= 1 && item.rating <= 5)
      .sort((a, b) => String(b.created_at).localeCompare(String(a.created_at)));
  }
  async function loadFirstPage() {
    clearError();
    setBusy(true);
    if (modeNote) modeNote.hidden = supabaseReady;
    try {
      if (supabaseReady) {
        const result = await fetchPage(0, pageSize);
        reviews = result.data;
        total = result.total;
        offset = reviews.length;
        try { summary = await fetchSummary(); } catch (_) { summary = null; }
      } else {
        fallbackItems = readFallback();
        reviews = fallbackItems.slice(0, pageSize);
        total = fallbackItems.length;
        offset = reviews.length;
        summary = summarizeLocal(fallbackItems);
      }
      render();
      if (formDisabled) formDisabled.hidden = formReady;
      if (config.revealFormAfterLoadMore === true && reviews.length >= total) revealForm(false);
      if (formReady) mountTurnstile();
    } catch (error) {
      showError(error.message === "permission_denied" ? "The review service could not read its public review list. Please try again later." : "We could not load the reviews just now. Please try again.");
      if (empty) empty.hidden = true;
    } finally {
      setBusy(false);
      render();
      if (formDisabled) formDisabled.hidden = formReady;
      if (formReady) mountTurnstile();
      updateSubmit();
    }
  }
  function summarizeLocal(items) {
    if (!items.length) return null;
    const counts = [5, 4, 3, 2, 1].map((n) => items.filter((item) => item.rating === n).length);
    const average = items.reduce((sum, item) => sum + Number(item.rating), 0) / items.length;
    return { total: items.length, average, five_star: counts[0], four_star: counts[1], three_star: counts[2], two_star: counts[3], one_star: counts[4] };
  }
  async function loadNextPage() {
    if (loadingMore || offset >= total) return;
    loadingMore = true;
    clearError();
    if (moreButton) moreButton.disabled = true;
    if (moreLabel) moreLabel.textContent = "Loading…";
    if (moreStatus) moreStatus.textContent = "Loading more reviews…";
    try {
      const result = supabaseReady
        ? await fetchPage(offset, pageSize)
        : { data: fallbackItems.slice(offset, offset + pageSize), total: fallbackItems.length };
      const seen = new Set(reviews.map((item) => String(item.id)));
      const fresh = result.data.filter((item) => !seen.has(String(item.id)));
      reviews = reviews.concat(fresh);
      offset += result.data.length;
      total = Math.max(offset, result.total);
      if (!result.data.length) total = offset;
      render();
      if (moreStatus) moreStatus.textContent = "";
      if (config.revealFormAfterLoadMore === true) revealForm(false);
    } catch (_) {
      if (moreStatus) moreStatus.textContent = "Could not load more reviews. Please try again.";
    } finally {
      loadingMore = false;
      if (moreButton) moreButton.disabled = false;
      if (moreLabel) moreLabel.textContent = "Load more reviews";
      render();
    }
  }
  function revealForm(focus = true) {
    formRevealed = true;
    if (formSection) formSection.hidden = false;
    if (formReady) mountTurnstile();
    if (focus) formSection?.scrollIntoView({ behavior: matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth", block: "start" });
  }

  function mountTurnstile() {
    const siteKey = typeof config.turnstileSiteKey === "string" ? config.turnstileSiteKey.trim() : "";
    if (!siteKey || !captchaHost || !formRevealed || turnstileWidget !== null || captchaLoad) return;
    captchaHost.textContent = "Loading spam protection…";
    captchaLoad = new Promise((resolve, reject) => {
      if (window.turnstile) { resolve(window.turnstile); return; }
      const script = document.createElement("script");
      script.src = "https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit";
      script.async = true;
      script.defer = true;
      script.onload = () => window.turnstile ? resolve(window.turnstile) : reject(new Error("turnstile_unavailable"));
      script.onerror = () => reject(new Error("turnstile_unavailable"));
      document.head.append(script);
    }).then((turnstile) => {
      captchaHost.replaceChildren();
      turnstileWidget = turnstile.render(captchaHost, {
        sitekey: siteKey,
        callback: (token) => { captchaToken = token; updateSubmit(); },
        "expired-callback": () => { captchaToken = ""; updateSubmit(); },
        "error-callback": () => { captchaToken = ""; setStatus("Spam protection could not be verified. Please try again.", "error"); updateSubmit(); },
        theme: document.documentElement.dataset.theme === "dark" ? "dark" : "light",
      });
      captchaLoad = null;
      updateSubmit();
    }).catch(() => {
      captchaLoad = null;
      captchaHost.textContent = "Spam protection did not load. Refresh the page or contact the studio.";
      setStatus("Spam protection is unavailable. Please try again later.", "error");
      updateSubmit();
    });
  }
  function resetTurnstile() {
    captchaToken = "";
    try { if (turnstileWidget !== null) window.turnstile?.reset(turnstileWidget); } catch (_) {}
  }
  function startCooldown(seconds) {
    const duration = Math.max(1, Math.min(Number(seconds) || 300, 86400));
    cooldownUntil = Date.now() + duration * 1000;
    clearInterval(cooldownTimer);
    if (cooldownBox) cooldownBox.hidden = false;
    const tick = () => {
      const remaining = Math.max(0, Math.ceil((cooldownUntil - Date.now()) / 1000));
      if (cooldownTime) cooldownTime.textContent = `${Math.floor(remaining / 60)}:${String(remaining % 60).padStart(2, "0")}`;
      if (remaining <= 0) {
        clearInterval(cooldownTimer);
        cooldownTimer = 0;
        cooldownUntil = 0;
        if (cooldownBox) cooldownBox.hidden = true;
        setStatus("You can post another review now.", "success");
      }
      updateSubmit();
    };
    tick();
    cooldownTimer = window.setInterval(tick, 1000);
  }
  function responseCode(body) { return body?.error?.code || body?.code || body?.error || ""; }
  async function submit(event) {
    event.preventDefault();
    if (busy) return;
    if (!formReady) {
      setStatus("Online review submission is not configured. Your review has not been sent.", "error");
      return;
    }
    if (cooldownUntil > Date.now()) {
      setStatus("Please wait for the cooldown to finish before submitting another review.", "error");
      return;
    }
    if (!validateAll()) return;
    if (!captchaToken) {
      setStatus("Please complete the spam check before submitting your review.", "error");
      captchaHost?.scrollIntoView({ behavior: "smooth", block: "center" });
      return;
    }
    busy = true;
    updateSubmit();
    if (submitLabel) submitLabel.textContent = "Sending…";
    form.setAttribute("aria-busy", "true");
    setStatus("Sending your review…");
    const controller = new AbortController();
    const timeout = window.setTimeout(() => controller.abort(), timeoutMs);
    try {
      const base = normalizeEndpoint(config.functionsUrl) || `${endpoint}/functions/v1`;
      const functionName = typeof config.submitFunction === "string" && /^[a-z0-9-]+$/i.test(config.submitFunction)
        ? config.submitFunction
        : "submit-review";
      const response = await fetch(`${base}/${functionName}`, {
        method: "POST",
        headers: { apikey: publishableKey, Authorization: `Bearer ${publishableKey}`, "Content-Type": "application/json", Accept: "application/json" },
        body: JSON.stringify({ name: inputValue("name"), location: inputValue("location"), rating: selectedRating, comment: inputValue("comment"), turnstileToken: captchaToken }),
        signal: controller.signal,
        cache: "no-store",
      });
      let body = {};
      try { body = await response.json(); } catch (_) {}
      if (response.status === 201 && body.status === "created" && body.review?.is_approved === true) {
        const review = body.review;
        reviews = [review, ...reviews.filter((item) => String(item.id) !== String(review.id))];
        total += 1;
        offset = Math.max(offset, reviews.length);
        try { summary = await fetchSummary(); } catch (_) { summary = null; }
        render();
        form.reset();
        selectedRating = 0;
        ratingGroup?.querySelectorAll("[role=radio]").forEach((radio, index) => { radio.setAttribute("aria-checked", "false"); radio.tabIndex = index === 0 ? 0 : -1; });
        paintStars(0);
        setMessage(ratingHint, "Select a rating to begin.");
        touched = new Set();
        for (const key of Object.keys(fields)) markField(key, "");
        markField("rating", "");
        updateCount();
        resetTurnstile();
        setStatus("Thank you. Your review has been published.", "success");
        startCooldown(body.cooldown_seconds || 300);
        try { localStorage.setItem("vrf-review-stats-updated", String(Date.now())); } catch (_) {}
        list?.querySelector(".review-entry")?.scrollIntoView({ behavior: "smooth", block: "center" });
      } else if (response.status === 429) {
        const retry = Number(body.retry_after || response.headers.get("retry-after") || 300);
        setStatus("You have recently submitted a review. Please try again when the cooldown ends.", "error");
        startCooldown(retry);
        resetTurnstile();
      } else if (response.status === 422) {
        const fieldErrors = body.fields || body.error?.fields || {};
        let invalid = [];
        for (const key of ["name", "location", "rating", "comment"]) {
          if (fieldErrors[key]) { invalid.push(key); markField(key, String(fieldErrors[key])); }
        }
        setStatus(invalid.length ? "Please check the highlighted fields." : "The review could not be validated. Please check your entries.", "error");
        (fields[invalid[0]] || ratingGroup)?.focus();
        resetTurnstile();
      } else {
        const code = responseCode(body);
        const message = code === "captcha_failed" ? "The spam check did not pass. Please complete it again." : code === "captcha_unavailable" ? "The spam check is temporarily unavailable. Please try again later." : code === "not_configured" ? "Review submission is temporarily unavailable." : "We could not save your review just now. Please try again later.";
        setStatus(message, "error");
        resetTurnstile();
      }
    } catch (error) {
      setStatus(error?.name === "AbortError" ? "The request timed out. Please try again." : "We could not reach the review service. Check your connection and try again.", "error");
      resetTurnstile();
    } finally {
      window.clearTimeout(timeout);
      busy = false;
      form.removeAttribute("aria-busy");
      if (submitLabel) submitLabel.textContent = "Submit review";
      updateSubmit();
    }
  }

  function bindForm() {
    for (const [name, control] of Object.entries(fields)) {
      control?.addEventListener("input", () => {
        if (name === "comment") updateCount();
        if (touched.has(name)) validateField(name, true);
        if (status && status.classList.contains("error")) setStatus("");
        updateSubmit();
      });
      control?.addEventListener("blur", () => {
        if (inputValue(name)) {
          touched.add(name);
          validateField(name, true);
        }
      });
    }
    form.addEventListener("submit", submit);
    document.getElementById("reviews-retry")?.addEventListener("click", loadFirstPage);
    moreButton?.addEventListener("click", loadNextPage);
    document.getElementById("write-first-review")?.addEventListener("click", () => revealForm(true));
    if (config.revealFormAfterLoadMore === true) {
      formSection.hidden = true;
      formRevealed = false;
    }
    if (formDisabled) formDisabled.hidden = formReady;
    if (modeNote) modeNote.hidden = supabaseReady;
  }

  buildStars();
  bindForm();
  updateCount();
  updateSubmit();
  loadFirstPage();
})();
