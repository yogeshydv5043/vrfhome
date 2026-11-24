/* Site-wide browser chrome colour; retain the existing shared theme switch. */
(() => {
  "use strict";
  const root = document.documentElement;
  if (root.dataset.siteTheme !== "ivory") return;
  // Keeps the browser chrome colour in step with the active theme.
  const sync = () => {
    const meta = document.querySelector('meta[name="theme-color"]');
    if (meta) meta.content = root.dataset.theme === "dark" ? "#211C17" : "#F6F1E8";
  };
  sync();
  new MutationObserver(sync).observe(root,{attributes:true,attributeFilter:["data-theme"]});
})();
