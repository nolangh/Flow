-- Add reminder_at to tasks table
alter table public.tasks
  add column if not exists reminder_at timestamptz;

comment on column public.tasks.reminder_at is
  'When to fire a local notification reminder for this task. Null = no reminder.';
