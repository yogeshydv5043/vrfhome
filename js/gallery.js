/* Projects grid and lightbox.
   Category filtering, the result count, and the full-screen viewer with
   keyboard and swipe navigation plus a share action. */
(() => {
  "use strict";
  const grid = document.querySelector(".gallery-grid");
  const dialog = document.getElementById("project-lightbox");
  if (!grid && !dialog) return;
  let visibleIds = Array.from(document.querySelectorAll("[data-project]")).map(
    (el) => el.dataset.project,
  );
  let index = 0,
    opener = null;
  // Looks a project up by its id.
  const byId = (id) => PROJECTS.find((project) => project.id === id);
  // Applies a category filter, updates the count and the pressed state.
  function filter(category) {
    if (!grid) return;
    visibleIds = [];
    grid.querySelectorAll(".project-card").forEach((card) => {
      const show = category === "All" || card.dataset.category === category;
      card.hidden = !show;
      card.classList.toggle("is-hidden", !show);
      card.style.setProperty("display", show ? "flex" : "none", "important");
      if (show)
        visibleIds.push(card.querySelector("[data-project]").dataset.project);
    });
    grid.classList.toggle("filtered", category !== "All");
    document.querySelectorAll("[data-filter]").forEach((button) => {
      const active = button.dataset.filter === category;
      button.classList.toggle("active", active);
      button.setAttribute("aria-pressed", String(active));
    });
    const count = document.getElementById("gallery-count");
    if (count)
      count.textContent = `${visibleIds.length} ${visibleIds.length === 1 ? "space" : "spaces"}`;
    const empty = document.getElementById("gallery-empty");
    if (empty) {
      empty.hidden = visibleIds.length > 0;
      empty.style.setProperty("display", visibleIds.length > 0 ? "none" : "block", "important");
    }
    if (
      typeof grid.animate === "function" &&
      !window.matchMedia("(prefers-reduced-motion: reduce)").matches
    )
      grid.animate(
        [
          { opacity: 0.4, transform: "translateY(8px)" },
          { opacity: 1, transform: "translateY(0)" },
        ],
        { duration: 250, easing: "ease-out" },
      );
  }
  document
    .querySelectorAll("[data-filter]")
    .forEach((button) =>
      button.addEventListener("click", () => filter(button.dataset.filter)),
    );
  document
    .getElementById("gallery-reset")
    ?.addEventListener("click", () => filter("All"));
  if (grid) filter("All");
  if (!dialog) return;
  const image = document.getElementById("lightbox-image");
  const shareLinks = dialog.querySelectorAll("[data-share]");
  // Shares a project via the Web Share API, falling back to copying the link.
  function share(project) {
    const hosted = ["http:", "https:"].includes(location.protocol);
    const url = hosted
      ? new URL(project.page || "projects/", document.baseURI).href
      : "";
    const encoded = encodeURIComponent(url),
      title = encodeURIComponent(`${project.title} — interior inspiration`);
    const imageUrl = hosted
      ? encodeURIComponent(new URL(project.images[0], document.baseURI).href)
      : "";
    const links = {
      facebook: `https://www.facebook.com/sharer/sharer.php?u=${encoded}`,
      whatsapp: `https://wa.me/?text=${title}%20${encoded}`,
      pinterest: `https://pinterest.com/pin/create/button/?url=${encoded}&media=${imageUrl}&description=${title}`,
      linkedin: `https://www.linkedin.com/sharing/share-offsite/?url=${encoded}`,
    };
    shareLinks.forEach((link) => {
      link.href = hosted ? links[link.dataset.share] : "#";
      link.dataset.available = String(hosted);
      link.title = hosted
        ? `Share on ${link.dataset.share}`
        : "Sharing is available after the site is hosted.";
    });
  }
  // Draws the current lightbox slide and its details.
  function render() {
    const project = byId(visibleIds[index]);
    if (!project) return;
    image.classList.remove("image-error");
    image.src = project.images[0];
    image.alt = project.alt;
    document.getElementById("lightbox-title").textContent = project.title;
    document.getElementById("lightbox-category").textContent =
      `${project.category} / ${project.reference === false ? "STUDIO PROJECT" : "REFERENCE CONCEPT"}`;
    document.getElementById("lightbox-description").textContent =
      project.description;
    document.getElementById("lightbox-style").textContent =
      project.style || "—";
    const rows = dialog.querySelectorAll("dd");
    if (rows[1]) rows[1].textContent = project.location || "Gurugram, Haryana";
    if (rows[2])
      rows[2].textContent =
        project.year && project.area
          ? `${project.year} / ${project.area}`
          : project.year || project.area || "—";
    document.getElementById("lightbox-count").textContent =
      `${String(index + 1).padStart(2, "0")} / ${String(visibleIds.length).padStart(2, "0")}`;
    dialog
      .querySelectorAll(".lightbox-prev,.lightbox-next")
      .forEach((button) => (button.disabled = visibleIds.length < 2));
    const storyLink = dialog.querySelector(".lightbox-story-link");
    if (storyLink) storyLink.href = project.page || "projects/";
    const disclosure = dialog.querySelector(".lightbox-details .small-note");
    if (disclosure)
      disclosure.textContent =
        project.reference === false
          ? "Studio project. Specifications and scope are project-specific."
          : "Inspiration imagery; not a completed studio commission. Titles and descriptions are illustrative concepts.";
    share(project);
  }
  // Opens the lightbox on a project and remembers what to focus on close.
  function open(id, element) {
    if (!byId(id)) return;
    if (!visibleIds.includes(id)) {
      if (grid) filter("All");
      else visibleIds = PROJECTS.map((p) => p.id);
    }
    index = visibleIds.indexOf(id);
    opener = element || document.activeElement;
    render();
    Studio.track?.("project_open", { project: id });
    if (!dialog.open) dialog.showModal();
    Studio.lockScroll();
    document.getElementById("lightbox-close").focus();
  }
  // Steps to the previous or next project, wrapping at either end.
  function move(delta) {
    if (!visibleIds.length) return;
    index = (index + delta + visibleIds.length) % visibleIds.length;
    render();
  }
  document
    .querySelectorAll("[data-project]")
    .forEach((button) =>
      button.addEventListener("click", () =>
        open(button.dataset.project, button),
      ),
    );
  document
    .getElementById("lightbox-close")
    .addEventListener("click", () => dialog.close());
  dialog
    .querySelector(".lightbox-prev")
    .addEventListener("click", () => move(-1));
  dialog
    .querySelector(".lightbox-next")
    .addEventListener("click", () => move(1));
  dialog.addEventListener("keydown", (e) => {
    if (e.key === "ArrowLeft" || e.key === "ArrowRight") {
      e.preventDefault();
      move(e.key === "ArrowLeft" ? -1 : 1);
    }
  });
  dialog.addEventListener("cancel", (e) => {
    e.preventDefault();
    dialog.close();
  });
  dialog.addEventListener("click", (e) => {
    if (e.target === dialog) dialog.close();
  });
  dialog.addEventListener("close", () => {
    Studio.lockScroll();
    if (opener?.isConnected) opener.focus();
  });
  let startX = 0,
    startY = 0;
  const visual = dialog.querySelector(".lightbox-visual");
  visual.addEventListener(
    "touchstart",
    (e) => {
      startX = e.changedTouches[0].clientX;
      startY = e.changedTouches[0].clientY;
    },
    { passive: true },
  );
  visual.addEventListener(
    "touchend",
    (e) => {
      const x = e.changedTouches[0].clientX - startX,
        y = e.changedTouches[0].clientY - startY;
      if (Math.abs(x) > 50 && Math.abs(x) > Math.abs(y)) move(x < 0 ? 1 : -1);
    },
    { passive: true },
  );
  shareLinks.forEach((link) =>
    link.addEventListener("click", (e) => {
      if (link.dataset.available !== "true") {
        e.preventDefault();
        let note = dialog.querySelector(".share-note");
        if (!note) {
          note = document.createElement("p");
          note.className = "small-note share-note";
          note.setAttribute("role", "status");
          dialog.querySelector(".share-row").after(note);
        }
        note.textContent =
          "Project sharing is available after the site is hosted. Local file paths are never shared.";
      }
    }),
  );
  // Legacy project fragment URLs are handled by section-navigation.js.
})();
