-- Queue: let a user hide a run from the queue without deleting it.
-- Run in the Supabase SQL editor against the existing project.
alter table public.sessions add column if not exists dismissed_at timestamptz;
