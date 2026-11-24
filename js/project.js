/* Project story pages.
   Reads the project id from body[data-project-page], looks it up in PROJECTS
   and fills in the hero, facts, narrative, image sequence and the link to the
   next project. Exits quietly if the id is missing or unknown. */
(() => {
  "use strict";
  const id = document.body.dataset.projectPage;
  if (!id) return;
  const project = PROJECTS.find((p) => p.id === id);
  if (!project) return;
  const reference = project.reference !== false;
  // Writes text into an element if it exists, ignoring a missing one.
  const text = (selector, value) => {
    const node = document.querySelector(selector);
    if (node) node.textContent = value;
  };
  // Resolves an image path against the site root.
  const asset = (value) =>
    typeof value === "string" &&
    value.trim() &&
    !/^(?:javascript|data|vbscript):/i.test(value);
  // Builds a responsive <img> with width, height and the right loading mode.
  function image(src, alt, hero = false) {
    const node = document.createElement("img");
    node.src = src;
    node.alt = alt;
    node.width = 1800;
    node.height = 1200;
    node.decoding = "async";
    if (hero) node.fetchPriority = "high";
    else node.loading = "lazy";
    if (src.endsWith("-1800.webp")) {
      node.srcset = `${src.replace("-1800.webp", "-480.webp")} 480w, ${src.replace("-1800.webp", "-960.webp")} 960w, ${src} 1800w`;
      node.sizes = hero ? "100vw" : "(max-width: 767px) 100vw, 60vw";
    }
    node.addEventListener("error", () => node.classList.add("image-error"));
    return node;
  }
  const hero = document.querySelector(".story-hero > img");
  if (hero && asset(project.images[0]))
    hero.replaceWith(image(project.images[0], project.alt, true));
  text("[data-story-title]", project.title);
  text(
    ".story-category",
    `${project.category} / ${reference ? "REFERENCE STUDY" : "STUDIO PROJECT"}`,
  );
  text(".story-subtitle", project.description);
  text('[data-project-fact="category"]', project.category);
  text(
    '[data-project-fact="location"]',
    project.location || "Gurugram, Haryana",
  );
  text(
    '[data-project-fact="yearArea"]',
    `${project.year || "[YEAR]"} / ${project.area || "[AREA]"}`,
  );
  text('[data-project-fact="style"]', project.style || "[DESIGN STYLE]");
  text("[data-story-brief]", project.brief || project.description);
  text("[data-story-concept]", project.concept || project.description);
  const list = document.querySelector("[data-story-considerations]");
  if (list)
    list.replaceChildren(
      ...(project.considerations || []).map((value) => {
        const li = document.createElement("li");
        li.textContent = value;
        return li;
      }),
    );
  const materials = document.querySelector("[data-material-palette]");
  if (materials)
    materials.replaceChildren(
      ...(project.materials || []).map((material) => {
        const node = document.createElement("div");
        node.className = "material-item";
        const swatch = document.createElement("span");
        swatch.className = "material-swatch";
        if (/^#[0-9a-f]{6}$/i.test(material.color))
          swatch.style.backgroundColor = material.color;
        const label = document.createElement("span");
        label.textContent = material.name;
        node.append(swatch, label);
        return node;
      }),
    );
  if (!reference)
    text(
      ".story-gallery-section .section-heading > p",
      "Authorized project photography. Shared with permission.",
    );
  if (!reference)
    text(
      ".story-material-grid > div > p:last-child",
      "Material direction for this project. Confirm specific product and finish details with the studio.",
    );
  const gallery = document.querySelector("[data-story-gallery]");
  const photos = project.gallery?.length
    ? project.gallery
    : project.images.map((src) => ({ src, alt: project.alt, caption: "" }));
  if (gallery)
    gallery.replaceChildren(
      ...photos
        .filter((item) => asset(item.src))
        .map((item) => {
          const figure = document.createElement("figure"),
            caption = document.createElement("figcaption");
          caption.textContent = item.caption || "";
          figure.append(image(item.src, item.alt || project.alt), caption);
          return figure;
        }),
    );
  const comparison = project.comparison;
  const widget = document.querySelector(".comparison-widget"),
    empty = document.querySelector(".comparison-empty");
  if (
    comparison?.verified === true &&
    asset(comparison.before) &&
    asset(comparison.after) &&
    comparison.before !== comparison.after
  ) {
    widget.hidden = false;
    empty.hidden = true;
    const before = widget.querySelector(".compare-before"),
      after = widget.querySelector(".compare-after");
    before.src = comparison.before;
    before.alt = comparison.beforeAlt || `Before renovation: ${project.title}`;
    after.src = comparison.after;
    after.alt = comparison.afterAlt || `After renovation: ${project.title}`;
    // Handles an image that will not load without breaking the sequence.
    const fail = () => {
      widget.hidden = true;
      empty.hidden = false;
      empty.querySelector("p").textContent =
        "The comparison photographs could not be loaded. Please try again later or contact the studio for project details.";
    };
    before.addEventListener("error", fail);
    after.addEventListener("error", fail);
    const stage = widget.querySelector(".comparison-stage"),
      range = widget.querySelector(".compare-range");
    // Keeps the sticky caption in step with the image currently in view.
    function update(value) {
      const split = Math.max(0, Math.min(100, Number(value)));
      range.value = String(split);
      stage.style.setProperty("--split", split + "%");
      range.setAttribute(
        "aria-valuetext",
        `${split}% before, ${100 - split}% after`,
      );
      widget
        .querySelectorAll("[data-compare]")
        .forEach((button) =>
          button.setAttribute(
            "aria-pressed",
            String(Number(button.dataset.compare) === split),
          ),
        );
    }
    range.addEventListener("input", () => update(range.value));
    widget
      .querySelectorAll("[data-compare]")
      .forEach((button) =>
        button.addEventListener("click", () => update(button.dataset.compare)),
      );
    text(
      ".compare-caption",
      comparison.caption ||
        "Verified before-and-after photography supplied by the studio.",
    );
    update(50);
  }
  const index = PROJECTS.indexOf(project);
  const next = PROJECTS[(index + 1) % PROJECTS.length];
  const link = document.querySelector(".next-project-link");
  if (link && next) {
    link.href = next.page || "projects/";
    link.firstChild.textContent = next.title + " ";
  }
  const similar = document.querySelector(".final-cta .cta-actions .button");
  if (similar) {
    similar.href = "contact-us/?reference=" + encodeURIComponent(project.id);
    similar.firstChild.textContent = "Discuss a Similar Project ";
  }
  Studio.track?.("project_story_view", { project: id });
})();
