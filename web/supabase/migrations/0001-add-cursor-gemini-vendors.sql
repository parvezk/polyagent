-- Allow cursor + gemini in the sessions.vendor CHECK constraint.
-- Run in the Supabase SQL editor against the existing project.
alter table public.sessions drop constraint if exists sessions_vendor_check;
alter table public.sessions
  add constraint sessions_vendor_check
  check (vendor in ('claude', 'jules', 'cursor', 'gemini'));
