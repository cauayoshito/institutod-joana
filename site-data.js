// ============================================================
// SITE DATA — Carrega dados dinâmicos do Supabase
// ============================================================

(function () {
  "use strict";

  const sb = getSupabase();
  if (!sb) {
    console.warn("Supabase não disponível — mantendo conteúdo estático.");
    return;
  }

  // ===== PARCERIAS =====

  async function loadPartners() {
    const container = document.getElementById("partners-dynamic");
    if (!container) return;

    try {
      const { data, error } = await sb
        .from("partners")
        .select("*")
        .eq("active", true)
        .order("display_order", { ascending: true });

      if (error) throw error;
      if (!data || data.length === 0) return;

      // Gera HTML do marquee com duplicação para loop infinito
      const buildSet = (ariaHidden) =>
        data
          .map(
            (p) => `
        <figure class="marquee-logo">
          <img
            src="${getPublicUrl(p.logo_url)}"
            alt="${ariaHidden ? "" : p.name}"
            loading="lazy"
            decoding="async"
            style="height:60px;width:auto;max-width:140px;object-fit:contain"
          />
          <figcaption>${p.name}</figcaption>
        </figure>`
          )
          .join("");

      container.innerHTML = `
        <div class="marquee-track">
          <div class="marquee-set" aria-hidden="false">${buildSet(false)}</div>
          <div class="marquee-set" aria-hidden="true">${buildSet(true)}</div>
        </div>`;

      // Pausa marquee se preferência de reduced motion
      const prefersRM = window.matchMedia("(prefers-reduced-motion: reduce)");
      const track = container.querySelector(".marquee-track");
      if (track && prefersRM.matches) {
        track.style.animationPlayState = "paused";
      }
    } catch (err) {
      console.error("Erro ao carregar parcerias:", err);
    }
  }

  // ===== NOTÍCIAS =====

  async function loadNews() {
    const container = document.getElementById("news-dynamic");
    if (!container) return;

    try {
      const { data, error } = await sb
        .from("news")
        .select("*")
        .eq("active", true)
        .order("created_at", { ascending: false })
        .limit(3);

      if (error) throw error;
      if (!data || data.length === 0) return;

      const externalIcon = `<svg xmlns="http://www.w3.org/2000/svg" width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/><polyline points="15 3 21 3 21 9"/><line x1="10" y1="14" x2="21" y2="3"/></svg>`;

      const formatDate = (dateStr) => {
        const d = new Date(dateStr);
        const months = [
          "Jan", "Fev", "Mar", "Abr", "Mai", "Jun",
          "Jul", "Ago", "Set", "Out", "Nov", "Dez",
        ];
        return `${months[d.getMonth()]} ${d.getFullYear()}`;
      };

      container.innerHTML = data
        .map(
          (n, i) => `
        <article class="news-card ${i === 0 ? "news-card--featured" : ""}">
          <a href="${n.link || "#"}" ${n.link ? 'target="_blank" rel="noopener noreferrer"' : ""} class="news-card-link" aria-label="${n.title}">
            ${
              n.image_url
                ? `<div class="news-card-media">
                    <img src="${getPublicUrl(n.image_url)}" alt="${n.title}" loading="lazy" decoding="async" />
                  </div>`
                : ""
            }
            <div class="news-card-body">
              <span class="news-tag">${n.tag || "Notícia"}</span>
              <h3>${n.title}</h3>
              <p>${n.description || ""}</p>
              <div class="news-footer">
                <span class="news-date">${formatDate(n.created_at)}</span>
                ${
                  n.link
                    ? `<span class="news-source">${externalIcon} @institutosocialdjoana</span>`
                    : ""
                }
              </div>
            </div>
          </a>
        </article>`
        )
        .join("");
    } catch (err) {
      console.error("Erro ao carregar notícias:", err);
    }
  }

  // ===== GALERIA =====

  async function loadGallery() {
    const container = document.getElementById("gallery-dynamic");
    if (!container) return;

    try {
      const { data, error } = await sb
        .from("gallery")
        .select("*")
        .eq("active", true)
        .order("display_order", { ascending: true });

      if (error) throw error;
      if (!data || data.length === 0) return;

      // Layouts variados para grid visual
      const layoutClasses = [
        "gallery-item-feature",
        "",
        "",
        "gallery-item-wide",
        "",
        "",
        "",
        "gallery-item-wide-bottom",
        "",
      ];

      container.innerHTML = data
        .map(
          (img, i) => `
        <figure class="gallery-item ${layoutClasses[i % layoutClasses.length] || ""} reveal visible">
          <img
            src="${getPublicUrl(img.image_url)}"
            alt="${img.caption || "Momento no Instituto Social D'Joana"}"
            loading="lazy"
            decoding="async"
          />
          <figcaption>${img.caption || ""}</figcaption>
        </figure>`
        )
        .join("");
    } catch (err) {
      console.error("Erro ao carregar galeria:", err);
    }
  }

  // ===== INIT =====

  document.addEventListener("DOMContentLoaded", () => {
    loadPartners();
    loadNews();
    loadGallery();
  });
})();
