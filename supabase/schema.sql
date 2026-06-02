-- Run once in Supabase SQL Editor (free tier at supabase.com)
-- Enables global leaderboard without your PC running.

create table if not exists public.scores (
  id uuid primary key default gen_random_uuid(),
  board_key text not null,
  player_id text not null,
  display_name text not null check (char_length(display_name) between 2 and 16),
  score integer not null check (score >= 0),
  stars smallint not null default 0 check (stars between 0 and 3),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (board_key, player_id)
);

create index if not exists scores_board_score_idx
  on public.scores (board_key, score desc);

alter table public.scores enable row level security;

create policy "Anyone can read scores"
  on public.scores for select using (true);

create policy "Anyone can insert own score row"
  on public.scores for insert with check (true);

create policy "Anyone can update score row"
  on public.scores for update using (true);
