create table if not exists public.detections (
  id uuid primary key default gen_random_uuid(),
  club_id uuid not null references public.profiles(id) on delete cascade,
  club_name text not null,
  title text not null,
  event_date date not null,
  start_time time,
  address text,
  postal_code text,
  city text not null,
  categories text[] not null default '{}',
  positions text[] not null default '{}',
  description text,
  contact_email text,
  contact_phone text,
  status text not null default 'open' check (status in ('open','closed','cancelled')),
  created_at timestamptz not null default now()
);

create table if not exists public.detection_applications (
  id uuid primary key default gen_random_uuid(),
  detection_id uuid not null references public.detections(id) on delete cascade,
  player_id uuid not null references public.profiles(id) on delete cascade,
  note text,
  status text not null default 'pending' check (status in ('pending','accepted','rejected')),
  created_at timestamptz not null default now(),
  unique(detection_id, player_id)
);

alter table public.detections enable row level security;
alter table public.detection_applications enable row level security;

drop policy if exists detections_read on public.detections;
create policy detections_read on public.detections
for select to authenticated
using (true);

drop policy if exists detections_insert on public.detections;
create policy detections_insert on public.detections
for insert to authenticated
with check (
  club_id = auth.uid()
  and exists (
    select 1 from public.profiles p
    where p.id = auth.uid() and p.account_type = 'recruiter'
  )
);

drop policy if exists detections_update on public.detections;
create policy detections_update on public.detections
for update to authenticated
using (club_id = auth.uid())
with check (club_id = auth.uid());

drop policy if exists detections_delete on public.detections;
create policy detections_delete on public.detections
for delete to authenticated
using (club_id = auth.uid());

drop policy if exists detection_applications_insert on public.detection_applications;
create policy detection_applications_insert on public.detection_applications
for insert to authenticated
with check (
  player_id = auth.uid()
  and exists (
    select 1 from public.profiles p
    where p.id = auth.uid() and p.account_type = 'player'
  )
);

drop policy if exists detection_applications_read on public.detection_applications;
create policy detection_applications_read on public.detection_applications
for select to authenticated
using (
  player_id = auth.uid()
  or exists (
    select 1 from public.detections d
    where d.id = detection_id and d.club_id = auth.uid()
  )
);

drop policy if exists detection_applications_delete on public.detection_applications;
create policy detection_applications_delete on public.detection_applications
for delete to authenticated
using (player_id = auth.uid());

create index if not exists detections_event_date_idx on public.detections(event_date);
create index if not exists detections_postal_code_idx on public.detections(postal_code);
create index if not exists detection_applications_detection_idx on public.detection_applications(detection_id);
