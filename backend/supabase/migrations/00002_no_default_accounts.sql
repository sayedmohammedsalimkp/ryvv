-- Optional: remove auto-seeded Cash/UPI/Bank for existing users (only empty ones)
-- Run in Supabase SQL editor if you already signed up before this change.

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

-- Delete default empty accounts (safe if opening 0 and no txns linked)
delete from public.accounts a
where a.name in ('Cash', 'UPI', 'Bank')
  and a.opening_balance = 0
  and not exists (
    select 1 from public.transactions t where t.account_id = a.id
  );
