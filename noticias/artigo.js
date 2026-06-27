/* ================================================================
   Instituto Social D'Joana · artigo.js
   Carrega notícia por ID da URL e renderiza na página.
   ================================================================ */

(function () {
  "use strict";

  var sb = null;
  try { sb = getSupabase(); } catch (e) {}

  var MONTHS = ["Jan","Fev","Mar","Abr","Mai","Jun","Jul","Ago","Set","Out","Nov","Dez"];

  function formatDate(str) {
    if (!str) return "";
    var d = new Date(str);
    return MONTHS[d.getMonth()] + " " + d.getFullYear();
  }

  function esc(v) {
    return String(v || "")
      .replace(/&/g,"&amp;").replace(/</g,"&lt;")
      .replace(/>/g,"&gt;").replace(/"/g,"&quot;");
  }

  function getId() {
    var params = new URLSearchParams(window.location.search);
    return params.get("id") || "";
  }

  function show(id) { var el = document.getElementById(id); if (el) el.style.display = ""; }
  function hide(id) { var el = document.getElementById(id); if (el) el.style.display = "none"; }
  function text(id, val) { var el = document.getElementById(id); if (el) el.textContent = val || ""; }
  function html(id, val) { var el = document.getElementById(id); if (el) el.innerHTML = val || ""; }
  function attr(id, a, val) { var el = document.getElementById(id); if (el) el.setAttribute(a, val || ""); }

  function renderContent(news) {
    // cover
    if (news.image_url) {
      var img = document.getElementById("artigo-cover");
      if (img) { img.src = getPublicUrl(news.image_url); img.alt = esc(news.title); }
      show("artigo-cover-wrap");
    }

    // meta
    text("artigo-tag",  news.tag || "Notícia");
    text("artigo-title", news.title);
    text("artigo-date",  formatDate(news.created_at));

    // set page title
    document.title = esc(news.title) + " · Instituto Social D'Joana";

    // body text: split by \n into <p> tags
    var content = (news.content || news.description || "").trim();
    if (content) {
      var paras = content.split(/\n{1,}/).filter(function(l){ return l.trim(); });
      html("artigo-text", paras.map(function(p){ return "<p>" + esc(p) + "</p>"; }).join(""));
    }

    // documents
    var docs = [];
    if (news.documents && Array.isArray(news.documents) && news.documents.length > 0) {
      docs = news.documents;
    } else if (news.doc_url) {
      docs = [{ label: news.doc_label || "Baixar documento", url: news.doc_url }];
    }
    if (docs.length > 0) {
      var listEl = document.getElementById("artigo-docs-list");
      if (listEl) {
        listEl.innerHTML = docs.map(function(d) {
          return '<a href="' + esc(d.url) + '" target="_blank" rel="noopener noreferrer" class="btn btn-primary artigo-doc-btn">' +
            '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>' +
            esc(d.label || "Baixar documento") + '</a>';
        }).join("");
      }
      show("artigo-docs");
    }

    // instagram link
    if (news.link) {
      attr("artigo-insta-link", "href", news.link);
      show("artigo-source");
    }

    hide("artigo-loading");
    show("artigo-content");
  }

  async function load() {
    var id = getId();
    if (!id) {
      hide("artigo-loading");
      show("artigo-error");
      return;
    }

    if (!sb) {
      hide("artigo-loading");
      show("artigo-error");
      return;
    }

    try {
      var resp = await sb.from("news").select("*").eq("id", id).maybeSingle();
      if (resp.error || !resp.data) {
        hide("artigo-loading");
        show("artigo-error");
        return;
      }
      renderContent(resp.data);
    } catch (e) {
      console.error("Erro ao carregar notícia:", e);
      hide("artigo-loading");
      show("artigo-error");
    }
  }

  document.addEventListener("DOMContentLoaded", load);
})();
