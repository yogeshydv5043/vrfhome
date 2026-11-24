/* Enquiry form.
   Field validation with inline messages, the FAQ accordion, submission to
   api/enquiry.php and the success, failure and not-configured states.
   Nothing the visitor types is stored in the browser. */
(() => {
  "use strict";
  document.querySelectorAll(".faq-list").forEach((list) => {
    const items = Array.from(list.querySelectorAll("details"));
    items.forEach((item) => {
      item.addEventListener("toggle", () => {
        if (!item.open) return;
        items.forEach((other) => {
          if (other !== item) other.open = false;
        });
      });
    });
  });

  const form = document.getElementById("enquiry-form");
  if (!form) return;
  const status = form.querySelector(".form-status");
  const fieldset = document.getElementById("enquiry-fields");
  const button = form.querySelector('[type="submit"]');
  const label = button.querySelector("[data-submit-label]");
  const fields = [
    "name",
    "email",
    "city",
    "project",
    "phone",
    "message",
    "address1",
    "address2",
    "state",
    "postalCode",
    "country",
  ];
  const referenceId = new URLSearchParams(location.search).get("reference");
  const referenceProject = PROJECTS.find(
    (project) => project.id === referenceId,
  );
  if (referenceProject && !form.elements.namedItem("message").value)
    form.elements.namedItem("message").value =
      "I would like to discuss a space inspired by " +
      referenceProject.title +
      ". ";
  const touched = new Set();
  let submitting = false;
  const endpointConfigured =
    typeof FORM_CONFIG.endpoint === "string" &&
    FORM_CONFIG.endpoint.trim() &&
    !/\[|YOUR_/.test(FORM_CONFIG.endpoint);
  // Returns a form control by name.
  const field = (name) => form.elements.namedItem(name);
  // Returns a trimmed field value.
  const value = (name) => field(name).value.trim();
  // Whether the country field means India, which changes phone validation.
  const isIndia = () => /^(india|in|bharat|भारत)$/iu.test(value("country"));
  const service = new URLSearchParams(location.search).get("service");
  if (service && SERVICES.some((item) => item.id === service))
    field("project").value = service;
  if (endpointConfigured) {
    const notice = document.querySelector("#connection-notice p");
    if (notice)
      Studio.contactText(notice,
        "Submitting sends your enquiry through this website’s mail service to vrf.interiors@gmail.com. Please review the Privacy Policy. WhatsApp links prefill the service/reference only; your form entries are not copied there.");
  }
  // Returns the validation message for a field, or an empty string if valid.
  function errorFor(name) {
    const v = value(name);
    if (name === "name") {
      if (!v) return "Please enter your name.";
      if ((v.match(/\p{L}/gu) || []).length < 2)
        return "Please enter a name with at least 2 letters.";
      if (!/^[\p{L}\p{M}\s.'’\-]+$/u.test(v))
        return "Please use letters, spaces, apostrophes, hyphens or periods in your name.";
    }
    if (
      name === "email" &&
      (!/^[^\s@]+@[^\s@]+\.[^\s@.]{2,}$/.test(v) || v.includes(".."))
    )
      return "Please enter a valid email address.";
    if (name === "phone") {
      if (!v) return "";
      let digits = v.replace(/\D/g, "");
      if (
        !/^\+?[\d\s().-]+$/.test(v) ||
        digits.length < 7 ||
        digits.length > 15 ||
        /^(\d)\1+$/.test(digits)
      )
        return "Please enter a valid phone number, including a country code where needed.";
      if (v.startsWith("+91") || isIndia()) {
        if (digits.length === 12 && digits.startsWith("91"))
          digits = digits.slice(2);
        else if (digits.length === 11 && digits.startsWith("0"))
          digits = digits.slice(1);
        if (!/^[1-9]\d{9}$/.test(digits) || /^(\d)\1+$/.test(digits))
          return "Please enter a valid 10-digit Indian mobile or landline number, optionally with +91.";
      }
      if (v.startsWith("+") && digits.startsWith("0"))
        return "Please enter a valid international country code after +.";
    }
    if (name === "address1") {
      if (!v) return "";
      if (v.length < 5 || !/[\p{L}]/u.test(v))
        return "Please include a street or building name (at least 5 characters).";
    }
    if (name === "city" && (v.length < 2 || !/[\p{L}]/u.test(v)))
      return "Please enter your city.";
    if (name === "state" && v && (v.length < 2 || !/[\p{L}]/u.test(v)))
      return "Please enter your state or region.";
    if (name === "country" && v && (v.length < 2 || !/[\p{L}]/u.test(v)))
      return "Please enter your country.";
    if (name === "postalCode") {
      if (!v) return "";
      if (isIndia() && !/^[1-9]\d{5}$/.test(v))
        return "Please enter a valid 6-digit Indian postal code.";
      if (
        !isIndia() &&
        (!/^[\p{L}\d][\p{L}\d -]{1,10}[\p{L}\d]$/u.test(v) || !/\d/.test(v))
      )
        return "Please enter a valid postal code (3–12 letters or digits, with spaces or hyphens).";
    }
    if (
      name === "project" &&
      (!v || (!SERVICES.some((s) => s.id === v) && v !== "other"))
    )
      return "Please choose one of the listed services.";
    if (name === "message" && v.length < 20)
      return "Please enter a message of at least 20 characters.";
    return "";
  }
  // Validates one field and shows or clears its inline message.
  function validate(name) {
    const error = errorFor(name);
    field(name).setAttribute("aria-invalid", String(!!error));
    document.getElementById(`${name}-error`).textContent = error;
    return !error;
  }
  // Clears the form-level status message.
  function clearStatus() {
    status.textContent = "";
    status.className = "form-status";
  }
  fields.forEach((name) => {
    field(name).addEventListener("blur", () => {
      touched.add(name);
      validate(name);
    });
    field(name).addEventListener("input", () => {
      if (
        touched.has(name) ||
        field(name).getAttribute("aria-invalid") === "true"
      )
        validate(name);
      if (name === "country")
        for (const dependent of ["postalCode", "phone"])
          if (touched.has(dependent)) validate(dependent);
      if (!submitting) clearStatus();
    });
    field(name).addEventListener("change", () => {
      if (touched.has(name)) validate(name);
    });
  });
  // Announces a status message to screen readers as well as showing it.
  function announce(message, kind = "error") {
    Studio.contactText(status, message);
    status.className = `form-status ${kind}`;
    status.focus();
  }
  form.addEventListener("submit", async (event) => {
    event.preventDefault();
    if (submitting) return;
    if (form.elements.namedItem("_website")?.value) {
      announce("Please leave the website field empty and try again.");
      return;
    }
    fields.forEach((name) => touched.add(name));
    const invalid = fields.filter((name) => !validate(name));
    if (invalid.length) {
      status.textContent =
        "Please review the highlighted fields. Your enquiry has not been sent.";
      status.className = "form-status error";
      const optional = field(invalid[0]).closest("details");
      if (optional) optional.open = true;
      field(invalid[0]).focus();
      return;
    }
    if (!endpointConfigured) {
      announce(
        "Email sending is not configured. Please call, email or WhatsApp us using the options below. Your enquiry has not been sent.",
        "notice",
      );
      return;
    }
    let endpoint;
    try {
      if (location.protocol === "file:") throw new Error("local");
      endpoint = new URL(FORM_CONFIG.endpoint, document.baseURI);
      if (
        !["http:", "https:"].includes(endpoint.protocol) ||
        (endpoint.protocol !== "https:" && endpoint.origin !== location.origin)
      )
        throw new Error("unsafe");
    } catch (_) {
      announce(
        "The enquiry service cannot be used from this address. Open the hosted website or use a direct contact option. Your enquiry has not been sent.",
      );
      return;
    }
    // Build before disabling the fieldset; disabled controls are omitted from FormData.
    const data = new FormData(form);
    fields.forEach((name) => data.set(name, value(name)));
    submitting = true;
    fieldset.disabled = true;
    button.disabled = true;
    label.textContent = "Sending…";
    form.setAttribute("aria-busy", "true");
    status.className = "form-status notice";
    status.textContent = "Sending your enquiry securely…";
    const controller = new AbortController();
    const timeout = setTimeout(
      () => controller.abort(),
      Math.max(1000, Math.min(FORM_CONFIG.timeoutMs || 15000, 60000)),
    );
    try {
      if (FORM_CONFIG.csrf) {
        const tokenResponse = await fetch(endpoint.href, {
          method: "GET",
          headers: { Accept: "application/json" },
          credentials: "same-origin",
          cache: "no-store",
          signal: controller.signal,
        });
        let tokenReceipt;
        try { tokenReceipt = await tokenResponse.json(); }
        catch (_) { throw new Error("unconfirmed"); }
        if (!tokenResponse.ok || !/^[a-f0-9]{64}$/.test(tokenReceipt?.csrf || ""))
          throw new Error(tokenReceipt?.code || "unconfirmed");
        data.set("_csrf", tokenReceipt.csrf);
      }
      const response = await fetch(endpoint.href, {
        method: "POST",
        body: data,
        headers: { Accept: "application/json" },
        signal: controller.signal,
        credentials: "same-origin",
      });
      let receipt;
      try {
        receipt = await response.json();
      } catch (_) {
        throw new Error("unconfirmed");
      }
      if (!response.ok || receipt?.[FORM_CONFIG.successField] !== true)
        throw new Error(receipt?.code || "unconfirmed");
      Studio.track?.("enquiry_accepted");
      form.reset();
      touched.clear();
      fields.forEach((name) => {
        field(name).setAttribute("aria-invalid", "false");
        document.getElementById(`${name}-error`).textContent = "";
      });
      announce(
        "Thank you. The mail server accepted your enquiry for delivery to VRF HOME INTERIORS. If you do not hear back, please call or WhatsApp us.",
        "success",
      );
    } catch (error) {
      const messages = {
        SERVICE_NOT_CONFIGURED: "Email sending is not available yet. Please email vrf.interiors@gmail.com, call +91 99990 88992 or use WhatsApp below. Your enquiry has not been sent; your details remain in the form.",
        RATE_LIMITED: "Too many attempts. Please wait 15 minutes or contact us directly. Your details remain in the form.",
        TOKEN_EXPIRED: "Your secure form session expired. Please try sending again. Your details remain in the form.",
        BAD_ORIGIN: "Please open the official HTTPS website before sending, or contact us directly. Your details remain in the form.",
        VALIDATION_FAILED: "The server could not validate your details. Please review the fields and try again. Your details remain in the form.",
        REQUEST_IN_PROGRESS: "An enquiry is already being processed. Please wait before trying again. Your details remain in the form.",
      };
      announce(messages[error.message] ||
        "We couldn’t confirm that your enquiry was sent. Please try again or contact us directly using the options below. Your details remain in the form.");
    } finally {
      clearTimeout(timeout);
      submitting = false;
      fieldset.disabled = false;
      button.disabled = false;
      label.textContent = "Send Enquiry";
      form.removeAttribute("aria-busy");
    }
  });
  button.disabled = false;
})();
