create table if not exists public.player_club_search (
 player_id uuid primary key references public.profiles(id) on delete cascade,
 active boolean not null default true,
 desired_level text,
 geographic_area text,
 position text,
 availability text,
 postal_code text,
 updated_at timestamptz not null default now()
);
alter table public.player_club_search enable row level security;
drop policy if exists player_club_search_read on public.player_club_search;
create policy player_club_search_read on public.player_club_search for select to authenticated using (true);
drop policy if exists player_club_search_write on public.player_club_search;
create policy player_club_search_write on public.player_club_search for all to authenticated using (player_id=auth.uid()) with check (player_id=auth.uid());

create table if not exists public.club_recruitments (
 id uuid primary key default gen_random_uuid(),
 club_id uuid not null references public.profiles(id) on delete cascade,
 club_name text not null,
 title text not null,
 position text,
 category text,
 level text,
 city text,
 postal_code text,
 availability text,
 description text,
 status text not null default 'open' check (status in ('open','closed','cancelled')),
 created_at timestamptz not null default now()
);
alter table public.club_recruitments enable row level security;
drop policy if exists club_recruitments_read on public.club_recruitments;
create policy club_recruitments_read on public.club_recruitments for select to authenticated using (true);
drop policy if exists club_recruitments_insert on public.club_recruitments;
create policy club_recruitments_insert on public.club_recruitments for insert to authenticated with check (club_id=auth.uid() and exists(select 1 from public.profiles p where p.id=auth.uid() and p.account_type='recruiter'));
drop policy if exists club_recruitments_update on public.club_recruitments;
create policy club_recruitments_update on public.club_recruitments for update to authenticated using (club_id=auth.uid()) with check (club_id=auth.uid());
drop policy if exists club_recruitments_delete on public.club_recruitments;
create policy club_recruitments_delete on public.club_recruitments for delete to authenticated using (club_id=auth.uid());

create table if not exists public.club_recruitment_applications (
 id uuid primary key default gen_random_uuid(),
 recruitment_id uuid not null references public.club_recruitments(id) on delete cascade,
 player_id uuid not null references public.profiles(id) on delete cascade,
 status text not null default 'pending' check (status in ('pending','accepted','rejected')),
 created_at timestamptz not null default now(),
 unique(recruitment_id,player_id)
);
alter table public.club_recruitment_applications enable row level security;
drop policy if exists club_recruitment_applications_insert on public.club_recruitment_applications;
create policy club_recruitment_applications_insert on public.club_recruitment_applications for insert to authenticated with check (player_id=auth.uid() and exists(select 1 from public.profiles p where p.id=auth.uid() and p.account_type='player'));
drop policy if exists club_recruitment_applications_read on public.club_recruitment_applications;
create policy club_recruitment_applications_read on public.club_recruitment_applications for select to authenticated using (player_id=auth.uid() or exists(select 1 from public.club_recruitments c where c.id=recruitment_id and c.club_id=auth.uid()));
create index if not exists player_club_search_active_idx on public.player_club_search(active);
create index if not exists club_recruitments_status_idx on public.club_recruitments(status);
create index if not exists club_recruitments_postal_idx on public.club_recruitments(postal_code);
create index if not exists club_recruitment_applications_recruitment_idx on public.club_recruitment_applications(recruitment_id);