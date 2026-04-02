-- =============================================================================
-- Recurrence: tasks repeat, lists reset on a schedule
-- =============================================================================

-- Tasks: repeat rule (creates a new task instance when completed)
alter table public.tasks
  add column if not exists recurrence_rule text
    check (recurrence_rule in ('daily', 'weekly', 'biweekly', 'monthly') or recurrence_rule is null);

-- Lists: reset schedule (unchecks all items on the configured cadence)
alter table public.lists
  add column if not exists recurrence_rule text
    check (recurrence_rule in ('daily', 'weekly', 'monthly') or recurrence_rule is null),
  add column if not exists recurrence_day_of_week  integer check (recurrence_day_of_week between 0 and 6),
  add column if not exists recurrence_day_of_month integer check (recurrence_day_of_month between 1 and 31),
  add column if not exists recurrence_last_reset   date;

comment on column public.tasks.recurrence_rule is
  'When set, completing the task spawns a new instance for the next occurrence.';
comment on column public.lists.recurrence_rule is
  'When set, all checked items are cleared on the configured cadence.';
comment on column public.lists.recurrence_last_reset is
  'Date the list was last auto-reset; used to detect when the next reset is due.';
