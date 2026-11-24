/* In-page section links, scroll tracking and index highlighting.
   Rewrites fragment links to clean addresses so the URL never shows #section,
   scrolls to the target allowing for the sticky header, and remembers a
   pending scroll across a page load. Also drives two highlighters: the
   services index, and the legal page document index, both of which pick the
   section whose top has passed a reading line below the header.
   No personal or form data is stored; the scroll intent is tab-scoped. */
(() => {
  "use strict";
  const root = new URL(document.baseURI);
  const key = "vrf-section-target";
  let keyboardInput = false;
  document.addEventListener("pointerdown", () => { keyboardInput = false; }, true);
  const pathname = value => value.replace(/index\.html$/, "");
  const internal = url => url.protocol === root.protocol && url.host === root.host && url.pathname.startsWith(root.pathname);
  const routeURL = route => new URL(route + (location.protocol === "file:" ? "index.html" : ""), root);
  const decode = hash => { try { return decodeURIComponent(hash.replace(/^#/, "")); } catch (_) { return ""; } };
  // Removes the fragment from the address bar without reloading or scrolling.
  function cleanAddress() {
    if (!location.hash) return;
    try { history.replaceState(history.state, "", location.pathname + location.search); } catch (_) {}
  }
  // Scrolls a section into view below the sticky header and moves focus there
  // when the visitor is navigating by keyboard.
  function scrollToSection(id, smooth = true, keyboard = false) {
    const target = document.getElementById(id);
    if (!target) return false;
    if (window.Studio) Studio.activeSection = id;
    window.dispatchEvent(new CustomEvent("studio:sectionchange", {detail:{id}}));
    const reveal = target.closest(".reveal");
    if (reveal) reveal.classList.add("is-visible");
    const hadTabindex = target.hasAttribute("tabindex");
    if (!hadTabindex) {
      target.setAttribute("tabindex", "-1");
      target.addEventListener("blur", () => target.removeAttribute("tabindex"), {once:true});
    }
    target.classList.toggle("pointer-section-focus", !keyboard);
    target.classList.toggle("keyboard-section-focus", keyboard);
    target.addEventListener("blur", () => target.classList.remove("pointer-section-focus", "keyboard-section-focus"), {once:true});
    target.focus({preventScroll:true});
    const header = document.querySelector(".site-header");
    const top = target.getBoundingClientRect().top + scrollY - (header ? header.getBoundingClientRect().height + 20 : 20);
    window.scrollTo({top:Math.max(0,top), behavior:smooth && !matchMedia("(prefers-reduced-motion: reduce)").matches ? "smooth" : "instant"});
    return true;
  }
  // Converts a fragment link into a clean URL, remembering the target id.
  function normalize(link) {
    if (!(link instanceof HTMLAnchorElement) || !link.hasAttribute("href")) return;
    let url;
    try { url = new URL(link.getAttribute("href"), document.baseURI); } catch (_) { return; }
    if (!internal(url)) return;
    if (!url.hash) {
      if (link.dataset.sectionHref && link.dataset.sectionHref !== url.href) {
        const previous = new URL(link.dataset.sectionHref);
        if (pathname(previous.pathname) === pathname(url.pathname) && previous.search === url.search) link.dataset.sectionHref = url.href;
        else { delete link.dataset.sectionTarget; delete link.dataset.sectionHref; }
      }
      return;
    }
    const id = decode(url.hash);
    if (!id) return;
    // Old project links now go directly to their real, clean story routes.
    const project = typeof PROJECTS !== "undefined" && PROJECTS.find(item => item.id === id);
    if (project?.page) {
      link.href = routeURL(project.page).href;
      delete link.dataset.sectionTarget; delete link.dataset.sectionHref;
      return;
    }
    url.hash = "";
    link.dataset.sectionTarget = id;
    link.dataset.sectionHref = url.href;
    link.href = url.href;
  }
  // Normalises every link in a node, including ones added later.
  function scan(node) {
    if (!(node instanceof Element)) return;
    if (node.matches("a[href]")) normalize(node);
    node.querySelectorAll("a[href]").forEach(normalize);
  }
  scan(document.body);
  new MutationObserver(records => {
    for (const record of records) {
      if (record.type === "attributes") normalize(record.target);
      else record.addedNodes.forEach(scan);
    }
  }).observe(document.body, {subtree:true,childList:true,attributes:true,attributeFilter:["href"]});
  document.addEventListener("click", event => {
    if (event.defaultPrevented || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
    const link = event.target.closest("a[data-section-target]");
    if (!link || link.hasAttribute("download") || (link.target && link.target !== "_self")) return;
    const url = new URL(link.href);
    if (!internal(url)) return;
    const id = link.dataset.sectionTarget;
    // A skip link always means "jump past the header of the page I am on", so
    // it counts as same-page whenever its target is here. This matters on the
    // error page: the server returns it at whatever wrong address the visitor
    // typed, so its path never matches the file it was written in, and the
    // <base href="/"> means a bare "#main" would resolve to the home page.
    // Without this the first thing a keyboard user reaches would navigate away.
    const samePage = link.classList.contains("skip-link")
      ? !!document.getElementById(id)
      : pathname(url.pathname) === pathname(location.pathname) && url.search === location.search;
    if (samePage) {
      if (!document.getElementById(id)) return;
      event.preventDefault();
      cleanAddress();
      requestAnimationFrame(() => scrollToSection(id, true, keyboardInput || event.detail === 0 || link.classList.contains("skip-link")));
    } else {
      // Tab-scoped, short-lived scroll intent only; URL and user-entered fields are not stored.
      try { sessionStorage.setItem(key, JSON.stringify({path:pathname(url.pathname),id,keyboard:keyboardInput || event.detail === 0,time:Date.now()})); } catch (_) {}
      // The anchor already has a clean href, so native navigation, history and queries still work.
    }
  });
  document.addEventListener("keydown", event => {
    if (!event.metaKey && !event.ctrlKey && !event.altKey) keyboardInput = true;
    if (["Tab", "Enter", " "].includes(event.key)) document.querySelectorAll(".pointer-section-focus").forEach(el => { el.classList.remove("pointer-section-focus"); el.classList.add("keyboard-section-focus"); });
  }, true);
  let incoming = decode(location.hash);
  cleanAddress();
  const project = incoming && typeof PROJECTS !== "undefined" && PROJECTS.find(item => item.id === incoming);
  if (project?.page) { location.replace(routeURL(project.page).href); return; }
  // Performs a scroll that was requested before the page navigated.
  function consumeIntent() {
    let id = incoming, keyboard = false;
    incoming = "";
    try {
      const raw = sessionStorage.getItem(key);
      if (raw) {
        const intent = JSON.parse(raw);
        sessionStorage.removeItem(key);
        if (!id && intent.path === pathname(location.pathname) && Date.now() - intent.time < 60000) { id = intent.id; keyboard = intent.keyboard === true; }
      }
    } catch (_) { try { sessionStorage.removeItem(key); } catch (_) {} }
    if (!id) return;
    const ready = document.fonts ? document.fonts.ready : Promise.resolve();
    ready.then(() => requestAnimationFrame(() => requestAnimationFrame(() => scrollToSection(id,false,keyboard))));
  }
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded",consumeIntent,{once:true});
  else consumeIntent();
  window.addEventListener("pageshow",event => { if(event.persisted) consumeIntent(); });
  window.addEventListener("hashchange", () => {
    const id = decode(location.hash); cleanAddress();
    const project = typeof PROJECTS !== "undefined" && PROJECTS.find(item => item.id === id);
    if (project?.page) location.replace(routeURL(project.page).href);
    else scrollToSection(id);
  });

  // Services page scroll tracking: updates active section and WhatsApp prefill on natural scroll
  function initServiceScrollTracking() {
    if (!("IntersectionObserver" in window)) return;
    const serviceSections = document.querySelectorAll("section.service-detail[id]");
    if (!serviceSections.length) return;
    const observer = new IntersectionObserver(entries => {
      const visible = entries
        .filter(entry => entry.isIntersecting)
        .sort((a, b) => b.intersectionRatio - a.intersectionRatio);
      if (visible.length) {
        const id = visible[0].target.id;
        window.Studio = window.Studio || {};
        if (window.Studio.activeSection !== id) {
          window.Studio.activeSection = id;
          window.dispatchEvent(new CustomEvent("studio:sectionchange", {detail:{id}}));
        }
      }
    }, {
      rootMargin: "-20% 0px -50% 0px",
      threshold: [0.1, 0.3, 0.6]
    });
    serviceSections.forEach(section => observer.observe(section));
  }
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", initServiceScrollTracking, {once:true});
  else initServiceScrollTracking();

  /* Legal pages: highlight the index chip for the section being read, so the
     reader can see where they are in a long document. */
  function initLegalIndexTracking() {
    const nav = document.querySelector(".legal-nav");
    if (!nav) return;
    const links = [...nav.querySelectorAll("a")];
    if (!links.length) return;

    /* The href is rewritten to a clean address elsewhere in this file, so the
       fragment is not reliable here. The index is authored in document order,
       so pair each link with the matching section by position instead. */
    const byId = new Map();
    links.forEach((link, i) => {
      const section = document.getElementById("section-" + i);
      if (section) byId.set(section.id, link);
    });
    if (!byId.size) return;

    const setCurrent = (id) => {
      links.forEach((link) => {
        const on = link === byId.get(id);
        link.classList.toggle("is-current", on);
        if (on) link.setAttribute("aria-current", "true");
        else link.removeAttribute("aria-current");
      });
    };

    const sections = [...byId.keys()]
      .map((id) => document.getElementById(id))
      .filter(Boolean);
    if (!sections.length) return;

    /* Pick the section the reader is actually on: the last one whose top has
       passed a reading line just below the sticky header. Comparing
       intersection ratios instead would favour whichever section is shortest,
       which is why the highlight used to land on the wrong entry. */
    const headerEl = document.querySelector(".site-header");
    const currentId = () => {
      const line = (headerEl ? headerEl.getBoundingClientRect().height : 0) + 24;
      const doc = document.documentElement;
      // At the very bottom the last section may never cross the line.
      if (window.scrollY + window.innerHeight >= doc.scrollHeight - 2) {
        return sections[sections.length - 1].id;
      }
      let active = sections[0].id;
      for (const section of sections) {
        if (section.getBoundingClientRect().top - line <= 0) active = section.id;
        else break;
      }
      return active;
    };

    let last = null;
    let queued = false;
    const sync = () => {
      queued = false;
      const id = currentId();
      if (id !== last) { last = id; setCurrent(id); }
    };
    const onScroll = () => {
      if (queued) return;
      queued = true;
      requestAnimationFrame(sync);
    };

    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll, { passive: true });
    sync();
  }
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", initLegalIndexTracking, {once:true});
  else initLegalIndexTracking();
})();
