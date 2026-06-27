-- PolyAgent — sessions table + RLS.
-- Run in the Supabase SQL editor (Dashboard → SQL → New query) once the project exists.

create table if not exists public.sessions (
  id            text primary key,                -- vendor-native session id
  user_id       uuid not null references auth.users (id) on delete cascade,
  vendor        text not null check (vendor in ('claude', 'jules', 'cursor', 'gemini')),
  label         text,
  status        text not null default 'running',
  output_url    text,
  first_message text,
  dispatched_at timestamptz not null default now(),
  last_polled   timestamptz
);

create index if not exists sessions_user_id_idx on public.sessions (user_id, dispatched_at desc);

-- RLS: each user sees and manages only their own sessions.
alter table public.sessions enable row level security;

create policy "own sessions — select"
  on public.sessions for select using (auth.uid() = user_id);

create policy "own sessions — insert"
  on public.sessions for insert with check (auth.uid() = user_id);

create policy "own sessions — update"
  on public.sessions for update using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "own sessions — delete"
  on public.sessions for delete using (auth.uid() = user_id);
