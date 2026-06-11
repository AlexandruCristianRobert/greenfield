-- Greenfield — Supabase schema
-- Run in the Supabase SQL editor. One cloud snapshot per nickname (see design
-- doc: identity is an honor-system nickname; world-writable BY DESIGN).

create table if not exists public.saves (
  nickname_key text primary key,            -- normalized: trim+lower+collapse spaces
  nickname     text        not null,        -- display casing as entered
  save         jsonb       not null,        -- full versioned game save (v field inside)
  updated_at   timestamptz not null default now()
);

alter table public.saves enable row level security;

-- World-readable (feeds the future leaderboard) and world-writable (no auth by
-- design — anyone can play as any nickname, same as the sibling trainers).
drop policy if exists "saves_read_all" on public.saves;
create policy "saves_read_all"
  on public.saves for select
  to anon
  using (true);

drop policy if exists "saves_insert_valid" on public.saves;
create policy "saves_insert_valid"
  on public.saves for insert
  to anon
  with check (
    char_length(nickname) between 2 and 20
    and char_length(nickname_key) between 2 and 20
  );

drop policy if exists "saves_update_valid" on public.saves;
create policy "saves_update_valid"
  on public.saves for update
  to anon
  using (true)
  with check (char_length(nickname) between 2 and 20);
-- No DELETE policy → deletes denied for anon.
