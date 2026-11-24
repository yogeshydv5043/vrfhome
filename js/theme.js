/* Light, dark and system theme.
   Cycles between the three modes, stores the choice under 'studio-theme' and
   follows the OS setting while in system mode. No other value is stored. */
(() => {
  "use strict";
  const key = "studio-theme";
  const modes = ["system", "light", "dark"];
  const preference = window.matchMedia("(prefers-color-scheme: dark)");
  let mode = "system";
  try {
    const saved = localStorage.getItem(key);
    if (modes.includes(saved)) mode = saved;
  } catch (_) {
    /* Private browsing may restrict storage. */
  }
  const shapes = {
    system: [
      ["rect", { x: 3, y: 4, width: 18, height: 13, rx: 1 }],
      ["path", { d: "M8 21h8m-4-4v4" }],
    ],
    light: [
      ["circle", { cx: 12, cy: 12, r: 4 }],
      [
        "path",
        {
          d: "M12 2v2m0 16v2M2 12h2m16 0h2M5 5l1.5 1.5m11 11L19 19M5 19l1.5-1.5m11-11L19 5",
        },
      ],
    ],
    dark: [["path", { d: "M20 14A8 8 0 0 1 10 4a8 8 0 1 0 10 10Z" }]],
  };
  // Swaps the toggle icon to match the mode clicking will select next.
  function drawIcon(container) {
    const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
    Object.entries({
      class: "icon",
      viewBox: "0 0 24 24",
      fill: "none",
      stroke: "currentColor",
      "stroke-width": "1.5",
      "stroke-linecap": "round",
      "stroke-linejoin": "round",
      "aria-hidden": "true",
    }).forEach(([k, v]) => svg.setAttribute(k, v));
    shapes[mode].forEach(([tag, attributes]) => {
      const node = document.createElementNS(svg.namespaceURI, tag);
      Object.entries(attributes).forEach(([k, v]) => node.setAttribute(k, v));
      svg.append(node);
    });
    container.replaceChildren(svg);
  }
  // Applies the current mode to the document and updates the button label.
  function apply() {
    const resolved =
      mode === "system" ? (preference.matches ? "dark" : "light") : mode;
    document.documentElement.dataset.theme = resolved;
    document.documentElement.dataset.themePreference = mode;
    const meta = document.querySelector('meta[name="theme-color"]');
    if (meta) meta.content = resolved === "dark" ? "#0D1727" : "#F5F3EF";
    document.querySelectorAll(".theme-toggle").forEach((button) => {
      const next = modes[(modes.indexOf(mode) + 1) % modes.length];
      button.setAttribute(
        "aria-label",
        `Theme: ${mode}${mode === "system" ? ` (${resolved})` : ""}. Switch to ${next}`,
      );
      button.title = `Theme: ${mode} · Click for ${next}`;
      const slot = button.querySelector("[data-theme-icon]");
      if (slot) drawIcon(slot);
    });
  }
  apply();
  document.addEventListener("DOMContentLoaded", () => {
    apply();
    document.querySelectorAll(".theme-toggle").forEach((button) =>
      button.addEventListener("click", () => {
        mode = modes[(modes.indexOf(mode) + 1) % modes.length];
        try {
          localStorage.setItem(key, mode);
        } catch (_) {}
        apply();
      }),
    );
  });
  preference.addEventListener("change", () => {
    if (mode === "system") apply();
  });
  window.addEventListener("storage", (event) => {
    if (event.key === key || event.key === null) {
      mode = modes.includes(event.newValue) ? event.newValue : "system";
      apply();
    }
  });
})();
