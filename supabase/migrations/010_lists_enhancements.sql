-- 010: enhance lists with starred, list types, item formatting
alter table public.lists
  add column if not exists is_starred  boolean not null default false,
  add column if not exists list_type   text    not null default 'checklist'
    check (list_type in ('checklist', 'bulleted', 'numbered'));

alter table public.list_items
  add column if not exists item_type  text not null default 'item'
    check (item_type in ('item', 'section')),
  add column if not exists note       text,
  add column if not exists quantity   text;

create index if not exists lists_starred_idx on public.lists (household_id, is_starred);
