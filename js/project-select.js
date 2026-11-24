/* Custom project picker on the enquiry form.
   Replaces the native select with a listbox that matches the site styling,
   keeping full keyboard support: arrows, Home and End, type-ahead, Escape.
   Progressive enhancement — the original select remains the form's data
   source, so the form still submits correctly if this never runs. */
(() => {
  "use strict";
  const select = document.querySelector('#enquiry-form select[name="project"]');
  if (!select) return;
  const form = select.form;
  const label = document.querySelector('label[for="project"]');
  const trigger = document.createElement("button");
  trigger.type = "button";
  trigger.id = "project-trigger";
  trigger.className = "project-select-trigger";
  trigger.setAttribute("role", "combobox");
  trigger.setAttribute("aria-haspopup", "listbox");
  trigger.setAttribute("aria-expanded", "false");
  trigger.setAttribute("aria-controls", "project-options");
  trigger.setAttribute("aria-required", "true");
  trigger.setAttribute("aria-describedby", "project-error");
  label.id = "project-label";
  label.htmlFor = trigger.id;
  trigger.setAttribute("aria-labelledby", label.id);
  const valueText = document.createElement("span");
  valueText.className = "project-select-value";
  const chevron = document.createElement("span");
  chevron.className = "project-select-chevron";
  chevron.setAttribute("aria-hidden", "true");
  trigger.append(valueText, chevron);
  const list = document.createElement("div");
  list.id = "project-options";
  list.className = "project-select-options";
  list.setAttribute("role", "listbox");
  list.setAttribute("aria-labelledby", label.id);
  list.hidden = true;
  const options = Array.from(select.options).filter(option => option.value && !option.disabled);
  const items = options.map((option, index) => {
    const item = document.createElement("div");
    item.id = `project-option-${index}`;
    item.className = "project-select-option";
    item.setAttribute("role", "option");
    item.textContent = option.textContent.trim();
    item.addEventListener("pointerdown", (event) => event.preventDefault());
    item.addEventListener("click", () => commit(index));
    list.append(item);
    return item;
  });
  select.after(trigger);
  document.body.append(list);
  select.classList.add("project-select-native");
  select.tabIndex = -1;
  select.setAttribute("aria-hidden", "true");
  let active = Math.max(0, options.findIndex(option => option.value === select.value));
  let search = "";
  let lastKey = 0;
  let frame = 0;
  // Whether the listbox is currently open.
  const isOpen = () => !list.hidden;
  // Mirrors the native select's value onto the custom trigger.
  function sync() {
    valueText.textContent = select.selectedOptions[0]?.textContent.trim() || "Select a service";
    trigger.classList.toggle("is-placeholder", !select.value);
    trigger.setAttribute("aria-invalid", select.getAttribute("aria-invalid") || "false");
    trigger.disabled = select.matches(":disabled");
    items.forEach((item, index) => item.setAttribute("aria-selected", String(options[index].value === select.value)));
    if (trigger.disabled) close();
  }
  // Places the listbox above or below the trigger, whichever fits.
  function position() {
    if (!isOpen()) return;
    const rect = trigger.getBoundingClientRect();
    const viewport = window.visualViewport;
    const topEdge = viewport?.offsetTop || 0;
    const leftEdge = viewport?.offsetLeft || 0;
    const height = viewport?.height || window.innerHeight;
    const width = viewport?.width || document.documentElement.clientWidth;
    const bottomEdge = topEdge + height;
    if (rect.bottom < topEdge || rect.top > bottomEdge) return close();
    const below = bottomEdge - rect.bottom - 14;
    const above = rect.top - topEdge - 14;
    const upward = below < 220 && above > below;
    list.style.width = `${Math.min(rect.width, width - 24)}px`;
    list.style.left = `${Math.max(leftEdge + 12, Math.min(rect.left, leftEdge + width - rect.width - 12))}px`;
    list.style.maxHeight = `${Math.max(44, Math.min(300, upward ? above : below))}px`;
    list.style.top = `${upward ? rect.top - list.getBoundingClientRect().height - 6 : rect.bottom + 6}px`;
  }
  // Moves the active option for keyboard navigation.
  function highlight(index) {
    active = Math.max(0, Math.min(items.length - 1, index));
    items.forEach((item, i) => item.classList.toggle("is-active", i === active));
    trigger.setAttribute("aria-activedescendant", items[active].id);
    const item = items[active];
    if (item.offsetTop < list.scrollTop) list.scrollTop = item.offsetTop;
    else if (item.offsetTop + item.offsetHeight > list.scrollTop + list.clientHeight)
      list.scrollTop = item.offsetTop + item.offsetHeight - list.clientHeight;
  }
  // Opens the listbox and focuses the selected option.
  function open() {
    if (trigger.disabled) return;
    sync();
    list.hidden = false;
    trigger.setAttribute("aria-expanded", "true");
    position();
    highlight(Math.max(0, options.findIndex(option => option.value === select.value)));
  }
  // Closes the listbox and returns focus to the trigger.
  function close() {
    list.hidden = true;
    trigger.setAttribute("aria-expanded", "false");
    trigger.removeAttribute("aria-activedescendant");
    search = "";
  }
  // Writes the chosen option back to the native select and fires change.
  function commit(index) {
    if (trigger.disabled) return;
    select.value = options[index].value;
    select.dispatchEvent(new Event("input", { bubbles: true }));
    select.dispatchEvent(new Event("change", { bubbles: true }));
    sync();
    close();
    trigger.focus({ preventScroll: true });
  }
  trigger.addEventListener("click", () => isOpen() ? close() : open());
  trigger.addEventListener("keydown", (event) => {
    const key = event.key;
    if (["ArrowDown", "ArrowUp", "Home", "End", "Enter", " ", "Escape"].includes(key)) {
      event.preventDefault();
      if (key === "Escape") return close();
      if (key === "Enter" || key === " ") return isOpen() ? commit(active) : open();
      if (!isOpen()) {
        open();
        if (key === "ArrowDown" || key === "ArrowUp") return;
      }
      if (key === "Home") highlight(0);
      else if (key === "End") highlight(items.length - 1);
      else highlight(active + (key === "ArrowDown" ? 1 : -1));
    } else if (key === "Tab") {
      close();
    } else if (key.length === 1 && !event.ctrlKey && !event.metaKey && !event.altKey) {
      event.preventDefault();
      if (!isOpen()) open();
      const now = Date.now();
      search = now - lastKey > 700 ? key.toLowerCase() : search + key.toLowerCase();
      lastKey = now;
      const match = options.findIndex(option => option.textContent.trim().toLowerCase().startsWith(search));
      if (match >= 0) highlight(match);
    }
  });
  trigger.addEventListener("blur", () => {
    close();
    select.dispatchEvent(new Event("blur"));
  });
  select.addEventListener("focus", () => trigger.focus());
  select.addEventListener("change", sync);
  select.addEventListener("input", sync);
  new MutationObserver(sync).observe(select, { attributes: true, attributeFilter: ["aria-invalid", "disabled"] });
  const fieldset = select.closest("fieldset");
  if (fieldset) new MutationObserver(sync).observe(fieldset, { attributes: true, attributeFilter: ["disabled"] });
  form.addEventListener("reset", () => setTimeout(() => { close(); sync(); }, 0));
  document.addEventListener("pointerdown", event => {
    if (!trigger.contains(event.target) && !list.contains(event.target)) close();
  });
  // Re-places an open listbox after a scroll or resize.
  const reposition = (event) => {
    if (!isOpen() || (event.target instanceof Node && list.contains(event.target)) || frame) return;
    frame = requestAnimationFrame(() => { frame = 0; position(); });
  };
  window.addEventListener("resize", reposition, { passive: true });
  document.addEventListener("scroll", reposition, { capture: true, passive: true });
  window.visualViewport?.addEventListener("resize", reposition, { passive: true });
  sync();
})();
