-- Dear Love platform — initial schema
-- Run in Supabase SQL editor (or `supabase db push`).
--
-- Security model
--   • Users can only SELECT their own pages/orders (RLS).
--   • Users can NEVER insert/update pages or orders directly — every write goes
--     through Next.js API routes that check auth + payment and use the service role.
--   • Public viewers never touch these tables; /p/[slug] reads published pages server-side.
--   • Storage: users may upload only into  media/<their uid>/<their PAID page id>/...

create extension if not exists pgcrypto;

-- ─────────────────────────────────────────── pages
create table if not exists public.pages (
  id            uuid primary key default gen_random_uuid(),
  user_id       uuid not null references auth.users (id) on delete cascade,
  template_id   text not null,
  title         text,
  slug          text unique,
  content       jsonb not null default '{}'::jsonb,
  status        text not null default 'pending_payment'
                check (status in ('pending_payment', 'paid', 'published')),
  paid_at       timestamptz,
  published_at  timestamptz,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);
create index if not exists pages_user_idx on public.pages (user_id, created_at desc);

-- ─────────────────────────────────────────── orders
create table if not exists public.orders (
  id                      uuid primary key default gen_random_uuid(),
  user_id                 uuid not null references auth.users (id) on delete cascade,
  page_id                 uuid not null references public.pages (id) on delete cascade,
  template_id             text not null,
  amount                  integer not null check (amount > 0),   -- whole MNT (₮)
  currency                text not null default 'MNT',
  status                  text not null default 'pending'
                          check (status in ('pending', 'paid', 'failed', 'canceled')),
  provider                text not null default 'wire',          -- 'wire' | 'mock'
  wire_payment_intent_id  text unique,
  checkout_url            text,
  paid_at                 timestamptz,
  created_at              timestamptz not null default now()
);
create index if not exists orders_user_idx on public.orders (user_id, created_at desc);
create index if not exists orders_page_idx on public.orders (page_id);

-- ─────────────────────────────────────────── webhook de-dup
create table if not exists public.webhook_events (
  id           text primary key,
  type         text not null,
  received_at  timestamptz not null default now()
);

-- updated_at trigger
create or replace function public.touch_updated_at() returns trigger
language plpgsql as $$ begin new.updated_at = now(); return new; end $$;
drop trigger if exists pages_touch on public.pages;
create trigger pages_touch before update on public.pages
  for each row execute function public.touch_updated_at();

-- ─────────────────────────────────────────── RLS
alter table public.pages          enable row level security;
alter table public.orders         enable row level security;
alter table public.webhook_events enable row level security;

drop policy if exists "pages: owner can read" on public.pages;
create policy "pages: owner can read" on public.pages
  for select to authenticated using (auth.uid() = user_id);

drop policy if exists "orders: owner can read" on public.orders;
create policy "orders: owner can read" on public.orders
  for select to authenticated using (auth.uid() = user_id);
-- (no insert/update/delete policies → only the service role can write)

-- ─────────────────────────────────────────── Storage
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'media', 'media', true, 10485760,  -- 10 MB
  array['image/jpeg','image/png','image/webp','image/gif','audio/mpeg','audio/mp4','audio/aac','audio/ogg','audio/wav','audio/x-m4a']
)
on conflict (id) do update
  set public = excluded.public,
      file_size_limit = excluded.file_size_limit,
      allowed_mime_types = excluded.allowed_mime_types;

-- helper: is <page_id> a PAID page owned by the caller?
create or replace function public.owns_paid_page(p_page text) returns boolean
language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from public.pages
    where id::text = p_page and user_id = auth.uid() and paid_at is not null
  );
$$;

drop policy if exists "media: owner upload to paid page" on storage.objects;
create policy "media: owner upload to paid page" on storage.objects
  for insert to authenticated
  with check (
    bucket_id = 'media'
    and (storage.foldername(name))[1] = auth.uid()::text
    and public.owns_paid_page((storage.foldername(name))[2])
  );

drop policy if exists "media: owner update" on storage.objects;
create policy "media: owner update" on storage.objects
  for update to authenticated
  using (bucket_id = 'media' and (storage.foldername(name))[1] = auth.uid()::text);

drop policy if exists "media: owner delete" on storage.objects;
create policy "media: owner delete" on storage.objects
  for delete to authenticated
  using (bucket_id = 'media' and (storage.foldername(name))[1] = auth.uid()::text);
-- public read comes from the bucket being public (needed so recipients can see photos)
