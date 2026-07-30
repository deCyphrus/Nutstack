-- Run this once in your Supabase project's SQL editor
-- (Project -> SQL Editor -> New query -> paste -> Run).

create table if not exists public.leaderboard (
  username text primary key,
  total_score bigint not null default 0,
  levels_played integer not null default 0,
  updated_at timestamptz not null default now()
);

alter table public.leaderboard enable row level security;

-- Anyone can read the leaderboard — it's meant to be public.
create policy "Leaderboard is publicly readable"
  on public.leaderboard for select
  using (true);

-- This is a nameplate-only arcade leaderboard with no login, so writes
-- are intentionally open: anyone can insert or update any row by
-- username. That's fine for a casual high-score list where the worst
-- case is someone spoofing a 3-letter tag, but do NOT reuse this table
-- or these policies for anything that holds real user data.
create policy "Anyone can insert a leaderboard row"
  on public.leaderboard for insert
  with check (true);

create policy "Anyone can update a leaderboard row"
  on public.leaderboard for update
  using (true);

-- Global level records (best move count per level across all players)
create table if not exists public.level_records (
  level integer primary key,
  record_moves integer not null,
  holder_username text not null default 'AAA',
  updated_at timestamptz not null default now()
);

alter table public.level_records enable row level security;

create policy "Level records are publicly readable"
  on public.level_records for select
  using (true);

create policy "Anyone can insert a level record"
  on public.level_records for insert
  with check (true);

create policy "Anyone can update a level record"
  on public.level_records for update
  using (true);

-- Player saves (cross-device progress sync per username)
create table if not exists public.player_saves (
  username text primary key,
  current_level integer not null default 1,
  completed_levels jsonb not null default '[]'::jsonb,
  level_records jsonb not null default '{}'::jsonb,
  user_level_scores jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now()
);

alter table public.player_saves enable row level security;

create policy "Player saves are publicly readable"
  on public.player_saves for select
  using (true);

create policy "Anyone can insert player saves"
  on public.player_saves for insert
  with check (true);

create policy "Anyone can update player saves"
  on public.player_saves for update
  using (true);

