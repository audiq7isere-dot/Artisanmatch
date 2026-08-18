create table if not exists public.tournaments (
 id uuid primary key default gen_random_uuid(),
 club_id uuid not null references public.profiles(id) on delete cascade,
 club_name text not null,
 title text not null,
 event_date date not null,
 address text,
 postal_code text,
 city text not null,
 categories text[] not null default '{}',
 description text,
 contact_email text,
 contact_phone text,
 status text not null default 'open' check (status in ('open','closed','cancelled')),
 created_at timestamptz not null default now()
);
alter table public.tournaments enable row level security;
drop policy if exists tournaments_read on public.tournaments;
create policy tournaments_read on public.tournaments for select to authenticated using (true);
drop policy if exists tournaments_insert on public.tournaments;
create policy tournaments_insert on public.tournaments for insert to authenticated with check (club_id=auth.uid() and exists(select 1 from public.profiles p where p.id=auth.uid() and p.account_type='recruiter'));
drop policy if exists tournaments_update on public.tournaments;
create policy tournaments_update on public.tournaments for update to authenticated using (club_id=auth.uid()) with check (club_id=auth.uid());
drop policy if exists tournaments_delete on public.tournaments;
create policy tournaments_delete on public.tournaments for delete to authenticated using (club_id=auth.uid());
create index if not exists tournaments_event_date_idx on public.tournaments(event_date);
create index if not exists tournaments_postal_code_idx on public.tournaments(postal_code);