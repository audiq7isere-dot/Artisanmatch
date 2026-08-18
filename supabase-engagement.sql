-- FootShow : Feed, défi du jour, statistiques et classement enrichi

create table if not exists public.video_views (
  video_id uuid not null references public.videos(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  view_day date not null default current_date,
  created_at timestamptz not null default now(),
  primary key (video_id, user_id, view_day)
);
alter table public.video_views enable row level security;
drop policy if exists "video_views_read" on public.video_views;
create policy "video_views_read" on public.video_views for select to authenticated using (true);
drop policy if exists "video_views_insert" on public.video_views;
create policy "video_views_insert" on public.video_views for insert to authenticated with check (user_id = auth.uid());

create table if not exists public.daily_challenge_entries (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  challenge_day date not null,
  challenge_key text not null,
  storage_path text not null,
  caption text,
  created_at timestamptz not null default now(),
  unique (user_id, challenge_day)
);
alter table public.daily_challenge_entries enable row level security;
drop policy if exists "daily_entries_read" on public.daily_challenge_entries;
create policy "daily_entries_read" on public.daily_challenge_entries for select to authenticated using (true);
drop policy if exists "daily_entries_insert" on public.daily_challenge_entries;
create policy "daily_entries_insert" on public.daily_challenge_entries for insert to authenticated with check (user_id = auth.uid());
drop policy if exists "daily_entries_delete" on public.daily_challenge_entries;
create policy "daily_entries_delete" on public.daily_challenge_entries for delete to authenticated using (user_id = auth.uid());

-- Recrée le classement global en ajoutant +40 points par défi quotidien réalisé.
drop function if exists public.get_global_ranking();
create function public.get_global_ranking()
returns table (
  user_id uuid,
  full_name text,
  username text,
  video_points bigint,
  like_points bigint,
  contest_points bigint,
  daily_points bigint,
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
daily_stats as (
  select d.user_id, count(*)::bigint * 40 as pts
  from public.daily_challenge_entries d group by d.user_id
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
       coalesce(d.pts,0)::bigint as daily_points,
       coalesce(q.pts,0)::bigint as quiz_points,
       coalesce(g.pts,0)::bigint as game_points,
       (coalesce(v.pts,0)+coalesce(l.pts,0)+coalesce(c.pts,0)+coalesce(d.pts,0)+coalesce(q.pts,0)+coalesce(g.pts,0))::bigint as total_points
from players p
left join video_stats v on v.user_id=p.id
left join video_like_stats l on l.user_id=p.id
left join contest_stats c on c.user_id=p.id
left join daily_stats d on d.user_id=p.id
left join quiz_stats q on q.user_id=p.id
left join game_stats g on g.user_id=p.id
order by total_points desc, p.full_name asc nulls last;
$$;
grant execute on function public.get_global_ranking() to authenticated;

-- Tableau de bord d'un joueur : rang global, catégorie, zone, vues, likes et activité.
drop function if exists public.get_player_stats(uuid);
create function public.get_player_stats(p_user_id uuid)
returns table (
  total_points bigint,
  global_rank bigint,
  category text,
  category_rank bigint,
  zone text,
  zone_rank bigint,
  total_views bigint,
  total_likes bigint,
  video_count bigint,
  daily_count bigint,
  contest_count bigint,
  quiz_points bigint,
  game_points bigint
)
language sql
security definer
set search_path = public
as $$
with ranking as (
  select r.*, row_number() over(order by r.total_points desc, r.full_name asc nulls last) as global_pos
  from public.get_global_ranking() r
),
ranked_profiles as (
  select r.user_id, r.total_points, r.global_pos, p.category,
         coalesce(p.department,'') as zone,
         row_number() over(partition by p.category order by r.total_points desc, r.full_name asc nulls last) as cat_pos,
         row_number() over(partition by coalesce(p.department,'') order by r.total_points desc, r.full_name asc nulls last) as zone_pos
  from ranking r join public.profiles p on p.id=r.user_id
),
views as (
  select v.user_id, count(vw.*)::bigint as n
  from public.videos v left join public.video_views vw on vw.video_id=v.id
  group by v.user_id
),
likes_count as (
  select v.user_id, count(l.*)::bigint as n
  from public.videos v left join public.likes l on l.video_id=v.id
  group by v.user_id
),
video_count as (
  select user_id, count(*)::bigint as n from public.videos group by user_id
),
daily_count as (
  select user_id, count(*)::bigint as n from public.daily_challenge_entries group by user_id
),
contest_count as (
  select user_id, count(*)::bigint as n from public.contest_entries group by user_id
),
quiz as (
  select user_id, (sum(score)*5)::bigint as pts from public.quiz_scores group by user_id
),
game as (
  select user_id, floor(best_score/10.0)::bigint as pts from public.game_scores
)
select rp.total_points,
       rp.global_pos,
       rp.category,
       rp.cat_pos,
       rp.zone,
       rp.zone_pos,
       coalesce(vw.n,0),
       coalesce(lc.n,0),
       coalesce(vc.n,0),
       coalesce(dc.n,0),
       coalesce(cc.n,0),
       coalesce(q.pts,0),
       coalesce(g.pts,0)
from ranked_profiles rp
left join views vw on vw.user_id=rp.user_id
left join likes_count lc on lc.user_id=rp.user_id
left join video_count vc on vc.user_id=rp.user_id
left join daily_count dc on dc.user_id=rp.user_id
left join contest_count cc on cc.user_id=rp.user_id
left join quiz q on q.user_id=rp.user_id
left join game g on g.user_id=rp.user_id
where rp.user_id=p_user_id;
$$;
grant execute on function public.get_player_stats(uuid) to authenticated;
