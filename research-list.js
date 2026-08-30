(() => {
  "use strict";

  const rawItems = Array.isArray(window.HACK_FIN_RESEARCH) ? window.HACK_FIN_RESEARCH : [];
  const items = [...rawItems].sort((a, b) => String(b.published || "").localeCompare(String(a.published || "")));

  const esc = (value) => String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");

  const card = (item) => `
    <a class="research-card research-card--${esc(item.theme || "ownership")}" href="${esc(item.href)}" aria-label="Читать: ${esc(item.title)}">
      <div class="research-card__visual" aria-hidden="true">
        ${item.badge ? `<span class="research-card__badge">${esc(item.badge)}</span>` : ""}
        <div class="research-card__visual-copy">
          <div class="research-card__visual-label">${esc(item.visualLabel || item.category)}</div>
          <div class="research-card__visual-mark">${esc(item.visual || "Исследование")}</div>
        </div>
      </div>
      <div class="research-card__body">
        <div class="research-card__category">${esc(item.category)}</div>
        <h3 class="research-card__title">${esc(item.title)}</h3>
        <p class="research-card__deck">${esc(item.description)}</p>
        <div class="research-card__meta">
          <span>${esc(item.date)}</span>
          <span>${esc(item.readTime)}</span>
          ${item.proof ? `<span>${esc(item.proof)}</span>` : ""}
          ${item.updated ? `<span>${esc(item.updated)}</span>` : ""}
        </div>
        <span class="research-card__cta">Читать исследование</span>
      </div>
    </a>`;

  const render = (node, sourceItems) => {
    const limit = Number.parseInt(node.dataset.limit || "0", 10);
    const category = node.dataset.category || "all";
    let visible = sourceItems.filter((item) => category === "all" || item.categoryKey === category);
    if (Number.isFinite(limit) && limit > 0) visible = visible.slice(0, limit);
    node.innerHTML = visible.length
      ? visible.map(card).join("")
      : '<div class="research-empty">В этой рубрике пока нет материалов.</div>';
  };

  document.querySelectorAll("[data-research-list]").forEach((node) => render(node, items));

  document.querySelectorAll("[data-related-research]").forEach((node) => {
    const current = node.dataset.current || "";
    const limit = Number.parseInt(node.dataset.limit || "2", 10);
    render(node, items.filter((item) => item.slug !== current).slice(0, limit));
  });

  document.querySelectorAll("[data-research-total]").forEach((node) => {
    node.textContent = String(items.length);
  });

  document.querySelectorAll("[data-research-filters]").forEach((filtersNode) => {
    const listSelector = filtersNode.dataset.target;
    const listNode = listSelector ? document.querySelector(listSelector) : document.querySelector("[data-research-list]");
    if (!listNode) return;

    const categories = [...new Map(items.map((item) => [item.categoryKey, item.category])).entries()];
    const buttons = [["all", "Все"], ...categories];
    filtersNode.innerHTML = buttons.map(([key, label], index) => `
      <button class="research-filter${index === 0 ? " is-active" : ""}" type="button" data-category="${esc(key)}" aria-pressed="${index === 0}">${esc(label)}</button>
    `).join("");

    filtersNode.addEventListener("click", (event) => {
      const button = event.target.closest("[data-category]");
      if (!button) return;
      filtersNode.querySelectorAll("[data-category]").forEach((item) => {
        const active = item === button;
        item.classList.toggle("is-active", active);
        item.setAttribute("aria-pressed", String(active));
      });
      listNode.dataset.category = button.dataset.category;
      render(listNode, items);
    });
  });

  const schemaNode = document.getElementById("researchItemListSchema");
  if (schemaNode) {
    const absoluteUrl = (href) => {
      try {
        return new URL(href, document.baseURI).href;
      } catch (_) {
        return href;
      }
    };

    schemaNode.textContent = JSON.stringify({
      "@context": "https://schema.org",
      "@type": "ItemList",
      "name": "Исследования Александры Кашаевой",
      "itemListElement": items.map((item, index) => ({
        "@type": "ListItem",
        "position": index + 1,
        "url": absoluteUrl(item.href),
        "name": item.title
      }))
    });
  }
})();
