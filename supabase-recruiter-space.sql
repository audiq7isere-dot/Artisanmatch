create table if not exists public.recruiter_shortlist (
 id uuid primary key default gen_random_uuid(),
 recruiter_id uuid not null references public.profiles(id) on delete cascade,
 player_id uuid not null references public.profiles(id) on delete cascade,
 notes text,
 created_at timestamptz not null default now(),
 unique(recruiter_id,player_id)
);
alter table public.recruiter_shortlist enable row level security;
drop policy if exists recruiter_shortlist_read on public.recruiter_shortlist;
create policy recruiter_shortlist_read on public.recruiter_shortlist for select to authenticated using (recruiter_id=auth.uid());
drop policy if exists recruiter_shortlist_insert on public.recruiter_shortlist;
create policy recruiter_shortlist_insert on public.recruiter_shortlist for insert to authenticated with check (recruiter_id=auth.uid() and exists(select 1 from public.profiles p where p.id=auth.uid() and p.account_type='recruiter'));
drop policy if exists recruiter_shortlist_update on public.recruiter_shortlist;
create policy recruiter_shortlist_update on public.recruiter_shortlist for update to authenticated using (recruiter_id=auth.uid()) with check (recruiter_id=auth.uid());
drop policy if exists recruiter_shortlist_delete on public.recruiter_shortlist;
create policy recruiter_shortlist_delete on public.recruiter_shortlist for delete to authenticated using (recruiter_id=auth.uid());
create index if not exists recruiter_shortlist_recruiter_idx on public.recruiter_shortlist(recruiter_id);
create index if not exists recruiter_shortlist_player_idx on public.recruiter_shortlist(player_id);