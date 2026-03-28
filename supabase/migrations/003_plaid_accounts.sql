-- Plaid connected accounts (cards / checking / savings per plaid_item)
-- Run in Supabase SQL Editor after 001_initial_schema.sql

create table if not exists public.plaid_accounts (
  id              uuid primary key default gen_random_uuid(),
  household_id    uuid not null references public.households(id) on delete cascade,
  plaid_item_id   uuid not null references public.plaid_items(id) on delete cascade,
  plaid_account_id text not null unique,
  name            text not null,
  official_name   text,
  type            text not null,          -- depository, credit, loan, investment
  subtype         text,                   -- checking, savings, credit card, etc.
  mask            text,                   -- last 4 digits
  current_balance numeric(12,2),
  available_balance numeric(12,2),
  iso_currency    text default 'USD',
  is_active       boolean not null default true,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);

alter table public.plaid_accounts enable row level security;

create policy "Household members can read accounts"
  on public.plaid_accounts for select
  using (household_id = public.my_household_id());

create policy "Household members can insert accounts"
  on public.plaid_accounts for insert
  with check (household_id = public.my_household_id());

create policy "Household members can update accounts"
  on public.plaid_accounts for update
  using (household_id = public.my_household_id());

create policy "Household members can delete accounts"
  on public.plaid_accounts for delete
  using (household_id = public.my_household_id());

create index if not exists plaid_accounts_household_idx on public.plaid_accounts (household_id);
create index if not exists plaid_accounts_item_idx on public.plaid_accounts (plaid_item_id);

-- Bill pay links: which account pays which budget category (fixed bill)
create table if not exists public.bill_pay_links (
  id                   uuid primary key default gen_random_uuid(),
  household_id         uuid not null references public.households(id) on delete cascade,
  budget_category_id   uuid not null references public.budget_categories(id) on delete cascade,
  plaid_account_id     uuid references public.plaid_accounts(id) on delete set null,
  manual_account_name  text,                 -- fallback when Plaid not linked
  manual_account_last4 text,
  manual_account_type  text default 'checking',
  reminder_days_before int not null default 3,
  auto_pay_enabled     boolean not null default false,
  confirmation_note    text,
  created_at           timestamptz not null default now(),
  updated_at           timestamptz not null default now(),
  unique (household_id, budget_category_id)
);

alter table public.bill_pay_links enable row level security;

create policy "Household members can manage bill pay links"
  on public.bill_pay_links for all
  using (household_id = public.my_household_id())
  with check (household_id = public.my_household_id());

create index if not exists bill_pay_links_household_idx on public.bill_pay_links (household_id);
