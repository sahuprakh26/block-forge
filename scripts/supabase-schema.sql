-- Block Forge — free Supabase leaderboard (SQL Editor mein paste karo, Run)
create table if not exists public.lb_scores (
  board text not null,
  player_id text not null,
  name text not null check (char_length(name) between 2 and 16),
  score integer not null check (score >= 0 and score <= 250000),
  updated_at bigint not null,
  primary key (board, player_id)
);

create index if not exists lb_scores_board_score_idx
  on public.lb_scores (board, score desc, updated_at asc);

alter table public.lb_scores enable row level security;

-- Server uses service_role key only (Render env). Public read via your API, not direct DB.
create policy "no public access"
  on public.lb_scores
  for all
  using (false);
