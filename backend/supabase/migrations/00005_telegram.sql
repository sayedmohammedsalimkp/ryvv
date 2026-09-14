-- Telegram link, pending confirms, reminders, digest prefs

create table if not exists public.telegram_links (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users(id) on delete cascade,
  telegram_user_id bigint not null unique,
  telegram_chat_id bigint not null,
  telegram_username text,
  digest_enabled boolean not null default true,
  alert_expense_paise bigint not null default 500000, -- ₹5000
  linked_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create unique index if not exists telegram_links_user_uidx on public.telegram_links(user_id);
create index if not exists telegram_links_tg_idx on public.telegram_links(telegram_user_id);

create table if not exists public.telegram_link_codes (
  code text primary key,
  user_id uuid not null references public.users(id) on delete cascade,
  expires_at timestamptz not null,
  created_at timestamptz not null default now()
);
create index if not exists telegram_link_codes_user_idx on public.telegram_link_codes(user_id);

create table if not exists public.telegram_pending (
  id uuid primary key default gen_random_uuid(),
  telegram_user_id bigint not null,
  user_id uuid not null references public.users(id) on delete cascade,
  kind text not null, -- confirm_txn | settle | pick_contact | remind
  payload jsonb not null default '{}',
  expires_at timestamptz not null,
  created_at timestamptz not null default now()
);
create index if not exists telegram_pending_tg_idx
  on public.telegram_pending(telegram_user_id, created_at desc);

create table if not exists public.telegram_reminders (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users(id) on delete cascade,
  telegram_chat_id bigint not null,
  message text not null,
  due_at timestamptz not null,
  sent_at timestamptz,
  created_at timestamptz not null default now()
);
create index if not exists telegram_reminders_due_idx
  on public.telegram_reminders(due_at) where sent_at is null;

alter table public.telegram_links enable row level security;
alter table public.telegram_link_codes enable row level security;
alter table public.telegram_pending enable row level security;
alter table public.telegram_reminders enable row level security;
