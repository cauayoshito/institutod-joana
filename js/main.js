/* ================================================================
   ACEBA: main.js v2
   ================================================================ */

(function () {
  "use strict";

  const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const siteSettings = {
    phone: "(71) 99736-4451",
    whatsapp: "5571997364451",
    email: "contato@aceba.org.br",
    instagram: "#",
    facebook: "#",
    pix_key: "05.133.450/0001-76",
    address: "Rua São Bento, Quadra 3, Lote 13, Buris de Abrantes, Vila de Abrantes, Camaçari · Bahia · 42825-000",
  };

  function escapeHtml(value) {
    return String(value ?? "")
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;")
      .replaceAll('"', "&quot;")
      .replaceAll("'", "&#039;");
  }

  function normalizeWhatsApp(value) {
    const digits = String(value || "").replace(/\D/g, "");
    return digits || siteSettings.whatsapp;
  }

  function whatsappUrl(message) {
    const base = `https://wa.me/${normalizeWhatsApp(siteSettings.whatsapp)}`;
    return message ? `${base}?text=${encodeURIComponent(message)}` : base;
  }

  /* =============== HEADER · scroll state · on-hero =============== */
  const header = document.querySelector(".site-header");
  const hero = document.querySelector(".hero");

  function updateHeaderState() {
    const scrollY = window.scrollY || window.pageYOffset;
    const heroBottom = hero ? hero.offsetHeight : 600;

    if (scrollY > 8) {
      header.classList.add("is-scrolled");
    } else {
      header.classList.remove("is-scrolled");
    }

    // While the hero fills the viewport behind the header, use the light/transparent
    // variant of the nav. After scrolling past hero, fall back to the regular state.
    if (scrollY < heroBottom - 80) {
      header.classList.add("is-on-hero");
    } else {
      header.classList.remove("is-on-hero");
    }
  }

  window.addEventListener("scroll", updateHeaderState, { passive: true });
  window.addEventListener("resize", updateHeaderState, { passive: true });
  updateHeaderState();

  /* =============== MOBILE NAV =============== */
  const navToggle = document.querySelector(".nav-toggle");
  const mobileNav = document.querySelector(".mobile-nav");

  if (navToggle && mobileNav) {
    navToggle.addEventListener("click", () => {
      const isOpen = mobileNav.classList.toggle("is-open");
      navToggle.classList.toggle("is-open", isOpen);
      navToggle.setAttribute("aria-expanded", String(isOpen));
      navToggle.setAttribute("aria-label", isOpen ? "Fechar menu" : "Abrir menu");
      document.body.style.overflow = isOpen ? "hidden" : "";
    });

    mobileNav.querySelectorAll("a").forEach((link) => {
      link.addEventListener("click", () => {
        mobileNav.classList.remove("is-open");
        navToggle.classList.remove("is-open");
        navToggle.setAttribute("aria-expanded", "false");
        navToggle.setAttribute("aria-label", "Abrir menu");
        document.body.style.overflow = "";
      });
    });
  }

  /* =============== REVEAL ON SCROLL =============== */
  const reveals = document.querySelectorAll(".reveal");

  if ("IntersectionObserver" in window && !prefersReducedMotion) {
    const revealObserver = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("is-visible");
            revealObserver.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.08, rootMargin: "0px 0px -60px 0px" }
    );
    reveals.forEach((el) => revealObserver.observe(el));
  } else {
    reveals.forEach((el) => el.classList.add("is-visible"));
  }

  /* =============== COUNT-UP: corrigido =============== */
  function countUp(el) {
    // Use o data-count como fonte da verdade. Texto é fallback.
    const targetAttr = el.getAttribute("data-count");
    const prefix = el.getAttribute("data-prefix") || "";
    const target = targetAttr ? parseInt(targetAttr, 10) : parseInt((el.textContent || "0").replace(/\D/g, ""), 10);

    if (!Number.isFinite(target) || target <= 0) {
      el.textContent = prefix + (target || 0);
      return;
    }

    if (prefersReducedMotion) {
      el.textContent = prefix + target;
      return;
    }

    const duration = 1400;
    const start = performance.now();

    function update(now) {
      const elapsed = now - start;
      const progress = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3); // easeOutCubic
      const current = Math.round(eased * target);
      el.textContent = prefix + current;
      if (progress < 1) {
        requestAnimationFrame(update);
      } else {
        // Garante valor final exato
        el.textContent = prefix + target;
      }
    }

    requestAnimationFrame(update);
  }

  const statNums = document.querySelectorAll("[data-count]");

  if ("IntersectionObserver" in window) {
    const statsObserver = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            countUp(entry.target);
            statsObserver.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.4 }
    );
    statNums.forEach((el) => statsObserver.observe(el));
  } else {
    statNums.forEach((el) => {
      const target = parseInt(el.getAttribute("data-count") || "0", 10);
      const prefix = el.getAttribute("data-prefix") || "";
      el.textContent = prefix + target;
    });
  }

  /* =============== SUPPORT TABS =============== */
  const tabs = document.querySelectorAll(".support-tab");
  const panels = document.querySelectorAll(".support-panel");

  function activateTab(targetId) {
    tabs.forEach((t) => {
      const isMatch = t.getAttribute("data-tab") === targetId;
      t.classList.toggle("is-active", isMatch);
      t.setAttribute("aria-selected", String(isMatch));
    });
    panels.forEach((p) => {
      const isMatch = p.id === "panel-" + targetId;
      p.classList.toggle("is-active", isMatch);
      p.hidden = !isMatch;
    });
  }

  tabs.forEach((tab) => {
    tab.addEventListener("click", () => activateTab(tab.getAttribute("data-tab")));
  });

  /* =============== VALORES SUGERIDOS · WhatsApp dinâmico =============== */
  const chips = document.querySelectorAll(".suggested-chip");
  const donateAmount = document.getElementById("donateAmount");
  const whatsappDonate = document.getElementById("whatsappDonate");

  function updateDonationLink(value) {
    if (!whatsappDonate) return;
    const formatted = "R$ " + value;
    if (donateAmount) donateAmount.textContent = formatted;
    const message = `Olá, quero fazer uma doação de R$ ${value} para a ACEBA.`;
    whatsappDonate.href = whatsappUrl(message);
  }

  chips.forEach((chip) => {
    chip.addEventListener("click", () => {
      chips.forEach((c) => c.classList.remove("is-active"));
      chip.classList.add("is-active");
      updateDonationLink(chip.getAttribute("data-value"));
    });
  });

  /* =============== COPIAR PIX =============== */
  const pixCopy = document.getElementById("pixCopy");
  const pixKey = document.getElementById("pixKey");

  if (pixCopy && pixKey) {
    pixCopy.addEventListener("click", async () => {
      const text = pixKey.textContent.trim();
      try {
        if (navigator.clipboard && window.isSecureContext) {
          await navigator.clipboard.writeText(text);
        } else {
          // fallback
          const textarea = document.createElement("textarea");
          textarea.value = text;
          textarea.setAttribute("readonly", "");
          textarea.style.position = "absolute";
          textarea.style.left = "-9999px";
          document.body.appendChild(textarea);
          textarea.select();
          document.execCommand("copy");
          document.body.removeChild(textarea);
        }
        const span = pixCopy.querySelector("span");
        const original = span.textContent;
        pixCopy.classList.add("is-copied");
        span.textContent = "Copiado!";
        setTimeout(() => {
          pixCopy.classList.remove("is-copied");
          span.textContent = original;
        }, 2200);
      } catch (e) {
        console.error("Falha ao copiar:", e);
      }
    });
  }

  /* =============== CONTACT FORM =============== */
  const form = document.getElementById("contactForm");
  const formStatus = document.getElementById("formStatus");

  if (form) {
    form.addEventListener("submit", (e) => {
      e.preventDefault();
      const btn = form.querySelector("[type=submit]");

      // Validação básica
      const required = form.querySelectorAll("[required]");
      let firstInvalid = null;
      required.forEach((field) => {
        if (!field.value.trim()) {
          field.style.borderColor = "var(--terracotta)";
          if (!firstInvalid) firstInvalid = field;
        } else {
          field.style.borderColor = "";
        }
      });
      if (firstInvalid) {
        firstInvalid.focus();
        if (formStatus) {
          formStatus.style.color = "var(--terracotta)";
          formStatus.textContent = "Preencha os campos obrigatórios.";
        }
        return;
      }

      const getValue = (name) => {
        const field = form.elements[name];
        return field ? field.value.trim() : "";
      };

      const message = [
        "Olá, ACEBA! Vim pelo site e gostaria de enviar uma mensagem.",
        "",
        `Nome: ${getValue("nome")}`,
        `E-mail: ${getValue("email")}`,
        `Telefone/WhatsApp: ${getValue("telefone")}`,
        `Assunto: ${getValue("assunto")}`,
        "",
        "Mensagem:",
        getValue("mensagem"),
      ].join("\n");

      window.open(
        whatsappUrl(message),
        "_blank",
        "noopener"
      );
    });
  }

  /* =============== SUPABASE PUBLIC DATA =============== */
  function renderPublicPartners(partners) {
    const grid = document.querySelector(".partners-grid");
    if (!grid || !partners.length) return;

    grid.innerHTML = partners
      .map((partner) => {
        const name = escapeHtml(partner.name);
        const content = partner.logo_url
          ? `<img src="${escapeHtml(partner.logo_url)}" alt="${name}">`
          : `<span>${name}</span>`;
        const card = `<article class="partner-card${partner.logo_url ? " partner-logo-card" : ""}">${content}</article>`;
        return partner.website_url
          ? `<a class="partner-link" href="${escapeHtml(partner.website_url)}" target="_blank" rel="noopener noreferrer">${card}</a>`
          : card;
      })
      .join("");
  }

  function renderPublicGallery(images) {
    const grid = document.querySelector(".gallery-grid");
    if (!grid || !images.length) return;

    grid.innerHTML = images
      .map((image, index) => `
        <figure class="gallery-item${index === 0 ? " gallery-item--feature" : ""}">
          <img
            src="${escapeHtml(image.image_url)}"
            alt="${escapeHtml(image.title || image.category || "Imagem da ACEBA")}"
            loading="lazy"
            decoding="async"
          />
          <figcaption>
            <span class="gallery-meta">${escapeHtml(image.category || "ACEBA")}</span>
            <span class="gallery-text">${escapeHtml(image.title || "Registro institucional")}</span>
          </figcaption>
        </figure>
      `)
      .join("");
  }

  function renderPublicProjects(projects) {
    const grid = document.querySelector(".projects-grid");
    if (!grid || !projects.length) return;

    grid.innerHTML = projects
      .map((project, index) => `
        <article class="project-card${index === 0 ? " project-card--lead" : ""}">
          ${project.image_url ? `<img class="project-card-image" src="${escapeHtml(project.image_url)}" alt="${escapeHtml(project.title)}" loading="lazy" decoding="async" />` : ""}
          <header class="project-head">
            <span class="project-tag">Projeto ACEBA</span>
            <span class="project-num">${String(index + 1).padStart(2, "0")} / ${String(projects.length).padStart(2, "0")}</span>
          </header>
          <h3>${escapeHtml(project.title)}</h3>
          <p>${escapeHtml(project.description)}</p>
        </article>
      `)
      .join("");
  }

  function renderPublicDocuments(documents) {
    const grid = document.querySelector(".transparency-grid");
    if (!grid || !documents.length) return;

    grid.classList.add("has-documents");
    let docs = grid.querySelector(".transparency-docs");
    if (!docs) {
      docs = document.createElement("div");
      docs.className = "transparency-docs";
      grid.appendChild(docs);
    }

    docs.innerHTML = `
      <h3>Documentos institucionais</h3>
      <ul>
        ${documents
          .map((documentItem) => `
            <li>
              <a href="${escapeHtml(documentItem.file_url)}" class="doc-link" target="_blank" rel="noopener noreferrer">
                <svg width="18" height="18" aria-hidden="true">
                  <use href="#i-doc" />
                </svg>
                <div>
                  <strong>${escapeHtml(documentItem.title)}</strong>
                  <span>${escapeHtml(documentItem.description || "Documento institucional")}</span>
                </div>
                <svg width="14" height="14" class="doc-link-arrow" aria-hidden="true">
                  <use href="#i-arrow" />
                </svg>
              </a>
            </li>
          `)
          .join("")}
      </ul>
    `;
  }

  function applyPublicSettings(settings) {
    if (!settings.length) return;

    settings.forEach((item) => {
      if (Object.prototype.hasOwnProperty.call(siteSettings, item.key) && item.value) {
        siteSettings[item.key] = item.value;
      }
    });

    const pixKey = document.getElementById("pixKey");
    if (pixKey) pixKey.textContent = siteSettings.pix_key;

    document.querySelectorAll('a[href^="https://wa.me/"]').forEach((link) => {
      const url = new URL(link.href);
      const message = url.searchParams.get("text");
      link.href = message ? whatsappUrl(message) : whatsappUrl();
    });

    document.querySelectorAll('a[href^="tel:"]').forEach((link) => {
      link.href = `tel:+${normalizeWhatsApp(siteSettings.whatsapp)}`;
      link.textContent = siteSettings.phone;
    });

    document.querySelectorAll('a[href^="mailto:"]').forEach((link) => {
      link.href = `mailto:${siteSettings.email}`;
      link.textContent = siteSettings.email;
    });

    document.querySelectorAll('a[aria-label*="Instagram"]').forEach((link) => {
      if (siteSettings.instagram !== "#") link.href = siteSettings.instagram;
    });

    document.querySelectorAll('a[aria-label*="Facebook"]').forEach((link) => {
      if (siteSettings.facebook !== "#") link.href = siteSettings.facebook;
    });

    document.querySelectorAll('[data-site-setting="address"]').forEach((node) => {
      node.innerHTML = escapeHtml(siteSettings.address).replace(/\n/g, "<br>");
    });
  }

  async function loadSupabasePublicData() {
    if (!window.isSupabaseConfigured || !window.supabaseClient) return;

    try {
      const supabase = window.supabaseClient;

      const [partners, projects, gallery, documents, settings] = await Promise.all([
        supabase.from("partners").select("name,logo_url,website_url").eq("is_active", true).order("sort_order", { ascending: true }),
        supabase.from("projects").select("title,description,image_url").eq("is_active", true).order("created_at", { ascending: false }),
        supabase.from("gallery_images").select("title,category,image_url").eq("is_active", true).order("created_at", { ascending: false }),
        supabase.from("transparency_documents").select("title,description,file_url").eq("is_active", true).order("created_at", { ascending: false }),
        supabase.from("site_settings").select("key,value"),
      ]);

      if (!partners.error) renderPublicPartners(partners.data || []);
      if (!projects.error) renderPublicProjects(projects.data || []);
      if (!gallery.error) renderPublicGallery(gallery.data || []);
      if (!documents.error) renderPublicDocuments(documents.data || []);
      if (!settings.error) applyPublicSettings(settings.data || []);
    } catch (error) {
      console.warn("[ACEBA Supabase]", error);
    }
  }

  loadSupabasePublicData();

  /* =============== SMOOTH ANCHOR LINK BLUR =============== */
  document.querySelectorAll('a[href^="#"]').forEach((link) => {
    link.addEventListener("click", () => {
      // Garante que o foco volta ao topo da seção quando ancorar
      setTimeout(() => link.blur(), 100);
    });
  });

})();
