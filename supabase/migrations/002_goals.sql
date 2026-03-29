-- Goals table for Honeydo premium tier
-- Run this in Supabase SQL Editor

create table if not exists public.goals (
  id             uuid primary key default gen_random_uuid(),
  household_id   uuid not null references public.households(id) on delete cascade,
  name           text not null,
  emoji          text not null default '🎯',
  target_amount  numeric(12, 2) not null default 0,
  current_amount numeric(12, 2) not null default 0,
  deadline       date,
  color          text not null default '#00D632',
  is_completed   boolean not null default false,
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now()
);

-- RLS
alter table public.goals enable row level security;

create policy "Household members can read goals"
  on public.goals for select
  using (household_id = public.my_household_id());

create policy "Household members can insert goals"
  on public.goals for insert
  with check (household_id = public.my_household_id());

create policy "Household members can update goals"
  on public.goals for update
  using (household_id = public.my_household_id());

create policy "Household members can delete goals"
  on public.goals for delete
  using (household_id = public.my_household_id());

-- Updated_at trigger
create or replace function public.touch_updated_at()
returns trigger language plpgsql as $$
begin new.updated_at = now(); return new; end;
$$;

drop trigger if exists goals_updated_at on public.goals;
create trigger goals_updated_at
  before update on public.goals
  for each row execute function public.touch_updated_at();

-- Indexes
create index if not exists goals_household_id_idx on public.goals (household_id);
create index if not exists goals_is_completed_idx on public.goals (is_completed);
