-- Add parent_task_id to support subtasks (one level deep)
alter table public.tasks
  add column if not exists parent_task_id uuid references public.tasks(id) on delete cascade;

create index if not exists tasks_parent_idx on public.tasks (parent_task_id);
