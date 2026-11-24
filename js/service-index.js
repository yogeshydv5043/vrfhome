/* Services page index highlighting.
   Marks the chip for the section currently being read, using a reading line
   just below the sticky header, and pins the choice briefly after a click so
   the highlight does not flicker mid-scroll.
   Does not intercept links or change URL, history or focus. */
(() => {
  "use strict";
  const nav = document.querySelector("[data-service-jump]");
  const details = document.querySelector("[data-service-details]");
  if (!nav || !details) return;
  let entries = [], current = "", pinned = "", timer = 0, frame = 0;
  // The section id a chip points at, whether or not the href still has a hash.
  function targetId(link) {
    if (link.dataset.sectionTarget) return link.dataset.sectionTarget;
    try { return decodeURIComponent(new URL(link.href, document.baseURI).hash.slice(1)); }
    catch (_) { return ""; }
  }
  // Marks one chip as current and clears the rest.
  function mark(id) {
    current = id;
    entries.forEach(({link, section}) => {
      if (section.id === id) link.setAttribute("aria-current", "location");
      else link.removeAttribute("aria-current");
    });
  }
  // The reading line: just below the sticky header, where 'current' begins.
  function line() {
    const header = document.querySelector(".site-header");
    return (header ? Math.max(0, header.getBoundingClientRect().bottom) : 0) + 24;
  }
  // Picks the section crossing the reading line and marks its chip.
  function update() {
    frame = 0;
    if (!entries.length) return;
    const readingLine = line();
    if (pinned) {
      const target = entries.find(entry => entry.section.id === pinned);
      const top = target ? target.section.getBoundingClientRect().top : Infinity;
      if (top <= readingLine && top >= readingLine - 8) {
        pinned = "";
        clearTimeout(timer);
      } else return;
    }
    let active = entries[0].section.id;
    for (const {section} of entries) {
      if (section.getBoundingClientRect().top <= readingLine) active = section.id;
      else break;
    }
    if (active !== current) mark(active);
  }
  // Coalesces scroll events into one update per frame.
  function schedule() {
    if (!frame) frame = requestAnimationFrame(update);
  }
  // Drops the pin set by a click once the scroll has settled.
  function release() {
    pinned = "";
    clearTimeout(timer);
    schedule();
  }
  // Pairs each chip with its section, re-running if sections arrive later.
  function collect() {
    entries = Array.from(nav.querySelectorAll("a[href]")).map(link => {
      const section = document.getElementById(targetId(link));
      return section && details.contains(section) ? {link, section} : null;
    }).filter(Boolean);
    // Reapply state if dynamic content replaced the links.
    mark(entries.some(entry => entry.section.id === current) ? current : (entries[0]?.section.id || ""));
    schedule();
  }
  // The existing helper dispatches this before clean-URL section scrolling.
  // Hold the clicked highlight while smooth scrolling crosses intermediate sections.
  window.addEventListener("studio:sectionchange", event => {
    const id = event.detail?.id;
    if (!entries.some(entry => entry.section.id === id)) return;
    pinned = id;
    mark(id);
    clearTimeout(timer);
    timer = setTimeout(release, 2200);
    schedule();
  });
  window.addEventListener("scroll", schedule, {passive:true});
  window.addEventListener("scrollend", release, {passive:true});
  window.addEventListener("resize", schedule, {passive:true});
  window.addEventListener("pageshow", schedule);
  window.addEventListener("wheel", release, {passive:true});
  window.addEventListener("touchmove", release, {passive:true});
  document.addEventListener("keydown", event => {
    if (["ArrowUp","ArrowDown","PageUp","PageDown","Home","End"," "].includes(event.key) &&
        !event.target.closest("input,textarea,select,[contenteditable]")) release();
  });
  new MutationObserver(collect).observe(nav, {childList:true});
  new MutationObserver(collect).observe(details, {childList:true,subtree:true,attributes:true,attributeFilter:["id"]});
  if (document.fonts) document.fonts.ready.then(schedule);
  collect();
})();
