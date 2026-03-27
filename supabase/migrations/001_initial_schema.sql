-- =============================================================================
-- Flow — Initial Database Schema
-- =============================================================================
-- Run this migration in the Supabase SQL editor or via supabase db push.
-- Enables: Row-Level Security on all tables, Realtime on key tables.
-- =============================================================================

-- Extensions
create extension if not exists "uuid-ossp";
create extension if not exists "pg_cron";       -- for scheduled budget rollover jobs

-- =============================================================================
-- 1. HOUSEHOLDS
-- =============================================================================
create table if not exists public.households (
  id            uuid primary key default uuid_generate_v4(),
  name          text not null,
  invite_code   text not null unique,          -- 6-char alphanumeric
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

-- =============================================================================
-- 2. PROFILES  (extends Supabase auth.users 1-to-1)
-- =============================================================================
create table if not exists public.profiles (
  id            uuid primary key references auth.users(id) on delete cascade,
  email         text not null,
  full_name     text,
  avatar_url    text,
  household_id  uuid references public.households(id) on delete set null,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

-- =============================================================================
-- 3. BUDGET CATEGORIES
-- =============================================================================
create table if not exists public.budget_categories (
  id                   uuid primary key default uuid_generate_v4(),
  household_id         uuid not null references public.households(id) on delete cascade,
  name                 text not null,
  emoji                text,
  monthly_limit        numeric(12, 2) not null default 0,
  color                text,
  is_income            boolean not null default false,
  is_fixed             boolean not null default false,   -- fixed recurring bill
  fixed_day_of_month   int check (fixed_day_of_month between 1 and 31),
  created_at           timestamptz not null default now(),
  updated_at           timestamptz not null default now()
);

-- =============================================================================
-- 4. TRANSACTIONS
-- =============================================================================
do $$ begin
  create type public.transaction_type as enum ('debit', 'credit');
exception when duplicate_object then null;
end $$;

create table if not exists public.transactions (
  id                    uuid primary key default uuid_generate_v4(),
  household_id          uuid not null references public.households(id) on delete cascade,
  plaid_transaction_id  text unique,                     -- null for manual entries
  account_id            uuid,                            -- reserved for future Plaid link
  budget_category_id    uuid references public.budget_categories(id) on delete set null,
  name                  text not null,
  merchant_name         text,
  amount                numeric(12, 2) not null,         -- always positive; type field indicates direction
  type                  public.transaction_type not null default 'debit',
  date                  date not null,
  pending               boolean not null default false,
  logo_url              text,
  plaid_category        text[],
  is_manual             boolean not null default true,
  notes                 text,
  created_at            timestamptz not null default now(),
  updated_at            timestamptz not null default now()
);

-- Index for fast monthly queries
create index if not exists transactions_household_date_idx
  on public.transactions (household_id, date desc);

-- =============================================================================
-- 5. MONTHLY BUDGETS  (one row per household per month)
-- =============================================================================
create table if not exists public.monthly_budgets (
  id               uuid primary key default uuid_generate_v4(),
  household_id     uuid not null references public.households(id) on delete cascade,
  month            text not null,            -- YYYY-MM
  total_income     numeric(12, 2) not null default 0,
  total_limit      numeric(12, 2) not null default 0,
  total_spent      numeric(12, 2) not null default 0,
  rollover_amount  numeric(12, 2) not null default 0,   -- carries over from prior month
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now(),
  unique (household_id, month)
);

-- =============================================================================
-- 6. CALENDAR EVENTS
-- =============================================================================
do $$ begin
  create type public.event_source as enum ('manual', 'google', 'budget_bill', 'recurring');
exception when duplicate_object then null;
end $$;

create table if not exists public.calendar_events (
  id                  uuid primary key default uuid_generate_v4(),
  household_id        uuid not null references public.households(id) on delete cascade,
  user_id             uuid references public.profiles(id) on delete set null,
  title               text not null,
  description         text,
  start_at            timestamptz not null,
  end_at              timestamptz,
  all_day             boolean not null default false,
  source              public.event_source not null default 'manual',
  google_event_id     text,
  budget_category_id  uuid references public.budget_categories(id) on delete set null,
  amount              numeric(12, 2),
  color               text,
  created_at          timestamptz not null default now(),
  updated_at          timestamptz not null default now()
);

create index if not exists calendar_events_household_start_idx
  on public.calendar_events (household_id, start_at);

-- =============================================================================
-- 7. PLAID ITEMS  (reserved — not used until Plaid is integrated)
-- =============================================================================
create table if not exists public.plaid_items (
  id                uuid primary key default uuid_generate_v4(),
  household_id      uuid not null references public.households(id) on delete cascade,
  user_id           uuid not null references public.profiles(id) on delete cascade,
  plaid_item_id     text not null unique,
  institution_id    text,
  institution_name  text,
  -- access_token stored encrypted via Supabase Vault (never in plaintext)
  access_token_ref  text,                    -- vault secret name
  cursor            text,                    -- Plaid transactions sync cursor
  status            text not null default 'active',
  error_code        text,
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now()
);

-- =============================================================================
-- 8a. AUTO-CREATE PROFILE ON SIGN-UP
-- =============================================================================
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, email, full_name)
  values (
    new.id,
    new.email,
    new.raw_user_meta_data->>'full_name'
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- =============================================================================
-- 8. UPDATED_AT TRIGGER (shared function)
-- =============================================================================
create or replace function public.set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

do $$
declare
  t text;
begin
  foreach t in array array[
    'households','profiles','budget_categories','transactions',
    'monthly_budgets','calendar_events','plaid_items'
  ]
  loop
    execute format('drop trigger if exists set_updated_at on public.%I', t);
    execute format(
      'create trigger set_updated_at before update on public.%I
       for each row execute function public.set_updated_at()',
      t
    );
  end loop;
end;
$$;

-- =============================================================================
-- 9. ROW-LEVEL SECURITY
-- =============================================================================
alter table public.households        enable row level security;
alter table public.profiles          enable row level security;
alter table public.budget_categories enable row level security;
alter table public.transactions      enable row level security;
alter table public.monthly_budgets   enable row level security;
alter table public.calendar_events   enable row level security;
alter table public.plaid_items       enable row level security;

-- Helper: returns the household_id for the current authenticated user
create or replace function public.my_household_id()
returns uuid language sql stable security definer as $$
  select household_id from public.profiles where id = auth.uid();
$$;

-- Drop all policies first so this script is safe to re-run
drop policy if exists "members_read_household"  on public.households;
drop policy if exists "owner_update_household"  on public.households;
drop policy if exists "household_read_profiles" on public.profiles;
drop policy if exists "own_profile_write"        on public.profiles;

do $$
declare t text;
begin
  foreach t in array array[
    'budget_categories','transactions','monthly_budgets',
    'calendar_events','plaid_items'
  ]
  loop
    execute format('drop policy if exists "household_access" on public.%I', t);
  end loop;
end;
$$;

-- Households: any signed-in user can create; members can read/update their own
create policy "authenticated_insert_household" on public.households
  for insert with check (auth.uid() is not null);

create policy "members_read_household" on public.households
  for select using (id = public.my_household_id());

create policy "owner_update_household" on public.households
  for update using (id = public.my_household_id());

-- Profiles: users can read all profiles in same household; write own row
create policy "household_read_profiles" on public.profiles
  for select using (
    household_id = public.my_household_id()
    or id = auth.uid()
  );

create policy "own_profile_write" on public.profiles
  for all using (id = auth.uid());

-- Budget categories, transactions, monthly_budgets, calendar_events, plaid_items
do $$
declare t text;
begin
  foreach t in array array[
    'budget_categories','transactions','monthly_budgets',
    'calendar_events','plaid_items'
  ]
  loop
    execute format(
      'create policy "household_access" on public.%I
       for all using (household_id = public.my_household_id())',
      t
    );
  end loop;
end;
$$;

-- =============================================================================
-- 10. REALTIME — enable publications for live-sync tables
-- =============================================================================
do $$
begin
  alter publication supabase_realtime add table public.transactions;
exception when others then null; end $$;
do $$
begin
  alter publication supabase_realtime add table public.calendar_events;
exception when others then null; end $$;
do $$
begin
  alter publication supabase_realtime add table public.budget_categories;
exception when others then null; end $$;
do $$
begin
  alter publication supabase_realtime add table public.monthly_budgets;
exception when others then null; end $$;

-- =============================================================================
-- 11. SEED — default budget categories for new households (example)
-- =============================================================================
-- Call this function after creating a household to seed starter categories.
create or replace function public.seed_default_categories(p_household_id uuid)
returns void language plpgsql security definer as $$
begin
  insert into public.budget_categories
    (household_id, name, emoji, monthly_limit, is_income, is_fixed, fixed_day_of_month)
  values
    (p_household_id, 'Salary',        '💵', 0,    true,  false, null),
    (p_household_id, 'Rent',          '🏠', 0,    false, true,  1),
    (p_household_id, 'Groceries',     '🛒', 600,  false, false, null),
    (p_household_id, 'Dining Out',    '🍔', 300,  false, false, null),
    (p_household_id, 'Transport',     '🚗', 200,  false, false, null),
    (p_household_id, 'Subscriptions', '📱', 100,  false, true,  15),
    (p_household_id, 'Healthcare',    '💊', 150,  false, false, null),
    (p_household_id, 'Entertainment', '🎬', 200,  false, false, null),
    (p_household_id, 'Savings',       '🏦', 500,  false, false, null)
  on conflict do nothing;
end;
$$;
