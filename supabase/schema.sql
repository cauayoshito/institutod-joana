-- ACEBA admin schema
-- Run this file in the Supabase SQL editor after creating the project.

create extension if not exists pgcrypto;

create table if not exists public.admin_users (
  id uuid primary key references auth.users(id) on delete cascade,
  email text unique not null,
  created_at timestamp default now()
);

create table if not exists public.partners (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  logo_url text,
  website_url text,
  is_active boolean default true,
  sort_order integer default 0,
  created_at timestamp default now()
);

create table if not exists public.projects (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  description text not null,
  image_url text,
  is_active boolean default true,
  created_at timestamp default now()
);

create table if not exists public.gallery_images (
  id uuid primary key default gen_random_uuid(),
  title text,
  category text,
  image_url text not null,
  is_active boolean default true,
  created_at timestamp default now()
);

create table if not exists public.transparency_documents (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  description text,
  file_url text not null,
  is_active boolean default true,
  created_at timestamp default now()
);

create table if not exists public.site_settings (
  id uuid primary key default gen_random_uuid(),
  key text unique not null,
  value text,
  updated_at timestamp default now()
);

create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.admin_users
    where id = auth.uid()
  );
$$;

create or replace function public.touch_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists site_settings_touch_updated_at on public.site_settings;
create trigger site_settings_touch_updated_at
before update on public.site_settings
for each row execute function public.touch_updated_at();

alter table public.admin_users enable row level security;
alter table public.partners enable row level security;
alter table public.projects enable row level security;
alter table public.gallery_images enable row level security;
alter table public.transparency_documents enable row level security;
alter table public.site_settings enable row level security;

drop policy if exists "Users can read own admin user" on public.admin_users;
create policy "Users can read own admin user"
on public.admin_users
for select
to authenticated
using (id = auth.uid());

drop policy if exists "Public can read active partners" on public.partners;
create policy "Public can read active partners"
on public.partners
for select
to anon, authenticated
using (is_active = true or public.is_admin());

drop policy if exists "Admins can manage partners" on public.partners;
create policy "Admins can manage partners"
on public.partners
for all
to authenticated
using (public.is_admin())
with check (public.is_admin());

drop policy if exists "Public can read active projects" on public.projects;
create policy "Public can read active projects"
on public.projects
for select
to anon, authenticated
using (is_active = true or public.is_admin());

drop policy if exists "Admins can manage projects" on public.projects;
create policy "Admins can manage projects"
on public.projects
for all
to authenticated
using (public.is_admin())
with check (public.is_admin());

drop policy if exists "Public can read active gallery images" on public.gallery_images;
create policy "Public can read active gallery images"
on public.gallery_images
for select
to anon, authenticated
using (is_active = true or public.is_admin());

drop policy if exists "Admins can manage gallery images" on public.gallery_images;
create policy "Admins can manage gallery images"
on public.gallery_images
for all
to authenticated
using (public.is_admin())
with check (public.is_admin());

drop policy if exists "Public can read active transparency documents" on public.transparency_documents;
create policy "Public can read active transparency documents"
on public.transparency_documents
for select
to anon, authenticated
using (is_active = true or public.is_admin());

drop policy if exists "Admins can manage transparency documents" on public.transparency_documents;
create policy "Admins can manage transparency documents"
on public.transparency_documents
for all
to authenticated
using (public.is_admin())
with check (public.is_admin());

drop policy if exists "Public can read site settings" on public.site_settings;
create policy "Public can read site settings"
on public.site_settings
for select
to anon, authenticated
using (true);

drop policy if exists "Admins can manage site settings" on public.site_settings;
create policy "Admins can manage site settings"
on public.site_settings
for all
to authenticated
using (public.is_admin())
with check (public.is_admin());

create index if not exists partners_active_sort_idx on public.partners (is_active, sort_order, name);
create index if not exists projects_active_created_idx on public.projects (is_active, created_at desc);
create index if not exists gallery_active_created_idx on public.gallery_images (is_active, created_at desc);
create index if not exists transparency_active_created_idx on public.transparency_documents (is_active, created_at desc);

insert into storage.buckets (id, name, public)
values
  ('logos', 'logos', true),
  ('gallery', 'gallery', true),
  ('documents', 'documents', true)
on conflict (id) do nothing;

drop policy if exists "Public can read ACEBA storage" on storage.objects;
create policy "Public can read ACEBA storage"
on storage.objects
for select
to anon, authenticated
using (bucket_id in ('logos', 'gallery', 'documents'));

drop policy if exists "Admins can upload ACEBA storage" on storage.objects;
create policy "Admins can upload ACEBA storage"
on storage.objects
for insert
to authenticated
with check (
  bucket_id in ('logos', 'gallery', 'documents')
  and public.is_admin()
);

drop policy if exists "Admins can update ACEBA storage" on storage.objects;
create policy "Admins can update ACEBA storage"
on storage.objects
for update
to authenticated
using (
  bucket_id in ('logos', 'gallery', 'documents')
  and public.is_admin()
)
with check (
  bucket_id in ('logos', 'gallery', 'documents')
  and public.is_admin()
);

drop policy if exists "Admins can delete ACEBA storage" on storage.objects;
create policy "Admins can delete ACEBA storage"
on storage.objects
for delete
to authenticated
using (
  bucket_id in ('logos', 'gallery', 'documents')
  and public.is_admin()
);
