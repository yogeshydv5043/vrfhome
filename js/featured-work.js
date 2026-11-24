/* Home page: the "FROM OUR OWN PROJECTS" strip.

   Renders six items chosen in js/featured-work-config.js by looking their ids
   up in GALLERY_MEDIA (js/media-data.js). Nothing about the photographs is
   duplicated here — titles, alt text and captions come from the single list
   the Gallery page also reads, so the two can never drift apart.

   The section is removed from the document entirely when it is switched off
   or has nothing valid to show, rather than being left as an empty heading.
*/
(function () {
  "use strict";

  /* Reads the config defensively: a missing or malformed file must not take
     the rest of the Home page down with it. */
  function readConfig() {
    var c = typeof window.VRF_FEATURED_WORK === "object" && window.VRF_FEATURED_WORK;
    if (!c || c.enabled === false) return null;
    if (!Array.isArray(c.items) || !c.items.length) return null;
    return c;
  }

  /* GALLERY_MEDIA is declared with `const` at the top level of media-data.js,
     so it is not a property of window. It has to be read by name, inside a
     try, because referencing an undeclared name throws. */
  function readMedia() {
    try {
      return typeof GALLERY_MEDIA !== "undefined" && Array.isArray(GALLERY_MEDIA)
        ? GALLERY_MEDIA
        : null;
    } catch (e) {
      return null;
    }
  }

  function el(tag, className, text) {
    var n = document.createElement(tag);
    if (className) n.className = className;
    if (text != null) n.textContent = text;
    return n;
  }

  function build() {
    var host = document.getElementById("featured-work");
    if (!host) return;

    var config = readConfig();
    var media = readMedia();
    if (!config || !media) {
      host.remove();
      return;
    }

    /* Resolve ids to entries, keeping the author's order and dropping
       anything that no longer exists. A typo should cost one card, not the
       whole section. */
    var chosen = [];
    config.items.slice(0, 6).forEach(function (id) {
      var found = null;
      for (var i = 0; i < media.length; i++) {
        if (media[i] && media[i].id === id) { found = media[i]; break; }
      }
      if (found) chosen.push(found);
      else if (window.console && console.warn) {
        console.warn('featured-work: no gallery item with id "' + id + '" — skipped.');
      }
    });

    if (!chosen.length) {
      host.remove();
      return;
    }

    /* ---------------------------------------------------------- heading */
    var wrap = el("div", "wrap");
    var head = el("div", "section-heading");
    var headText = document.createElement("div");
    if (config.eyebrow) headText.append(el("p", "eyebrow", config.eyebrow));
    if (config.heading) {
      var h2 = document.createElement("h2");
      /* Only <em> is allowed through, matching the other home headings. */
      h2.innerHTML = String(config.heading).replace(/<(?!\/?em>)[^>]*>/g, "");
      headText.append(h2);
    }
    head.append(headText);

    if (config.linkHref && config.linkLabel) {
      var link = document.createElement("a");
      link.className = "text-link";
      link.href = config.linkHref;
      link.append(document.createTextNode(config.linkLabel));
      link.insertAdjacentHTML(
        "beforeend",
        '<svg aria-hidden="true" class="icon" fill="none" stroke="currentColor" ' +
          'stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" ' +
          'viewBox="0 0 24 24"><path d="M4 12h16m-6-6 6 6-6 6"></path></svg>'
      );
      head.append(link);
    }
    wrap.append(head);
    if (config.intro) wrap.append(el("p", "featured-work-note", config.intro));

    /* ------------------------------------------------------------ cards */
    var grid = el("div", "featured-work-grid");
    chosen.forEach(function (item) {
      var card = el("article", "featured-work-card");

      var figure = el("figure", "featured-work-figure");
      var img = document.createElement("img");
      /* A video has no still of its own; its poster frame is the thumbnail. */
      img.src = item.type === "video" ? item.poster : item.src;
      img.alt = item.alt || item.title || "";
      /* setAttribute, not the property: the property form is silently
         dropped by engines that do not implement lazy loading, and the
         attribute is what the HTML validator and the audit both read. */
      img.setAttribute("loading", "lazy");
      img.setAttribute("decoding", "async");
      img.setAttribute("draggable", "false");
      img.setAttribute("width", "800");
      img.setAttribute("height", "600");
      figure.append(img);
      if (item.type === "video") figure.append(el("span", "featured-work-kind", "Film"));
      card.append(figure);

      card.append(el("h3", "featured-work-title", item.title || ""));
      if (item.caption) card.append(el("p", "featured-work-caption", item.caption));
      grid.append(card);
    });

    wrap.append(grid);
    host.replaceChildren(wrap);
    host.hidden = false;
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", build);
  } else {
    build();
  }
})();
