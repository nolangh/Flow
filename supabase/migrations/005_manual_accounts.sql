create table if not exists public.manual_accounts (
  id            uuid primary key default gen_random_uuid(),
  household_id  uuid not null references public.households(id) on delete cascade,
  created_by    uuid not null references public.profiles(id) on delete cascade,
  name          text not null,
  institution   text,
  type          text not null default 'checking',
  subtype       text,
  mask          text,
  balance       numeric(12,2) not null default 0,
  currency      text not null default 'USD',
  color         text,
  is_active     boolean not null default true,
  notes         text,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

alter table public.manual_accounts enable row level security;

create policy "household can read manual accounts"
  on public.manual_accounts for select
  using (household_id = public.my_household_id());

create policy "household can insert manual accounts"
  on public.manual_accounts for insert
  with check (household_id = public.my_household_id());

create policy "household can update manual accounts"
  on public.manual_accounts for update
  using (household_id = public.my_household_id());

create policy "household can delete manual accounts"
  on public.manual_accounts for delete
  using (household_id = public.my_household_id());

create index if not exists manual_accounts_household_idx
  on public.manual_accounts (household_id);
