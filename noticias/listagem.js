/* ================================================================
   Instituto Social D'Joana · listagem.js
   Carrega todas as notícias ativas e renderiza a listagem.
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

  function show(id) { var el = document.getElementById(id); if (el) el.style.display = ""; }
  function hide(id) { var el = document.getElementById(id); if (el) el.style.display = "none"; }

  async function load() {
    if (!sb) { hide("listagem-loading"); show("listagem-empty"); return; }

    try {
      var resp = await sb
        .from("news")
        .select("id,title,description,image_url,tag,created_at")
        .eq("active", true)
        .order("created_at", { ascending: false });

      hide("listagem-loading");

      if (resp.error || !resp.data || resp.data.length === 0) {
        show("listagem-empty");
        return;
      }

      var grid = document.getElementById("listagem-grid");
      if (!grid) return;

      grid.innerHTML = resp.data.map(function(n) {
        var img = n.image_url
          ? '<div class="news-card-media"><img src="' + esc(getPublicUrl(n.image_url)) + '" alt="' + esc(n.title) + '" loading="lazy" decoding="async" /></div>'
          : '';
        return '<article class="news-card">' +
          '<a href="artigo.html?id=' + esc(n.id) + '" class="news-card-link" aria-label="' + esc(n.title) + '">' +
          img +
          '<div class="news-card-body">' +
          '<span class="news-tag">' + esc(n.tag || "Notícia") + '</span>' +
          '<h2>' + esc(n.title) + '</h2>' +
          '<p>' + esc(n.description || "") + '</p>' +
          '<div class="news-footer">' +
          '<span class="news-date">' + formatDate(n.created_at) + '</span>' +
          '<span class="news-read-more">Ler matéria →</span>' +
          '</div>' +
          '</div>' +
          '</a>' +
          '</article>';
      }).join("");

      show("listagem-grid");
    } catch (e) {
      console.error("Erro ao carregar notícias:", e);
      hide("listagem-loading");
      show("listagem-empty");
    }
  }

  document.addEventListener("DOMContentLoaded", load);
})();
