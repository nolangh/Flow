-- =============================================================================
-- 009 – Shared lists (grocery, to-do, packing, etc.)
-- =============================================================================

-- Lists table
create table if not exists public.lists (
  id            uuid primary key default gen_random_uuid(),
  household_id  uuid not null references public.households(id) on delete cascade,
  created_by    uuid references public.profiles(id) on delete set null,
  name          text not null,
  emoji         text not null default '📋',
  color         text,
  is_archived   boolean not null default false,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

-- List items table
create table if not exists public.list_items (
  id            uuid primary key default gen_random_uuid(),
  list_id       uuid not null references public.lists(id) on delete cascade,
  household_id  uuid not null references public.households(id) on delete cascade,
  added_by      uuid references public.profiles(id) on delete set null,
  text          text not null,
  is_checked    boolean not null default false,
  checked_by    uuid references public.profiles(id) on delete set null,
  checked_at    timestamptz,
  position      integer not null default 0,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

-- RLS
alter table public.lists enable row level security;
alter table public.list_items enable row level security;

-- Lists policies
drop policy if exists "household_lists_select" on public.lists;
drop policy if exists "household_lists_insert" on public.lists;
drop policy if exists "household_lists_update" on public.lists;
drop policy if exists "household_lists_delete" on public.lists;

create policy "household_lists_select" on public.lists
  for select using (household_id = public.my_household_id());
create policy "household_lists_insert" on public.lists
  for insert with check (household_id = public.my_household_id());
create policy "household_lists_update" on public.lists
  for update using (household_id = public.my_household_id());
create policy "household_lists_delete" on public.lists
  for delete using (household_id = public.my_household_id());

-- List items policies
drop policy if exists "household_list_items_select" on public.list_items;
drop policy if exists "household_list_items_insert" on public.list_items;
drop policy if exists "household_list_items_update" on public.list_items;
drop policy if exists "household_list_items_delete" on public.list_items;

create policy "household_list_items_select" on public.list_items
  for select using (household_id = public.my_household_id());
create policy "household_list_items_insert" on public.list_items
  for insert with check (household_id = public.my_household_id());
create policy "household_list_items_update" on public.list_items
  for update using (household_id = public.my_household_id());
create policy "household_list_items_delete" on public.list_items
  for delete using (household_id = public.my_household_id());

-- updated_at triggers
drop trigger if exists lists_updated_at on public.lists;
create trigger lists_updated_at
  before update on public.lists
  for each row execute function public.touch_updated_at();

drop trigger if exists list_items_updated_at on public.list_items;
create trigger list_items_updated_at
  before update on public.list_items
  for each row execute function public.touch_updated_at();

-- Indexes
create index if not exists lists_household_idx on public.lists (household_id);
create index if not exists lists_archived_idx on public.lists (household_id, is_archived);
create index if not exists list_items_list_idx on public.list_items (list_id);
create index if not exists list_items_household_idx on public.list_items (household_id);
create index if not exists list_items_position_idx on public.list_items (list_id, position);
