// ============================================================
// SUPABASE CONFIG — Instituto Social D'Joana
// ============================================================
// INSTRUÇÕES:
// 1. Acesse https://supabase.com e crie um projeto
// 2. Substitua os valores abaixo pelos do seu projeto
// 3. Execute o SQL do arquivo setup.sql no SQL Editor do Supabase
// ============================================================

const SUPABASE_URL = "https://itprxlugmackvsjtfekv.supabase.co";
const SUPABASE_ANON_KEY = "sb_publishable_11fxO2xEu0yKUbJ8sXL00A_hmsJ8Kgr";

// Singleton do cliente Supabase
let _supabaseClient = null;

function getSupabase() {
  if (!_supabaseClient) {
    if (typeof window.supabase === "undefined") {
      console.error("Supabase JS não carregado. Adicione o CDN ao HTML.");
      return null;
    }
    _supabaseClient = window.supabase.createClient(
      SUPABASE_URL,
      SUPABASE_ANON_KEY,
    );
  }
  return _supabaseClient;
}

// Helpers para Storage
const STORAGE_BUCKET = "media";

function getPublicUrl(path) {
  if (!path) return "";
  if (path.startsWith("http")) return path;

  // Caminhos locais (assets/) — imagens que estão na pasta do projeto
  // Seed data e dados iniciais usam esses caminhos
  if (path.startsWith("assets/")) {
    // Se estamos em subpasta (/admin/), sobe um nível
    const inSubfolder = window.location.pathname.includes("/admin");
    return inSubfolder ? "../" + path : path;
  }

  // Caminhos do Supabase Storage (uploads feitos pelo painel admin)
  // Ex: "partners/1711234567-abc123.png"
  const sb = getSupabase();
  if (!sb) return path;
  const { data } = sb.storage.from(STORAGE_BUCKET).getPublicUrl(path);
  return data?.publicUrl || path;
}

async function uploadFile(file, folder = "uploads") {
  const sb = getSupabase();
  if (!sb) throw new Error("Supabase não configurado");

  const ext = file.name.split(".").pop().toLowerCase();
  const safeName = `${folder}/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;

  const { data, error } = await sb.storage
    .from(STORAGE_BUCKET)
    .upload(safeName, file, {
      cacheControl: "3600",
      upsert: false,
    });

  if (error) throw error;
  return data.path;
}

async function deleteFile(path) {
  if (!path || path.startsWith("http") || path.startsWith("assets/")) return;
  const sb = getSupabase();
  if (!sb) return;
  await sb.storage.from(STORAGE_BUCKET).remove([path]);
}
