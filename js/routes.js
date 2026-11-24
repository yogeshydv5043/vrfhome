/* Folder URLs on hosted sites; direct index.html links when opened from disk.
   The relative <base> in each document keeps shared assets rooted at the site. */
(() => {
  "use strict";
  if (location.protocol !== "file:") return;
  document.addEventListener("DOMContentLoaded", () => {
    const root = new URL(document.baseURI);
    const routes = new Set(Object.keys(PAGE_META));
    // Rewrites a folder URL to its index.html when opened from disk.
    function normalize(link) {
      if (!(link instanceof HTMLAnchorElement) || !link.hasAttribute("href")) return;
      let url;
      try { url = new URL(link.getAttribute("href"), root); } catch (_) { return; }
      if (url.protocol !== "file:" || !url.pathname.startsWith(root.pathname)) return;
      let path = url.pathname.slice(root.pathname.length);
      if (path.endsWith("index.html")) path = path.slice(0, -10);
      if (!routes.has(path)) return;
      const destination = new URL(path + "index.html", root);
      destination.search = url.search;
      destination.hash = url.hash;
      if (link.getAttribute("href") !== destination.href) link.setAttribute("href", destination.href);
    }
    // Normalises every link within a node, including ones added later.
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
    }).observe(document.body, { subtree: true, childList: true, attributes: true, attributeFilter: ["href"] });
  });
})();
