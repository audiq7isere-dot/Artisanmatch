create table if not exists public.stages (
  id uuid primary key default gen_random_uuid(),
  club_id uuid not null references public.profiles(id) on delete cascade,
  club_name text not null,
  title text not null,
  event_date date not null,
  duration text not null,
  place text not null,
  postal_code text,
  city text not null,
  price numeric(10,2) not null default 0 check (price >= 0),
  categories text[] not null default '{}',
  description text,
  contact_email text,
  contact_phone text,
  status text not null default 'open' check (status in ('open','closed','cancelled')),
  created_at timestamptz not null default now()
);

alter table public.stages enable row level security;

drop policy if exists stages_read on public.stages;
create policy stages_read on public.stages
for select to authenticated
using (true);

drop policy if exists stages_insert on public.stages;
create policy stages_insert on public.stages
for insert to authenticated
with check (
  club_id = auth.uid()
  and exists (
    select 1 from public.profiles p
    where p.id = auth.uid() and p.account_type = 'recruiter'
  )
);

drop policy if exists stages_update on public.stages;
create policy stages_update on public.stages
for update to authenticated
using (club_id = auth.uid())
with check (club_id = auth.uid());

drop policy if exists stages_delete on public.stages;
create policy stages_delete on public.stages
for delete to authenticated
using (club_id = auth.uid());

create index if not exists stages_event_date_idx on public.stages(event_date);
create index if not exists stages_postal_code_idx on public.stages(postal_code);
