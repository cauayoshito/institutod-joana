/* ================================================================
   ACEBA Admin: painel administrativo
   - Sem import/export, sem type=module
   - Usa window.supabaseClient (apenas anon key)
   - CRUD real: partners / projects / gallery_images /
     transparency_documents / site_settings
   ================================================================ */

(function () {
  "use strict";

  /* --------------- CONSTANTES + STATE --------------- */
  var ADMIN_LOGIN = "login.html";
  var ADMIN_DASHBOARD = "dashboard.html";

  var supabase = window.supabaseClient || null;
  var isSupabaseConfigured = Boolean(window.isSupabaseConfigured) && Boolean(supabase);

  var MODULES = {
    partners: {
      title: "Parceiros",
      subtitle: "Empresas, instituições e apoiadores que caminham junto com a ACEBA.",
      table: "partners",
      newLabel: "+ Novo parceiro",
      orderBy: { column: "sort_order", ascending: true },
      hasActive: true,
      thumbField: "logo_url",
      titleField: "name",
      summary: function (row) {
        var bits = [];
        if (row.website_url) bits.push(row.website_url);
        if (typeof row.sort_order === "number") bits.push("ordem " + row.sort_order);
        return bits.join("  •  ");
      },
      fields: [
        { name: "name", label: "Nome do parceiro", type: "text", required: true, placeholder: "Ex.: Prefeitura de Camaçari" },
        { name: "logo_url", label: "URL do logo", type: "url", placeholder: "https://..." },
        { name: "website_url", label: "Site (URL)", type: "url", placeholder: "https://..." },
        { name: "sort_order", label: "Ordem de exibição", type: "number", default: 0 },
        { name: "is_active", label: "Ativo no site", type: "checkbox", default: true },
      ],
    },
    projects: {
      title: "Projetos",
      subtitle: "Iniciativas e programas em andamento.",
      table: "projects",
      newLabel: "+ Novo projeto",
      orderBy: { column: "created_at", ascending: false },
      hasActive: true,
      thumbField: "image_url",
      titleField: "title",
      summary: function (row) {
        return row.description || "";
      },
      fields: [
        { name: "title", label: "Título do projeto", type: "text", required: true },
        { name: "description", label: "Descrição", type: "textarea", required: true, rows: 4 },
        { name: "image_url", label: "Imagem (URL)", type: "url", placeholder: "https://..." },
        { name: "is_active", label: "Ativo no site", type: "checkbox", default: true },
      ],
    },
    gallery_images: {
      title: "Galeria",
      subtitle: "Fotos e registros de atividades.",
      table: "gallery_images",
      newLabel: "+ Nova imagem",
      orderBy: { column: "created_at", ascending: false },
      hasActive: true,
      thumbField: "image_url",
      titleField: "title",
      summary: function (row) {
        return row.category ? "Categoria: " + row.category : "Sem categoria";
      },
      fields: [
        { name: "title", label: "Título da imagem", type: "text" },
        { name: "category", label: "Categoria", type: "text", placeholder: "Ex.: educação, eventos, capoeira" },
        { name: "image_url", label: "URL da imagem", type: "url", required: true, placeholder: "https://..." },
        { name: "is_active", label: "Ativa no site", type: "checkbox", default: true },
      ],
    },
    transparency_documents: {
      title: "Transparência",
      subtitle: "Relatórios, prestações de contas e documentos públicos.",
      table: "transparency_documents",
      newLabel: "+ Novo documento",
      orderBy: { column: "created_at", ascending: false },
      hasActive: true,
      thumbField: null,
      titleField: "title",
      summary: function (row) {
        return row.description || row.file_url || "";
      },
      fields: [
        { name: "title", label: "Título do documento", type: "text", required: true },
        { name: "description", label: "Descrição", type: "textarea", rows: 3 },
        { name: "file_url", label: "URL do arquivo (PDF, etc.)", type: "url", required: true, placeholder: "https://..." },
        { name: "is_active", label: "Visível no site", type: "checkbox", default: true },
      ],
    },
    site_settings: {
      title: "Configurações",
      subtitle: "Dados de contato e informações institucionais usados em todo o site.",
      table: "site_settings",
      isSettings: true,
      settings: [
        { key: "phone", label: "Telefone", type: "text", placeholder: "(71) 99999-9999" },
        { key: "whatsapp", label: "WhatsApp (apenas números, com DDI)", type: "text", placeholder: "5571999999999" },
        { key: "email", label: "E-mail institucional", type: "email", placeholder: "contato@aceba.org.br" },
        { key: "instagram", label: "Instagram (URL)", type: "url", placeholder: "https://instagram.com/aceba" },
        { key: "facebook", label: "Facebook (URL)", type: "url", placeholder: "https://facebook.com/aceba" },
        { key: "pix_key", label: "Chave Pix", type: "text", placeholder: "CNPJ, e-mail, etc." },
        { key: "address", label: "Endereço completo", type: "textarea", rows: 3 },
      ],
    },
  };

  var SECTION_ORDER = [
    "dashboard",
    "partners",
    "projects",
    "gallery_images",
    "transparency_documents",
    "site_settings",
  ];

  var state = {
    activeSection: "dashboard",
    rows: [],
    counts: {
      partners: 0,
      projects: 0,
      gallery_images: 0,
      transparency_documents: 0,
    },
    modal: {
      isOpen: false,
      type: null,
      editingId: null,
    },
  };

  /* --------------- HELPERS BÁSICOS --------------- */
  var $ = function (sel, root) { return (root || document).querySelector(sel); };
  var $$ = function (sel, root) {
    return Array.prototype.slice.call((root || document).querySelectorAll(sel));
  };

  function isLoginPage() {
    return /login\.html$/i.test(window.location.pathname);
  }

  function isDashboardPage() {
    return /dashboard\.html$/i.test(window.location.pathname);
  }

  function redirect(path) { window.location.href = path; }

  function esc(value) {
    return String(value == null ? "" : value)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#039;");
  }

  function setLoginStatus(message, type) {
    var status = $("#loginStatus");
    if (!status) return;
    status.textContent = message || "";
    status.className = "admin-status" + (type ? " is-" + type : "");
  }

  /* --------------- TOAST --------------- */
  var toastTimer = null;
  function toast(message, type) {
    var el = $("#adminToast");
    if (!el) return;
    el.textContent = message;
    el.className = "admin-toast is-visible" + (type ? " is-" + type : "");
    if (toastTimer) window.clearTimeout(toastTimer);
    toastTimer = window.setTimeout(function () {
      el.classList.remove("is-visible");
    }, 3200);
  }

  /* --------------- SESSÃO --------------- */
  async function getSession() {
    if (!isSupabaseConfigured) return null;
    var resp = await supabase.auth.getSession();
    return resp && resp.data ? resp.data.session : null;
  }

  async function checkSession() {
    var session = await getSession();
    if (!session) {
      redirect(ADMIN_LOGIN);
      return null;
    }

    var resp = await supabase
      .from("admin_users")
      .select("id,email")
      .eq("id", session.user.id)
      .maybeSingle();

    if (resp.error || !resp.data) {
      try { await supabase.auth.signOut(); } catch (e) {}
      redirect(ADMIN_LOGIN);
      return null;
    }

    return session;
  }

  async function handleLogout() {
    try { await supabase.auth.signOut(); } catch (e) {}
    redirect(ADMIN_LOGIN);
  }

  /* --------------- LOGIN --------------- */
  async function initLogin() {
    var form = $("#loginForm");
    if (!form) return;

    if (!isSupabaseConfigured) {
      setLoginStatus(
        "Configure SUPABASE_URL e SUPABASE_ANON_KEY em js/supabase-client.js.",
        "error"
      );
      return;
    }

    var session = await getSession();
    if (session) {
      redirect(ADMIN_DASHBOARD);
      return;
    }

    form.addEventListener("submit", async function (event) {
      event.preventDefault();
      setLoginStatus("Entrando...");
      var email = form.elements.email.value.trim();
      var password = form.elements.password.value;

      var resp = await supabase.auth.signInWithPassword({ email: email, password: password });
      if (resp.error) {
        setLoginStatus("Não foi possível entrar. Confira e-mail, senha e autorização.", "error");
        return;
      }
      redirect(ADMIN_DASHBOARD);
    });
  }

  /* --------------- COUNTERS --------------- */
  async function refreshCounts() {
    if (!isSupabaseConfigured) return;
    var tables = ["partners", "projects", "gallery_images", "transparency_documents"];
    await Promise.all(
      tables.map(async function (table) {
        var resp = await supabase
          .from(table)
          .select("id", { count: "exact", head: true });
        if (!resp.error) {
          state.counts[table] = resp.count || 0;
        }
      })
    );
    renderCounts();
  }

  function renderCounts() {
    Object.keys(state.counts).forEach(function (key) {
      var el = document.querySelector('[data-count="' + key + '"]');
      if (el) el.textContent = String(state.counts[key]);
    });
  }

  /* --------------- DASHBOARD INICIAL --------------- */
  function loadDashboard() {
    var content = $("#adminContent");
    if (!content) return;

    $("#sectionTitle").textContent = "Início";
    $("#sectionSubtitle").textContent = "Resumo geral do conteúdo do site.";
    $("#primaryActionButton").classList.add("is-hidden");

    var c = state.counts;
    content.innerHTML =
      '<div class="admin-dashboard">' +
        '<div class="admin-summary-grid">' +
          summaryCard("Parceiros", c.partners, "partners") +
          summaryCard("Projetos", c.projects, "projects") +
          summaryCard("Galeria", c.gallery_images, "gallery_images") +
          summaryCard("Documentos", c.transparency_documents, "transparency_documents") +
        '</div>' +

        '<section class="admin-quick-actions">' +
          '<h2>Ações rápidas</h2>' +
          '<div class="admin-quick-grid">' +
            quickButton("Cadastrar parceiro", "Adicionar uma nova organização parceira", "partners") +
            quickButton("Publicar projeto", "Criar um novo projeto institucional", "projects") +
            quickButton("Subir foto", "Adicionar imagem à galeria", "gallery_images") +
            quickButton("Publicar documento", "Adicionar documento de transparência", "transparency_documents") +
            quickButton("Editar contato", "Atualizar telefone, e-mail e redes", "site_settings", true) +
          '</div>' +
        '</section>' +
      '</div>';

    $$('.admin-summary-card.is-clickable', content).forEach(function (card) {
      card.addEventListener("click", function () {
        switchSection(card.getAttribute("data-target"));
      });
    });

    $$('.admin-quick-button', content).forEach(function (btn) {
      btn.addEventListener("click", function () {
        var target = btn.getAttribute("data-target");
        var openCreate = btn.getAttribute("data-create") === "true";
        switchSection(target).then(function () {
          if (openCreate && target !== "site_settings") {
            openModal(target, null);
          }
        });
      });
    });
  }

  function summaryCard(label, value, target) {
    return (
      '<button type="button" class="admin-summary-card is-clickable" data-target="' + esc(target) + '">' +
        '<p class="label">' + esc(label) + '</p>' +
        '<p class="value">' + esc(value) + '</p>' +
        '<p class="delta">Ver e gerenciar →</p>' +
      '</button>'
    );
  }

  function quickButton(title, sub, target, isSettings) {
    return (
      '<button type="button" class="admin-quick-button" data-target="' + esc(target) + '" data-create="' + (isSettings ? "false" : "true") + '">' +
        '<span class="label">Ação</span>' +
        '<span class="title" style="display:block;font-weight:700;font-size:0.98rem;">' + esc(title) + '</span>' +
        '<span class="sub" style="display:block;color:var(--a-muted);font-size:0.84rem;margin-top:4px;">' + esc(sub) + '</span>' +
      '</button>'
    );
  }

  /* --------------- LISTAGEM POR MÓDULO --------------- */
  async function loadModule(moduleKey) {
    var config = MODULES[moduleKey];
    if (!config) return;

    var content = $("#adminContent");
    $("#sectionTitle").textContent = config.title;
    $("#sectionSubtitle").textContent = config.subtitle || "";
    var newBtn = $("#primaryActionButton");

    if (config.isSettings) {
      newBtn.classList.add("is-hidden");
      content.innerHTML = '<div class="admin-loading">Carregando configurações...</div>';
      await loadSettings();
      return;
    }

    newBtn.classList.remove("is-hidden");
    newBtn.textContent = config.newLabel || "+ Novo";
    newBtn.onclick = function () { openModal(moduleKey, null); };

    content.innerHTML = '<div class="admin-loading">Carregando ' + esc(config.title.toLowerCase()) + '...</div>';

    var query = supabase.from(config.table).select("*");
    if (config.orderBy) {
      query = query.order(config.orderBy.column, { ascending: config.orderBy.ascending });
    }

    var resp = await query;
    if (resp.error) {
      content.innerHTML =
        '<div class="admin-empty">' +
          '<div class="admin-empty-icon">!</div>' +
          '<h3>Erro ao carregar</h3>' +
          '<p>' + esc(resp.error.message || "Não foi possível ler do Supabase. Verifique RLS e permissões.") + '</p>' +
        '</div>';
      return;
    }

    state.rows = resp.data || [];

    // sincroniza contador da seção atual, se aplicável
    if (Object.prototype.hasOwnProperty.call(state.counts, moduleKey)) {
      state.counts[moduleKey] = state.rows.length;
      renderCounts();
    }

    renderRecordsList(moduleKey);
  }

  function renderRecordsList(moduleKey) {
    var config = MODULES[moduleKey];
    var content = $("#adminContent");

    if (!state.rows.length) {
      content.innerHTML =
        '<div class="admin-list-shell">' +
          '<div class="admin-list-head">' +
            '<h2>' + esc(config.title) + '<span class="admin-list-count">0</span></h2>' +
          '</div>' +
          '<div class="admin-empty">' +
            '<div class="admin-empty-icon">+</div>' +
            '<h3>Nada por aqui ainda</h3>' +
            '<p>Crie o primeiro registro de ' + esc(config.title.toLowerCase()) + ' para que apareça no site.</p>' +
            '<button type="button" class="admin-button" id="emptyCreateBtn">' + esc(config.newLabel) + '</button>' +
          '</div>' +
        '</div>';
      var emptyBtn = $("#emptyCreateBtn");
      if (emptyBtn) emptyBtn.addEventListener("click", function () { openModal(moduleKey, null); });
      return;
    }

    var rowsHtml = state.rows.map(function (row) {
      return renderRecordCard(moduleKey, row);
    }).join("");

    content.innerHTML =
      '<div class="admin-list-shell">' +
        '<div class="admin-list-head">' +
          '<h2>' + esc(config.title) + '<span class="admin-list-count">' + state.rows.length + '</span></h2>' +
        '</div>' +
        '<div class="admin-records-grid">' + rowsHtml + '</div>' +
      '</div>';

    bindRecordEvents(moduleKey);
  }

  function renderRecordCard(moduleKey, row) {
    var config = MODULES[moduleKey];
    var inactive = config.hasActive && row.is_active === false ? " is-inactive" : "";
    var title = row[config.titleField] || row.title || row.name || "Sem título";
    var summary = config.summary ? config.summary(row) : "";

    var thumb = "";
    if (config.thumbField && row[config.thumbField]) {
      thumb = '<div class="record-thumb"><img src="' + esc(row[config.thumbField]) + '" alt="" loading="lazy" onerror="this.parentNode.innerHTML=\'·\'"></div>';
    } else {
      var initial = (title || "·").trim().charAt(0).toUpperCase() || "·";
      thumb = '<div class="record-thumb">' + esc(initial) + '</div>';
    }

    var badge = "";
    if (config.hasActive) {
      badge = row.is_active === false
        ? '<span class="record-badge is-inactive">Inativo</span>'
        : '<span class="record-badge">Ativo</span>';
    }

    var toggleLabel = row.is_active === false ? "Ativar" : "Desativar";
    var actionsHtml =
      '<button type="button" class="record-action" data-action="edit" data-id="' + esc(row.id) + '">Editar</button>' +
      (config.hasActive
        ? '<button type="button" class="record-action" data-action="toggle" data-id="' + esc(row.id) + '">' + toggleLabel + '</button>'
        : "") +
      '<button type="button" class="record-action is-danger" data-action="delete" data-id="' + esc(row.id) + '">Excluir</button>';

    return (
      '<article class="record-card' + inactive + '" data-id="' + esc(row.id) + '">' +
        thumb +
        '<div class="record-body">' +
          '<p class="record-title">' + esc(title) + '</p>' +
          (summary ? '<p class="record-meta">' + esc(summary) + '</p>' : '') +
          badge +
        '</div>' +
        '<div class="record-actions">' + actionsHtml + '</div>' +
      '</article>'
    );
  }

  function bindRecordEvents(moduleKey) {
    $$('.record-action').forEach(function (btn) {
      btn.addEventListener("click", function () {
        var action = btn.getAttribute("data-action");
        var id = btn.getAttribute("data-id");
        var row = state.rows.find(function (r) { return String(r.id) === String(id); });
        if (!row) return;

        if (action === "edit") {
          openModal(moduleKey, row);
        } else if (action === "toggle") {
          toggleActive(MODULES[moduleKey].table, row.id, !!row.is_active);
        } else if (action === "delete") {
          if (window.confirm("Excluir este registro? Esta ação não pode ser desfeita.")) {
            deleteRecord(MODULES[moduleKey].table, row.id);
          }
        }
      });
    });
  }

  /* --------------- LOAD WRAPPERS (nomes pedidos) --------------- */
  function loadPartners() { return loadModule("partners"); }
  function loadProjects() { return loadModule("projects"); }
  function loadGallery()  { return loadModule("gallery_images"); }
  function loadDocuments() { return loadModule("transparency_documents"); }

  /* --------------- SETTINGS --------------- */
  async function loadSettings() {
    var content = $("#adminContent");
    var config = MODULES.site_settings;

    var resp = await supabase.from("site_settings").select("*");
    if (resp.error) {
      content.innerHTML =
        '<div class="admin-empty">' +
          '<div class="admin-empty-icon">!</div>' +
          '<h3>Erro ao carregar configurações</h3>' +
          '<p>' + esc(resp.error.message) + '</p>' +
        '</div>';
      return;
    }

    var existing = {};
    (resp.data || []).forEach(function (r) { existing[r.key] = r.value; });

    var fieldsHtml = config.settings.map(function (f) {
      var val = existing[f.key] != null ? existing[f.key] : "";
      var input;
      if (f.type === "textarea") {
        input = '<textarea name="' + esc(f.key) + '" rows="' + (f.rows || 3) + '" placeholder="' + esc(f.placeholder || "") + '">' + esc(val) + '</textarea>';
      } else {
        input = '<input type="' + esc(f.type) + '" name="' + esc(f.key) + '" value="' + esc(val) + '" placeholder="' + esc(f.placeholder || "") + '" />';
      }
      return '<label>' + esc(f.label) + input + '</label>';
    }).join("");

    content.innerHTML =
      '<form class="admin-settings" id="settingsForm" novalidate>' +
        '<h2>Dados institucionais</h2>' +
        '<p class="help">Esses valores são lidos pelo site público. Use exatamente como devem aparecer.</p>' +
        '<div class="admin-settings-grid">' + fieldsHtml + '</div>' +
        '<div class="admin-settings-actions">' +
          '<button type="submit" class="admin-button">Salvar configurações</button>' +
        '</div>' +
      '</form>';

    $("#settingsForm").addEventListener("submit", function (e) {
      e.preventDefault();
      saveSettings();
    });
  }

  async function saveSettings() {
    var form = $("#settingsForm");
    if (!form) return;
    var config = MODULES.site_settings;

    var rows = config.settings.map(function (f) {
      var el = form.elements[f.key];
      var val = el ? String(el.value || "").trim() : "";
      return { key: f.key, value: val };
    });

    var resp = await supabase
      .from("site_settings")
      .upsert(rows, { onConflict: "key" });

    if (resp.error) {
      toast("Erro ao salvar: " + resp.error.message, "error");
      return;
    }

    toast("Configurações salvas com sucesso", "success");
  }

  /* --------------- MODAL CRUD --------------- */
  function openModal(type, data) {
    var config = MODULES[type];
    if (!config || config.isSettings) return;

    state.modal.isOpen = true;
    state.modal.type = type;
    state.modal.editingId = data ? data.id : null;

    var modal = $("#adminModal");
    var title = $("#adminModalTitle");
    var form = $("#adminModalForm");
    var submit = $("#adminModalSubmit");

    title.textContent = data
      ? "Editar " + config.title.toLowerCase().replace(/s$/, "")
      : "Novo registro · " + config.title;

    form.innerHTML = renderModalForm(config, data);

    submit.onclick = function () {
      saveRecord(type);
    };

    form.onsubmit = function (e) {
      e.preventDefault();
      saveRecord(type);
    };

    modal.classList.add("is-open");
    modal.setAttribute("aria-hidden", "false");

    var first = form.querySelector("input, textarea, select");
    if (first && typeof first.focus === "function") {
      window.setTimeout(function () { first.focus(); }, 50);
    }
  }

  function closeModal() {
    var modal = $("#adminModal");
    state.modal.isOpen = false;
    state.modal.type = null;
    state.modal.editingId = null;
    if (modal) {
      modal.classList.remove("is-open");
      modal.setAttribute("aria-hidden", "true");
    }
    var form = $("#adminModalForm");
    if (form) form.innerHTML = "";
  }

  function renderModalForm(config, data) {
    return config.fields.map(function (f) {
      var current;
      if (data && Object.prototype.hasOwnProperty.call(data, f.name)) {
        current = data[f.name];
      } else {
        current = f.default != null ? f.default : "";
      }

      if (f.type === "textarea") {
        return (
          '<label>' + esc(f.label) +
            '<textarea name="' + esc(f.name) + '" rows="' + (f.rows || 4) + '" ' +
              (f.required ? "required" : "") +
              ' placeholder="' + esc(f.placeholder || "") + '">' + esc(current) + '</textarea>' +
          '</label>'
        );
      }

      if (f.type === "checkbox") {
        var checked = current === false ? "" : "checked";
        return (
          '<label style="display:flex; flex-direction:row; align-items:center; gap:10px; text-transform:none; letter-spacing:0; font-weight:600;">' +
            '<input type="checkbox" name="' + esc(f.name) + '" ' + checked + ' style="width:auto;min-height:auto;margin:0;" />' +
            '<span>' + esc(f.label) + '</span>' +
          '</label>'
        );
      }

      var val = current === 0 || current ? String(current) : "";
      return (
        '<label>' + esc(f.label) +
          '<input type="' + esc(f.type) + '" name="' + esc(f.name) + '" value="' + esc(val) + '" ' +
            (f.required ? "required" : "") +
            ' placeholder="' + esc(f.placeholder || "") + '" />' +
        '</label>'
      );
    }).join("");
  }

  function collectModalPayload() {
    var type = state.modal.type;
    var config = MODULES[type];
    var form = $("#adminModalForm");
    var payload = {};

    config.fields.forEach(function (f) {
      var el = form.elements[f.name];
      if (!el) return;

      if (f.type === "checkbox") {
        payload[f.name] = !!el.checked;
        return;
      }

      var raw = String(el.value || "").trim();

      if (f.type === "number") {
        if (raw === "") {
          payload[f.name] = f.default != null ? f.default : 0;
        } else {
          var n = Number(raw);
          payload[f.name] = isNaN(n) ? 0 : n;
        }
        return;
      }

      payload[f.name] = raw === "" ? null : raw;
    });

    return payload;
  }

  function validatePayload(config, payload) {
    var missing = [];
    config.fields.forEach(function (f) {
      if (!f.required) return;
      var val = payload[f.name];
      if (val == null || (typeof val === "string" && val.trim() === "")) {
        missing.push(f.label);
      }
    });
    return missing;
  }

  /* --- save dispatch + nomes pedidos --- */
  async function saveRecord(type) {
    var config = MODULES[type];
    if (!config) return;

    var payload = collectModalPayload();
    var missing = validatePayload(config, payload);
    if (missing.length) {
      toast("Preencha: " + missing.join(", "), "error");
      return;
    }

    var query;
    if (state.modal.editingId) {
      query = supabase.from(config.table).update(payload).eq("id", state.modal.editingId);
    } else {
      query = supabase.from(config.table).insert(payload);
    }

    var resp = await query;
    if (resp.error) {
      toast("Erro ao salvar: " + resp.error.message, "error");
      return;
    }

    toast(state.modal.editingId ? "Registro atualizado" : "Registro criado", "success");
    closeModal();
    await loadModule(type);
    await refreshCounts();
  }

  function savePartner()      { return saveRecord("partners"); }
  function saveProject()      { return saveRecord("projects"); }
  function saveGalleryImage() { return saveRecord("gallery_images"); }
  function saveDocument()     { return saveRecord("transparency_documents"); }

  /* --------------- DELETE / TOGGLE --------------- */
  async function deleteRecord(table, id) {
    var resp = await supabase.from(table).delete().eq("id", id);
    if (resp.error) {
      toast("Erro ao excluir: " + resp.error.message, "error");
      return;
    }
    toast("Registro excluído", "success");
    await loadModule(state.activeSection);
    await refreshCounts();
  }

  async function toggleActive(table, id, currentValue) {
    var resp = await supabase
      .from(table)
      .update({ is_active: !currentValue })
      .eq("id", id);

    if (resp.error) {
      toast("Erro ao atualizar status: " + resp.error.message, "error");
      return;
    }
    toast(!currentValue ? "Registro ativado" : "Registro desativado", "success");
    await loadModule(state.activeSection);
  }

  /* --------------- NAVEGAÇÃO ENTRE SEÇÕES --------------- */
  async function switchSection(section) {
    if (!section) return;
    if (SECTION_ORDER.indexOf(section) === -1) section = "dashboard";

    state.activeSection = section;

    $$('.admin-nav-item').forEach(function (btn) {
      btn.classList.toggle("is-active", btn.getAttribute("data-section") === section);
    });

    if (section === "dashboard") {
      loadDashboard();
      return;
    }

    await loadModule(section);
  }

  /* --------------- INIT DASHBOARD PAGE --------------- */
  async function initDashboard() {
    if (!isSupabaseConfigured) {
      var content = $("#adminContent");
      if (content) {
        content.innerHTML =
          '<div class="admin-empty">' +
            '<div class="admin-empty-icon">!</div>' +
            '<h3>Supabase não configurado</h3>' +
            '<p>Defina SUPABASE_URL e SUPABASE_ANON_KEY em <code>js/supabase-client.js</code> para usar o painel.</p>' +
          '</div>';
      }
      return;
    }

    var session = await checkSession();
    if (!session) return;

    var emailEl = $("#sessionEmail");
    if (emailEl) emailEl.textContent = session.user.email || "";

    // sidebar nav
    $$('.admin-nav-item').forEach(function (btn) {
      btn.addEventListener("click", function () {
        switchSection(btn.getAttribute("data-section"));
      });
    });

    // logout
    var logout = $("#logoutButton");
    if (logout) logout.addEventListener("click", handleLogout);

    // modal close hooks
    var modal = $("#adminModal");
    if (modal) {
      $$('[data-modal-close]', modal).forEach(function (el) {
        el.addEventListener("click", closeModal);
      });
    }
    document.addEventListener("keydown", function (e) {
      if (e.key === "Escape" && state.modal.isOpen) closeModal();
    });

    // counters + first paint
    await refreshCounts();
    await switchSection("dashboard");
  }

  /* --------------- EXPÕE FUNÇÕES NOMEADAS PEDIDAS --------------- */
  // Disponíveis em window.acebaAdmin para depuração e contrato com a spec.
  window.acebaAdmin = {
    checkSession: checkSession,
    handleLogout: handleLogout,
    switchSection: switchSection,
    loadDashboard: loadDashboard,
    loadPartners: loadPartners,
    loadProjects: loadProjects,
    loadGallery: loadGallery,
    loadDocuments: loadDocuments,
    loadSettings: loadSettings,
    savePartner: savePartner,
    saveProject: saveProject,
    saveGalleryImage: saveGalleryImage,
    saveDocument: saveDocument,
    saveSettings: saveSettings,
    deleteRecord: deleteRecord,
    toggleActive: toggleActive,
    openModal: openModal,
    closeModal: closeModal,
    toast: toast,
    esc: esc,
  };

  /* --------------- BOOTSTRAP --------------- */
  if (isLoginPage()) {
    initLogin();
  } else if (isDashboardPage()) {
    initDashboard();
  }
})();
