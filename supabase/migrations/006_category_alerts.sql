-- Add user-configurable spend alert threshold to each budget category.
-- alert_threshold: integer 1–100 (percentage). NULL means no alert set.
alter table public.budget_categories
  add column if not exists alert_threshold integer check (alert_threshold between 1 and 100);
