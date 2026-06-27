-- ================================================================
-- Instituto D'Joana · Schema v2: Notícias e Parcerias
-- Executar no SQL Editor do Supabase (projeto D'Joana).
-- Idempotente: seguro rodar mais de uma vez.
-- ================================================================

-- 1) Tabela de notícias
create table if not exists public.news (
  id          uuid primary key default gen_random_uuid(),
  title       text not null,
  description text,
  content     text,
  image_url   text,
  tag         text,
  link        text,
  documents   jsonb default '[]'::jsonb,
  active      boolean default true,
  created_at  timestamptz default now()
);

alter table public.news enable row level security;

drop policy if exists "Public can read active news" on public.news;
create policy "Public can read active news"
on public.news for select to anon, authenticated
using (active = true or public.is_admin());

drop policy if exists "Admins can manage news" on public.news;
create policy "Admins can manage news"
on public.news for all to authenticated
using (public.is_admin())
with check (public.is_admin());

create index if not exists news_active_created_idx
  on public.news (active, created_at desc);

-- 2) Garantir bucket 'media' existe, público, 50 MB, sem restrição de tipo
insert into storage.buckets (id, name, public)
values ('media', 'media', true)
on conflict (id) do nothing;

update storage.buckets
set public = true,
    file_size_limit = 52428800,
    allowed_mime_types = null
where id = 'media';

-- 3) Policies de storage para o bucket 'media'
drop policy if exists "Public read media" on storage.objects;
create policy "Public read media"
on storage.objects for select to anon, authenticated
using (bucket_id = 'media');

drop policy if exists "Admins upload media" on storage.objects;
create policy "Admins upload media"
on storage.objects for insert to authenticated
with check (bucket_id = 'media' and public.is_admin());

drop policy if exists "Admins update media" on storage.objects;
create policy "Admins update media"
on storage.objects for update to authenticated
using (bucket_id = 'media' and public.is_admin())
with check (bucket_id = 'media' and public.is_admin());

drop policy if exists "Admins delete media" on storage.objects;
create policy "Admins delete media"
on storage.objects for delete to authenticated
using (bucket_id = 'media' and public.is_admin());
