-- Tasks table — household shared todo list with assignees
-- Run in Supabase SQL Editor after 001_initial_schema.sql

create table if not exists public.tasks (
  id            uuid primary key default gen_random_uuid(),
  household_id  uuid not null references public.households(id) on delete cascade,
  created_by    uuid not null references public.profiles(id) on delete cascade,
  assigned_to   uuid references public.profiles(id) on delete set null,
  title         text not null,
  notes         text,
  due_date      date,
  priority      text not null default 'medium',  -- low | medium | high
  is_completed  boolean not null default false,
  completed_at  timestamptz,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

alter table public.tasks enable row level security;

create policy "Household members can read tasks"
  on public.tasks for select
  using (household_id = public.my_household_id());

create policy "Household members can insert tasks"
  on public.tasks for insert
  with check (household_id = public.my_household_id());

create policy "Household members can update tasks"
  on public.tasks for update
  using (household_id = public.my_household_id());

create policy "Household members can delete tasks"
  on public.tasks for delete
  using (household_id = public.my_household_id());

drop trigger if exists tasks_updated_at on public.tasks;
create trigger tasks_updated_at
  before update on public.tasks
  for each row execute function public.touch_updated_at();

create index if not exists tasks_household_idx   on public.tasks (household_id);
create index if not exists tasks_assigned_idx    on public.tasks (assigned_to);
create index if not exists tasks_due_date_idx    on public.tasks (due_date);
create index if not exists tasks_completed_idx   on public.tasks (is_completed);
