create table if not exists public.messages (
  id uuid primary key default gen_random_uuid(),
  sender_id uuid not null references public.profiles(id) on delete cascade,
  receiver_id uuid not null references public.profiles(id) on delete cascade,
  body text not null check (char_length(body) between 1 and 2000),
  created_at timestamptz not null default now(),
  read_at timestamptz
);

create index if not exists messages_sender_idx
on public.messages(sender_id, created_at desc);

create index if not exists messages_receiver_idx
on public.messages(receiver_id, created_at desc);

alter table public.messages enable row level security;

drop policy if exists "messages_read_own" on public.messages;
create policy "messages_read_own"
on public.messages for select
to authenticated
using (sender_id = auth.uid() or receiver_id = auth.uid());

drop policy if exists "messages_send" on public.messages;
create policy "messages_send"
on public.messages for insert
to authenticated
with check (sender_id = auth.uid() and receiver_id <> auth.uid());

drop policy if exists "messages_mark_read" on public.messages;
create policy "messages_mark_read"
on public.messages for update
to authenticated
using (receiver_id = auth.uid())
with check (receiver_id = auth.uid());