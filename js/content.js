/* Injects shared content into every page.
   Reads SITE_CONFIG and PAGE_META and fills in contact details, footer
   columns, service lists, meta tags, Open Graph tags and the JSON-LD block.
   Runs on every page, so anything appearing in more than one place belongs
   here rather than in the markup. */
(() => {
  "use strict";
  const config = SITE_CONFIG;
  // True when a config value is real rather than a leftover placeholder.
  const configured = (value) =>
    typeof value === "string" && !!value.trim() && !/\[|YOUR_/.test(value);
  // Accepts only local asset paths, rejecting anything remote.
  const safeAsset = (value) =>
    typeof value === "string" &&
    !/^(?:javascript|data|vbscript):/i.test(value) &&
    !/[<>]/.test(value);
  const address = Object.values(config.address).filter(Boolean).join(", ");
  const hours = config.businessHours.summary || `Monday–Friday: ${config.businessHours.weekdays} · ${config.businessHours.weekend}`;
  const replacements = {
    "[STUDIO NAME]": config.brandName,
    "[DESIGNER NAME]": config.designerName,
    "[DESIGNER ROLE]": config.designerRole,
    "[FOUNDER / PRINCIPAL DESIGNER]": config.designerRole,
    "[PHONE NUMBER]": config.phone,
    "[EMAIL ADDRESS]": config.email,
    "[BUSINESS LOCATION]": address,
    "[BUSINESS ADDRESS]": address,
    "[LEGAL BUSINESS NAME]": config.legalName,
    "[PRIVACY EMAIL]": config.email,
    "[LEGAL CONTACT EMAIL]": config.email,
    "[EFFECTIVE DATE]": config.effectiveDate,
    "[BUSINESS JURISDICTION]": config.jurisdiction,
  };
  const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
  const texts = [];
  while (walker.nextNode())
    if (
      !["SCRIPT", "STYLE", "TEXTAREA"].includes(
        walker.currentNode.parentElement?.tagName,
      )
    )
      texts.push(walker.currentNode);
  texts.forEach((node) => {
    let value = node.textContent;
    Object.entries(replacements).forEach(([key, replacement]) => {
      const pattern = key
        .replace(/[.*+?^${}()|[\]\\]/g, "\\$&")
        .split(" ")
        .join("\\s+");
      value = value.replace(new RegExp(pattern, "g"), () => replacement);
    });
    if (value !== node.textContent) node.textContent = value;
  });
  const bindings = {
    brand: config.brandName,
    "site-credit": config.siteCredit || "RITPLPRO",
    designer: config.designerName,
    role: config.designerRole,
    biography: config.designerBiography,
    experience: config.experience,
    address,
    hours,
    weekdays: config.businessHours.weekdays,
    weekend: config.businessHours.weekend,
  };
  Object.entries(bindings).forEach(([key, value]) =>
    document.querySelectorAll(`[data-${key}]`).forEach((el) => {
      el.textContent = value;
    }),
  );
  // Swaps the logo for the light or dark variant to match the theme.
  function updateBrandLogos() {
    const light = document.documentElement.dataset.theme !== "dark";
    const source = light && configured(config.logoLight) ? config.logoLight : config.logo;
    document.querySelectorAll("a.vrf-brand").forEach((link) => {
      link.setAttribute("aria-label", `${config.brandName} home`);
      const logo = link.querySelector(".brand-logo");
      if (logo && configured(source) && safeAsset(source) && logo.getAttribute("src") !== source)
        logo.src = source;
    });
  }
  updateBrandLogos();
  new MutationObserver(updateBrandLogos).observe(document.documentElement, {
    attributes: true,
    attributeFilter: ["data-theme"],
  });
  if (
    configured(config.designerPortrait) &&
    safeAsset(config.designerPortrait)
  ) {
    document.querySelectorAll(".portrait-placeholder").forEach((el) => {
      const image = document.createElement("img");
      image.src = config.designerPortrait;
      /* Prefer the written description; fall back to name and role so the
         image is never left without an accessible name. */
      image.alt = configured(config.designerPortraitAlt)
        ? config.designerPortraitAlt
        : `${config.designerName}, ${config.designerRole}`;
      image.loading = "lazy";
      image.decoding = "async";
      image.width = 800;
      image.height = 1000;
      el.replaceChildren(image);
      /* Optional caption across the foot of the frame. It repeats information
         already in the alt text, so it is hidden from screen readers to avoid
         announcing the same thing twice. */
      if (configured(config.designerPortraitCaption)) {
        const caption = document.createElement("span");
        caption.className = "portrait-caption";
        caption.textContent = config.designerPortraitCaption;
        caption.setAttribute("aria-hidden", "true");
        el.append(caption);
      }
      el.classList.add("portrait-configured");
      el.removeAttribute("role");
      el.removeAttribute("aria-label");
    });
  }
  document.querySelectorAll(".site-credit-link").forEach((link) => {
    try {
      const url = new URL(config.siteCreditUrl);
      if (url.protocol === "https:" || url.protocol === "http:") link.href = url.href;
    } catch (_) {}
  });
  const currentPage = document.body.dataset.route || "";
  document.querySelectorAll(".desktop-nav, #mobile-menu nav").forEach((nav) => {
    nav.replaceChildren(
      ...NAVIGATION.map((item) => {
        const link = document.createElement("a");
        link.href = item.href;
        link.textContent = item.label;
        if (item.href === currentPage || (item.href === "projects/" && currentPage.startsWith("projects/")))
          link.setAttribute("aria-current", "page");
        return link;
      }),
    );
  });
  document.querySelectorAll("[data-navigation-list]").forEach((container) => {
    const heading = container.querySelector("h3")?.cloneNode(true);
    container.replaceChildren();
    if (heading) container.append(heading);
    NAVIGATION.forEach((item) => {
      if (item.href === "contact-us/") {
        const reviewsLink = document.createElement("a");
        reviewsLink.href = "reviews/";
        reviewsLink.textContent = "Reviews";
        if (currentPage === "reviews/") reviewsLink.setAttribute("aria-current", "page");
        container.append(reviewsLink);
      }
      const a = document.createElement("a");
      a.href = item.href;
      a.textContent = item.label;
      container.append(a);
    });
  });
  // Writes text into every match within a scope, if the value is usable.
  function setText(scope, selector, text) {
    const el = scope.querySelector(selector);
    if (el) el.textContent = text;
  }
  // Points an image at a source, hiding it if the source is unusable.
  function setImage(image, src, alt) {
    if (!image || !safeAsset(src)) return;
    if (src.endsWith("-1800.webp"))
      image.srcset = `${src.replace("-1800.webp", "-480.webp")} 480w, ${src.replace("-1800.webp", "-960.webp")} 960w, ${src} 1800w`;
    else image.removeAttribute("srcset");
    image.alt = alt;
    image.src = src.replace("-1800.webp", "-960.webp");
  }
  // Replaces a list's children with freshly built items.
  function list(ul, items) {
    if (!ul) return;
    const icon = ul.querySelector("svg")?.cloneNode(true);
    ul.replaceChildren(
      ...items.map((text) => {
        const li = document.createElement("li");
        if (icon) li.append(icon.cloneNode(true));
        li.append(document.createTextNode(text));
        return li;
      }),
    );
  }
  const overview = document.querySelector("[data-service-overview]");
  if (overview) {
    const template = overview
      .querySelector(".service-preview")
      ?.cloneNode(true);
    if (template)
      overview.replaceChildren(
        ...SERVICES.map((service) => {
          const node = template.cloneNode(true);
          node.dataset.service = service.id;
          node.querySelector("a").href = `service/#${service.id}`;
          setText(node, "h3", service.title);
          setText(node, ".service-kicker", service.category);
          setText(node, "p", service.shortDescription);
          setImage(node.querySelector("img"), service.image, service.alt);
          return node;
        }),
      );
  }
  const details = document.querySelector("[data-service-details]");
  if (details) {
    const template = details.querySelector(".service-detail")?.cloneNode(true);
    if (template)
      details.replaceChildren(
        ...SERVICES.map((service, i) => {
          const node = template.cloneNode(true);
          node.id = service.id;
          node.dataset.service = service.id;
          setText(
            node,
            ".service-category",
            `${String(i + 1).padStart(2, "0")} / ${service.category.toUpperCase()}`,
          );
          setText(node, "h2", service.title);
          setText(node, ".service-short", service.shortDescription);
          setText(node, ".service-description", service.description);
          setText(node, ".suitable span", service.suitableFor);
          setText(
            node,
            ".service-image-caption",
            `REFERENCE IMAGERY / ${service.category.toUpperCase()}`,
          );
          setImage(node.querySelector("img"), service.image, service.alt);
          list(node.querySelector(".service-offers"), service.offers);
          list(node.querySelector(".benefits"), service.benefits);
          const link = node.querySelector(".text-link");
          link.href = `contact-us/?service=${service.id}`;
          link.firstChild.textContent = service.cta + " ";
          return node;
        }),
      );
  }
  document
    .querySelectorAll("[data-service-links], [data-service-jump]")
    .forEach((container) => {
      const heading = container.querySelector("h3")?.cloneNode(true);
      container.replaceChildren();
      if (heading) container.append(heading);
      SERVICES.forEach((service) => {
        const a = document.createElement("a");
        a.href = `service/#${service.id}`;
        a.textContent = service.title;
        // The service page's jump row is authored as inline links, so restore
        // that class when rebuilding it. The footer's service column is a plain
        // link list and must keep the footer's own styling.
        if (container.hasAttribute("data-service-jump")) a.className = "text-link";
        container.append(a);
      });
    });
  const projectSelect = document.querySelector("#project");
  if (projectSelect) {
    // Builds one <option> for the project select.
    const option = (v, t) => {
      const el = document.createElement("option");
      el.value = v;
      el.textContent = t;
      if (!v) {
        el.disabled = true;
        el.hidden = true;
        el.defaultSelected = true;
        el.selected = true;
      }
      return el;
    };
    projectSelect.replaceChildren(
      option("", "Select a service"),
      ...SERVICES.map((s) => option(s.id, s.title)),
      option("other", "Something else"),
    );
  }
  document.querySelectorAll("[data-project-list]").forEach((container) => {
    const template = container.querySelector(".project-card")?.cloneNode(true);
    if (!template) return;
    const key = container.dataset.projectList;
    const selected =
      key === "all"
        ? PROJECTS
        : (HOME_PROJECTS[key] || [])
            .map((id) => PROJECTS.find((p) => p.id === id))
            .filter(Boolean);
    container.replaceChildren(
      ...selected.map((project, i) => {
        const node = template.cloneNode(true);
        node.dataset.category = project.category;
        node.classList.remove("featured-main", "featured-secondary");
        if (key === "featured")
          node.classList.add(i === 0 ? "featured-main" : "featured-secondary");
        const button = node.querySelector("[data-project]");
        button.dataset.project = project.id;
        const storyLink = node.querySelector(".project-story-link");
        if (storyLink) storyLink.href = project.page || "projects/";
        const badge = node.querySelector(".image-badge");
        if (badge)
          badge.textContent =
            project.reference === false
              ? "STUDIO PROJECT"
              : "REFERENCE CONCEPT";
        button.setAttribute(
          "aria-label",
          `View ${project.title}, ${project.category} ${project.reference === false ? "studio project" : "reference concept"}`,
        );
        setText(node, ".project-title", project.title);
        setText(
          node,
          ".project-category",
          `${project.category} / ${project.style}`,
        );
        setText(node, ".project-summary", project.description);
        setText(
          node,
          ".project-location",
          `Location: ${project.location || "Gurugram, Haryana"}`,
        );
        setImage(node.querySelector("img"), project.images[0], project.alt);
        return node;
      }),
    );
  });
  const count = document.querySelector("#gallery-count");
  if (count) count.textContent = `${PROJECTS.length} spaces`;
  const heroProject = PROJECTS.find((p) => p.id === "project-0") || PROJECTS[0];
  if (heroProject) {
    setImage(
      document.querySelector(".hero-image"),
      heroProject.images[0],
      heroProject.alt,
    );
    const total = document.querySelector(".hero-index > span");
    if (total)
      total.textContent = "/ " + String(PROJECTS.length).padStart(2, "0");
    const featuredLink = document.querySelector(".featured-story .text-link");
    if (featuredLink && HOME_PROJECTS.featured[0])
      featuredLink.href = PROJECTS.find(p => p.id === HOME_PROJECTS.featured[0])?.page || "projects/";

    const hero = document.querySelector(".hero-caption");
    if (hero) {
      hero.href = heroProject.page || "projects/";
      setText(hero, "span", `01 / ${heroProject.title.toUpperCase()}`);
      setText(
        hero,
        "small",
        `${heroProject.category} · ${heroProject.style} · Reference concept`,
      );
    }
  }
  const meta = PAGE_META[currentPage] || PAGE_META[""];
  const base = /^https?:\/\//.test(config.siteUrl)
    ? config.siteUrl.replace(/\/?$/, "/")
    : "https://vrfhomeinteriors.com/";
  const canonical = new URL(
    currentPage === "" ? "" : currentPage,
    base,
  ).href;
  const title = `${meta.title} | ${config.brandName}`;
  document.title = title;
  // Creates or updates a meta tag, removing it when the value is empty.
  function attr(selector, value) {
    const el = document.querySelector(selector);
    if (el) el.content = value;
  }
  attr('meta[name="description"]', meta.description);
  attr('meta[property="og:title"]', title);
  attr('meta[name="twitter:title"]', title);
  attr('meta[property="og:description"]', meta.description);
  attr('meta[property="og:image:alt"]', meta.imageAlt);
  attr('meta[name="twitter:description"]', meta.description);
  attr('meta[property="og:image"]', new URL(meta.image, base).href);
  attr('meta[name="twitter:image"]', new URL(meta.image, base).href);
  attr('meta[property="og:url"]', canonical);
  attr('meta[name="application-name"]', config.brandName);
  attr('meta[name="apple-mobile-web-app-title"]', config.brandName);
  const canonicalLink = document.querySelector('link[rel="canonical"]');
  if (canonicalLink) canonicalLink.href = canonical;
  const graph = [
    {
      "@type": "WebSite",
      "@id": base + "#website",
      url: base,
      name: config.brandName,
    },
    {
      "@type": "WebPage",
      "@id": canonical + "#page",
      url: canonical,
      name: title,
      description: meta.description,
      isPartOf: { "@id": base + "#website" },
    },
  ];
  if (currentPage !== "")
    graph.push({
      "@type": "BreadcrumbList",
      itemListElement: [
        { "@type": "ListItem", position: 1, name: "Home", item: base },
        { "@type": "ListItem", position: 2, name: meta.title, item: canonical },
      ],
    });
  if (configured(config.designerName) && currentPage === "about/")
    graph.push({
      "@type": "Person",
      name: config.designerName,
      ...(configured(config.designerRole)
        ? { jobTitle: config.designerRole }
        : {}),
    });
  if (config.verifiedBusiness === true && configured(config.brandName)) {
    const business = {
      "@type": "ProfessionalService",
      "@id": base + "#studio",
      name: config.brandName,
      url: base,
    };
    if (configured(config.phone)) business.telephone = config.phone;
    if (configured(config.email)) business.email = config.email;
    /* sameAs tells search engines which social profiles belong to this same
       business, so the studio's website and its accounts are treated as one
       entity. Only real, configured https profile URLs are published. */
    const profiles = Object.values(config.social || {}).filter(
      (url) => configured(url) && /^https?:\/\//i.test(url),
    );
    if (profiles.length) business.sameAs = profiles;
    if (
      ["street", "city", "state", "postalCode", "country"].every((k) =>
        configured(config.address[k]),
      )
    )
      business.address = {
        "@type": "PostalAddress",
        streetAddress: [
          config.address.street,
          configured(config.address.area) ? config.address.area : "",
        ]
          .filter(Boolean)
          .join(", "),
        addressLocality: config.address.city,
        addressRegion: config.address.state,
        postalCode: config.address.postalCode,
        addressCountry: config.address.country,
      };
    graph.push(business);
  }
  const schema = document.querySelector('script[type="application/ld+json"]');
  if (schema)
    schema.textContent = JSON.stringify({
      "@context": "https://schema.org",
      "@graph": graph,
    });
  const map = document.getElementById("map-panel");
  if (map) {
    const actualAddress = [
      "street",
      "city",
      "state",
      "postalCode",
      "country",
    ].every((key) => configured(config.address[key]));
    if (actualAddress) {
      const query = encodeURIComponent(address.replace(/\[[^\]]*\],?\s*/g, ""));
      const external = document.querySelector("[data-map-link]");
      external.hidden = false;
      external.href = `https://www.google.com/maps/search/?api=1&query=${query}`;
      external.target = "_blank";
      external.rel = "noopener noreferrer";
      const placeholder = map.querySelector(".map-placeholder");
      if (placeholder) placeholder.hidden = true;
      map.querySelector(".map-consent").hidden = false;
      const loadMap = () => {
        let source = `https://www.google.com/maps?q=${query}&z=16&output=embed`;
        try {
          const custom = new URL(config.mapEmbedUrl);
          if (
            custom.protocol === "https:" &&
            ["www.google.com", "maps.google.com"].includes(custom.hostname)
          )
            source = custom.href;
        } catch (_) {}
        const frame = document.createElement("iframe");
        frame.src = source;
        frame.title = `Address search map for ${config.brandName}: ${address}`;
        frame.loading = "eager";
        frame.referrerPolicy = "no-referrer";
        frame.setAttribute("allowfullscreen", "");
        map.replaceChildren(frame);
      };
      if (map.dataset.mapAutoload === "true") loadMap();
      else document.getElementById("load-map")?.addEventListener("click", loadMap);
    }
  }
})();
