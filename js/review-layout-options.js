/* Populate each concept with the same marked placeholder reviews and wire the rail controls. */
(() => {
  "use strict";
  const template = document.getElementById("review-card-samples");
  if (!template) return;
  document.querySelectorAll("[data-sample-grid]").forEach((grid) => {
    grid.replaceChildren(template.content.cloneNode(true));
  });
  document.querySelectorAll(".rail-controls").forEach((controls) => {
    const rail = controls.nextElementSibling;
    if (!rail) return;
    controls.querySelector("[data-rail-prev]")?.addEventListener("click", () => {
      rail.scrollBy({ left: -rail.clientWidth * 0.8, behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth" });
    });
    controls.querySelector("[data-rail-next]")?.addEventListener("click", () => {
      rail.scrollBy({ left: rail.clientWidth * 0.8, behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth" });
    });
  });
})();
