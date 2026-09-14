-- Activity log for all create / update / delete / settle actions

create table if not exists public.activity_logs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users(id) on delete cascade,
  action text not null, -- created | updated | deleted | settled
  entity_type text not null, -- contact | account | transaction | category
  entity_id text,
  title text not null,
  detail text,
  amount_paise bigint,
  meta jsonb default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists activity_logs_user_idx
  on public.activity_logs(user_id, created_at desc);

alter table public.activity_logs enable row level security;

create policy activity_own on public.activity_logs
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
