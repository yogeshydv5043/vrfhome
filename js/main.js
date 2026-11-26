/* Shared page behaviour.
   Toast notifications, scroll locking for modals, and the WhatsApp links
   whose prefilled message follows the section or service being viewed.
   Loaded on every page. */
(() => {
  "use strict";
  let toastTimer;
  // True when a config value is real rather than a leftover placeholder.
  const configured = (value) =>
    typeof value === "string" &&
    value.length > 0 &&
    !value.includes("[") &&
    !value.startsWith("YOUR_");
  // Accepts only http(s) URLs, so a bad config value cannot inject a scheme.
  const safeUrl = (value) => {
    try {
      const url = new URL(value);
      return ["https:", "http:"].includes(url.protocol);
    } catch (_) {
      return false;
    }
  };
  // Shows a short-lived toast. Replaces any toast already on screen.
  function notify(message) {
    const toast = document.querySelector(".toast");
    if (!toast) return;
    clearTimeout(toastTimer);
    toast.textContent = message;
    toast.hidden = false;
    toastTimer = setTimeout(() => {
      toast.hidden = true;
    }, 6500);
  }
  // Freezes background scrolling while any dialog is open.
  function lockScroll() {
    document.body.classList.toggle(
      "modal-open",
      !!document.querySelector("dialog[open]"),
    );
  }
  // Renders text with the phone number and email turned into tel:/mailto: links.
  function contactText(container, text) {
    const escape = value => value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    const tokens = [SITE_CONFIG.email, SITE_CONFIG.phone].filter(configured);
    if (!tokens.length) { container.textContent = text; return; }
    const parts = text.split(new RegExp("(" + tokens.map(escape).join("|") + ")", "g"));
    container.replaceChildren(...parts.map(part => {
      if (!tokens.includes(part)) return document.createTextNode(part);
      const link = document.createElement("a");
      link.textContent = part;
      link.href = part === SITE_CONFIG.email ? "mailto:" + part : "tel:" + part.replace(/[^+\d]/g, "");
      return link;
    }));
  }
  window.Studio = { notify, configured, safeUrl, lockScroll, contactText };
  const config = SITE_CONFIG;
  [
    ["brand", config.brandName],
    ["phone", config.phone],
    ["email", config.email],
  ].forEach(([name, value]) => {
    document.querySelectorAll(`[data-${name}]`).forEach((el) => {
      el.textContent = value;
      if (configured(value) && el.tagName === "A") {
        if (name === "phone" && /^\+?[\d\s().-]{7,25}$/.test(value))
          el.href = "tel:" + value.replace(/[^+\d]/g, "");
        if (name === "email" && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value))
          el.href = "mailto:" + value;
      }
    });
  });
  document
    .querySelectorAll("[data-phone-link], [data-email-link]")
    .forEach((link) => {
      const phone = link.hasAttribute("data-phone-link");
      const value = phone ? config.phone : config.email;
      if (configured(value))
        link.href = phone
          ? "tel:" + value.replace(/[^+\d]/g, "")
          : "mailto:" + value;
      else
        link.addEventListener("click", (event) => {
          event.preventDefault();
          notify(
            `The studio ${phone ? "phone number" : "email address"} is not configured yet.`,
          );
        });
    });
  document.querySelectorAll("[data-phone], [data-email]").forEach((link) => {
    if (link.tagName !== "A") return;
    const value = link.hasAttribute("data-phone") ? config.phone : config.email;
    if (!configured(value))
      link.addEventListener("click", (event) => {
        event.preventDefault();
        notify("This studio contact detail is not configured yet.");
      });
  });
  const availability = document.getElementById("contact-availability");
  if (
    availability &&
    (configured(config.phone) ||
      configured(config.email) ||
      /^\d{7,15}$/.test(config.whatsapp))
  )
    availability.textContent =
      "Use an available contact channel above if you prefer to enquire directly.";
  /* Correct display names for the social networks. Capitalising the first
     letter alone would render "X" and "YouTube" wrongly. */
  const SOCIAL_LABELS = {
    instagram: "Instagram",
    facebook: "Facebook",
    x: "X",
    threads: "Threads",
    youtube: "YouTube",
  };
  const socialLabel = (name) =>
    SOCIAL_LABELS[name] || name[0].toUpperCase() + name.slice(1);
  /* Points every [data-social] icon at its configured profile. Configured
     accounts open in a new tab; unconfigured ones stay in place and explain
     themselves rather than navigating nowhere. */
  document.querySelectorAll("[data-social]").forEach((link) => {
    const name = link.dataset.social;
    const url = config.social[name];
    if (configured(url) && safeUrl(url)) {
      const label = socialLabel(name);
      link.href = url;
      link.target = "_blank";
      link.rel = "noopener noreferrer";
      link.setAttribute(
        "aria-label",
        `${config.brandName} on ${label} (opens in a new tab)`,
      );
      link.title = `${config.brandName} on ${label}`;
    } else {
      const label = socialLabel(name);
      link.setAttribute("aria-label", `${label} — contact the studio directly`);
      link.title = `${label} profile link coming soon`;
      link.addEventListener("click", (event) => {
        event.preventDefault();
        notify(
          `Our ${label} page link is being added. Call ${config.phone} or message us on WhatsApp in the meantime.`,
        );
      });
    }
  });
  const whatsapp = config.whatsapp;
  const whatsappReady = /^\d{7,15}$/.test(whatsapp);
  // Builds the prefilled WhatsApp message from the current project, selected
  // service or section, so the studio knows what the enquiry is about.
  function whatsappMessage() {
    const params = new URLSearchParams(location.search);
    const reference = PROJECTS.find(project =>
      project.id === (document.body.dataset.projectPage || params.get("reference")));
    const selectedService = document.querySelector('#enquiry-form [name="project"]')?.value;
    const serviceId = selectedService || params.get("service") || (window.Studio && Studio.activeSection) || location.hash.slice(1);
    const service = SERVICES.find(item => item.id === serviceId);
    const nameInput = document.querySelector('#enquiry-form [name="name"]')?.value?.trim();
    const cityInput = document.querySelector('#enquiry-form [name="city"]')?.value?.trim();
    const lines = ["Hello VRF HOME INTERIORS,", "I would like to discuss an interior design project."];
    if (service) lines.push("Service: " + service.title);
    else if (selectedService === "other") lines.push("Service: Other / please advise");
    if (reference) lines.push("Reference: " + reference.title + (reference.reference === false ? "" : " (inspiration study)"));
    lines.push("", `Name: ${nameInput || ""}`, `City: ${cityInput || ""}`, "Project details: ");
    return lines.join("\n");
  }
  // Points one WhatsApp link at the current prefilled message.
  function updateWhatsapp(link) {
    link.href = `https://wa.me/${whatsapp}?text=${encodeURIComponent(whatsappMessage())}`;
  }
  document.querySelectorAll("[data-whatsapp]").forEach((link) => {
    if (whatsappReady) {
      updateWhatsapp(link);
      link.addEventListener("click", () => updateWhatsapp(link));
      link.addEventListener("auxclick", () => updateWhatsapp(link));
      link.target = "_blank";
      link.rel = "noopener noreferrer";
      link.setAttribute("aria-label", "Discuss your project on WhatsApp");
    } else {
      link.addEventListener("click", (event) => {
        event.preventDefault();
        notify(
          "WhatsApp is not configured. Add your studio number in js/config.js to enable direct enquiries.",
        );
      });
    }
  });
  // Re-runs the prefill after navigation or a form change.
  function refreshWhatsAppLinks() {
    if (whatsappReady) document.querySelectorAll("[data-whatsapp]").forEach(updateWhatsapp);
  }
  window.addEventListener("hashchange", refreshWhatsAppLinks);
  window.addEventListener("studio:sectionchange", refreshWhatsAppLinks);
  document.addEventListener("DOMContentLoaded", refreshWhatsAppLinks);
  document.addEventListener("input", event => {
    if (event.target.matches?.('#enquiry-form [name="name"], #enquiry-form [name="city"]')) refreshWhatsAppLinks();
  });
  document.addEventListener("change", event => {
    if (event.target.matches?.('#enquiry-form [name="project"]')) refreshWhatsAppLinks();
  });
  document.querySelectorAll(".current-year").forEach((el) => {
    el.textContent = new Date().getFullYear();
  });
  if (configured(config.brandName))
    document.title = document.title.replace("[STUDIO NAME]", config.brandName);
  document.querySelectorAll("img").forEach((img) => {
    // Marks an image that failed to load so the layout keeps its shape.
    const failed = () => {
      img.classList.add("image-error");
      img.setAttribute(
        "aria-label",
        `${img.alt || "Project image"} — image unavailable`,
      );
    };
    img.addEventListener("error", failed);
    if (img.complete && !img.naturalWidth) failed();
  });
  // Content remains visible immediately; no scroll-triggered reveal work is needed.
})();
