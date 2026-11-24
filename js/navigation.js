/* Header and mobile menu.
   Adds .scrolled to the header once the page moves, and opens and closes the
   mobile drawer with focus trapping and Escape handling. */
(() => {
  "use strict";
  const header = document.querySelector(".site-header");
  const menu = document.getElementById("mobile-menu");
  const trigger = document.querySelector(".menu-button");
  let ticking = false;
  // Adds .scrolled to the header once the page has moved past the threshold.
  const scrollState = () => {
    if (header) header.classList.toggle("scrolled", window.scrollY > 15);
    ticking = false;
  };
  window.addEventListener(
    "scroll",
    () => {
      if (!ticking) {
        requestAnimationFrame(scrollState);
        ticking = true;
      }
    },
    { passive: true },
  );
  scrollState();
  if (!menu || !trigger) return;
  // Safari before 15.4 has no <dialog>: showModal and close simply are not
  // there, so the old code threw on the first tap of the menu button and the
  // drawer never opened. Setting and clearing the open attribute by hand does
  // the same job on those browsers, and the stylesheet places the drawer.
  // Where dialogs are supported nothing changes - the real modal is still
  // used, with its top layer, backdrop, focus trap and Escape handling.
  const hasDialog = typeof menu.showModal === "function";
  // Restores the page after the drawer has gone, whichever way it closed.
  const afterClose = () => {
    trigger.setAttribute("aria-expanded", "false");
    Studio.lockScroll();
    trigger.focus();
  };
  // Closes the mobile drawer and returns focus to the button that opened it.
  const close = () => {
    if (hasDialog) {
      if (menu.open) menu.close();
    } else if (menu.hasAttribute("open")) {
      menu.removeAttribute("open");
      afterClose();
    }
  };
  trigger.addEventListener("click", () => {
    if (hasDialog) menu.showModal();
    else menu.setAttribute("open", "");
    trigger.setAttribute("aria-expanded", "true");
    Studio.lockScroll();
    menu.querySelector(".menu-close").focus();
  });
  // The cancel event is part of <dialog>, so Escape needs wiring up by hand
  // on the browsers that do not have it.
  if (!hasDialog)
    document.addEventListener("keydown", (e) => {
      if (e.key === "Escape" && menu.hasAttribute("open")) close();
    });
  menu.querySelector(".menu-close").addEventListener("click", close);
  menu.addEventListener("click", (e) => {
    const rect = menu.getBoundingClientRect();
    if (
      e.target === menu &&
      (e.clientX < rect.left ||
        e.clientX > rect.right ||
        e.clientY < rect.top ||
        e.clientY > rect.bottom)
    )
      close();
    if (e.target.closest("a")) close();
  });
  menu.addEventListener("close", afterClose);
  menu.addEventListener("cancel", (e) => {
    e.preventDefault();
    close();
  });
  window.matchMedia("(min-width: 1024px)").addEventListener("change", (e) => {
    if (e.matches) close();
  });
})();
