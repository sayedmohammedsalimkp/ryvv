-- Ryvv Money Phase 1 schema

create extension if not exists "pgcrypto";

create table if not exists public.users (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text not null default 'Ryvv user',
  email text,
  currency text not null default 'INR',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create type public.account_type as enum ('cash', 'upi', 'bank');
create type public.category_kind as enum ('income', 'expense');
create type public.txn_type as enum (
  'income', 'expense', 'gave', 'received', 'borrowed', 'lent', 'settle'
);

create table if not exists public.contacts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users(id) on delete cascade,
  name text not null,
  phone text,
  email text,
  note text,
  deleted_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists contacts_user_idx on public.contacts(user_id) where deleted_at is null;

create table if not exists public.accounts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users(id) on delete cascade,
  name text not null,
  type public.account_type not null default 'cash',
  opening_balance bigint not null default 0, -- paise
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists accounts_user_idx on public.accounts(user_id);

create table if not exists public.categories (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.users(id) on delete cascade,
  name text not null,
  kind public.category_kind not null,
  is_system boolean not null default false,
  created_at timestamptz not null default now()
);
create index if not exists categories_user_idx on public.categories(user_id);

create table if not exists public.transactions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users(id) on delete cascade,
  type public.txn_type not null,
  amount bigint not null check (amount > 0), -- paise
  txn_date date not null default current_date,
  note text,
  contact_id uuid references public.contacts(id) on delete set null,
  account_id uuid references public.accounts(id) on delete set null,
  category_id uuid references public.categories(id) on delete set null,
  settled_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists transactions_user_idx on public.transactions(user_id);
create index if not exists transactions_contact_idx on public.transactions(contact_id);
create index if not exists transactions_date_idx on public.transactions(user_id, txn_date desc);

-- Auto-create profile + defaults on signup
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  uid uuid := new.id;
begin
  insert into public.users (id, full_name, email)
  values (
    uid,
    coalesce(new.raw_user_meta_data->>'full_name', split_part(new.email, '@', 1), 'Ryvv user'),
    new.email
  )
  on conflict (id) do nothing;

  -- No default accounts. Money starts as On hand until user adds Cash/UPI/Bank etc.

  insert into public.categories (user_id, name, kind, is_system) values
    (uid, 'Salary', 'income', true),
    (uid, 'Other Income', 'income', true),
    (uid, 'Food', 'expense', true),
    (uid, 'Rent', 'expense', true),
    (uid, 'Travel', 'expense', true),
    (uid, 'Shopping', 'expense', true),
    (uid, 'Other', 'expense', true);

  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

alter table public.users enable row level security;
alter table public.contacts enable row level security;
alter table public.accounts enable row level security;
alter table public.categories enable row level security;
alter table public.transactions enable row level security;

create policy users_own on public.users for all using (auth.uid() = id) with check (auth.uid() = id);
create policy contacts_own on public.contacts for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy accounts_own on public.accounts for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy categories_own on public.categories for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy transactions_own on public.transactions for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
