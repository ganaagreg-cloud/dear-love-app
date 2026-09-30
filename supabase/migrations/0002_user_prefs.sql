-- Per-user one-time UI flags, e.g. { "editorIntro": true } once the editor intro was seen.
-- Written only by the server (service role, via src/lib/store.ts); owners may read their own row.
create table if not exists public.user_prefs (
  user_id    uuid primary key references auth.users (id) on delete cascade,
  flags      jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now()
);

alter table public.user_prefs enable row level security;

drop policy if exists "user_prefs: owner can read" on public.user_prefs;
create policy "user_prefs: owner can read" on public.user_prefs
  for select to authenticated using (auth.uid() = user_id);
-- (no insert/update/delete policies → only the service role can write)
