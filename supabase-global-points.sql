-- FootShow classement global
-- Barème : vidéo +20, like vidéo reçu +2, concours +30, like concours reçu +3,
-- quiz +5 par bonne réponse (meilleur score par thème), jeu +1 par tranche de 10 pts du meilleur score.

create table if not exists public.quiz_scores (
  user_id uuid not null references public.profiles(id) on delete cascade,
  theme text not null,
  score integer not null default 0 check (score between 0 and 20),
  updated_at timestamptz not null default now(),
  primary key (user_id, theme)
);
alter table public.quiz_scores enable row level security;
drop policy if exists "quiz_scores_read" on public.quiz_scores;
create policy "quiz_scores_read" on public.quiz_scores for select to authenticated using (true);
drop policy if exists "quiz_scores_insert" on public.quiz_scores;
create policy "quiz_scores_insert" on public.quiz_scores for insert to authenticated with check (user_id = auth.uid());
drop policy if exists "quiz_scores_update" on public.quiz_scores;
create policy "quiz_scores_update" on public.quiz_scores for update to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());

create table if not exists public.game_scores (
  user_id uuid primary key references public.profiles(id) on delete cascade,
  best_score integer not null default 0,
  updated_at timestamptz not null default now()
);
alter table public.game_scores enable row level security;
drop policy if exists "game_scores_read" on public.game_scores;
create policy "game_scores_read" on public.game_scores for select to authenticated using (true);
drop policy if exists "game_scores_insert" on public.game_scores;
create policy "game_scores_insert" on public.game_scores for insert to authenticated with check (user_id = auth.uid());
drop policy if exists "game_scores_update" on public.game_scores;
create policy "game_scores_update" on public.game_scores for update to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());

create table if not exists public.contests (
  id uuid primary key default gen_random_uuid(), title text not null, slug text unique not null,
  description text not null, rules text not null, icon text, active boolean not null default true,
  created_at timestamptz not null default now()
);
create table if not exists public.contest_entries (
  id uuid primary key default gen_random_uuid(),
  contest_id uuid not null references public.contests(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  storage_path text not null, caption text, created_at timestamptz not null default now(),
  unique(contest_id,user_id)
);
create table if not exists public.contest_entry_likes (
  entry_id uuid not null references public.contest_entries(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  created_at timestamptz not null default now(), primary key(entry_id,user_id)
);

create or replace function public.get_global_ranking()
returns table (
  user_id uuid,
  full_name text,
  username text,
  video_points bigint,
  like_points bigint,
  contest_points bigint,
  quiz_points bigint,
  game_points bigint,
  total_points bigint
)
language sql
security definer
set search_path = public
as $$
with players as (
  select p.id, p.full_name, p.username
  from public.profiles p
  where coalesce(p.account_type,'player')='player'
),
video_stats as (
  select v.user_id, count(*)::bigint * 20 as pts
  from public.videos v group by v.user_id
),
video_like_stats as (
  select v.user_id, count(l.*)::bigint * 2 as pts
  from public.likes l join public.videos v on v.id=l.video_id
  group by v.user_id
),
contest_stats as (
  select e.user_id,
         (count(distinct e.id)::bigint * 30) + (count(l.*)::bigint * 3) as pts
  from public.contest_entries e
  left join public.contest_entry_likes l on l.entry_id=e.id
  group by e.user_id
),
quiz_stats as (
  select q.user_id, sum(q.score)::bigint * 5 as pts
  from public.quiz_scores q group by q.user_id
),
game_stats as (
  select g.user_id, floor(g.best_score / 10.0)::bigint as pts
  from public.game_scores g
)
select p.id,
       p.full_name,
       p.username,
       coalesce(v.pts,0)::bigint as video_points,
       coalesce(l.pts,0)::bigint as like_points,
       coalesce(c.pts,0)::bigint as contest_points,
       coalesce(q.pts,0)::bigint as quiz_points,
       coalesce(g.pts,0)::bigint as game_points,
       (coalesce(v.pts,0)+coalesce(l.pts,0)+coalesce(c.pts,0)+coalesce(q.pts,0)+coalesce(g.pts,0))::bigint as total_points
from players p
left join video_stats v on v.user_id=p.id
left join video_like_stats l on l.user_id=p.id
left join contest_stats c on c.user_id=p.id
left join quiz_stats q on q.user_id=p.id
left join game_stats g on g.user_id=p.id
order by total_points desc, p.full_name asc nulls last;
$$;

grant execute on function public.get_global_ranking() to authenticated;
