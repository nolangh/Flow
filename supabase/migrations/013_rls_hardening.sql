-- =============================================================================
-- 013 — RLS hardening
--
-- Fixes six security gaps identified in migrations 001–012:
--
--  1. tasks       — INSERT could forge created_by to another user's ID
--  2. manual_accounts — INSERT could forge created_by
--  3. lists       — INSERT could forge created_by
--  4. list_items  — INSERT could forge added_by
--  5. plaid_items — blanket ALL policy let any household member delete
--                   another member's linked bank connection
--  6. households  — authenticated_insert_household allowed direct INSERT,
--                   bypassing the create_household RPC's member-cap check
-- =============================================================================

-- =============================================================================
-- 1. tasks — enforce created_by = auth.uid() on INSERT
-- =============================================================================
drop policy if exists "Household members can insert tasks" on public.tasks;

create policy "Household members can insert tasks"
  on public.tasks for insert
  with check (
    household_id = public.my_household_id()
    and created_by = auth.uid()
  );

-- =============================================================================
-- 2. manual_accounts — enforce created_by = auth.uid() on INSERT
-- =============================================================================
drop policy if exists "household can insert manual accounts" on public.manual_accounts;

create policy "household can insert manual accounts"
  on public.manual_accounts for insert
  with check (
    household_id = public.my_household_id()
    and created_by = auth.uid()
  );

-- =============================================================================
-- 3. lists — enforce created_by = auth.uid() on INSERT
-- =============================================================================
drop policy if exists "household_lists_insert" on public.lists;

create policy "household_lists_insert"
  on public.lists for insert
  with check (
    household_id = public.my_household_id()
    and (created_by = auth.uid() or created_by is null)
  );

-- =============================================================================
-- 4. list_items — enforce added_by = auth.uid() on INSERT
-- =============================================================================
drop policy if exists "household_list_items_insert" on public.list_items;

create policy "household_list_items_insert"
  on public.list_items for insert
  with check (
    household_id = public.my_household_id()
    and (added_by = auth.uid() or added_by is null)
  );

-- =============================================================================
-- 5. plaid_items — split blanket ALL policy into read (household) + write (owner)
--
-- Before: any household member could update or delete another member's
--         Plaid connection (their linked bank account).
-- After:  SELECT is household-wide (members can see linked accounts),
--         INSERT/UPDATE/DELETE require user_id = auth.uid().
-- =============================================================================
drop policy if exists "household_access" on public.plaid_items;

-- Any household member can see which accounts are linked
create policy "plaid_items_household_select"
  on public.plaid_items for select
  using (household_id = public.my_household_id());

-- Only the user who linked the account can insert/update/delete it
create policy "plaid_items_owner_insert"
  on public.plaid_items for insert
  with check (
    household_id = public.my_household_id()
    and user_id = auth.uid()
  );

create policy "plaid_items_owner_update"
  on public.plaid_items for update
  using (user_id = auth.uid());

create policy "plaid_items_owner_delete"
  on public.plaid_items for delete
  using (user_id = auth.uid());

-- =============================================================================
-- 6. households — remove direct INSERT policy, enforce use of create_household()
--
-- Before: any authenticated user could INSERT directly into households,
--         bypassing the RPC's household-limit enforcement.
-- After:  direct INSERT is blocked; the create_household() RPC (security
--         definer) is the only path to create a household.
--
-- NOTE: if your app calls supabase.from('households').insert() anywhere,
--       switch it to supabase.rpc('create_household', { p_name: '...' }).
-- =============================================================================
drop policy if exists "authenticated_insert_household" on public.households;

-- No replacement INSERT policy — create_household() handles this via
-- security definer, which bypasses RLS intentionally for that one function.

-- =============================================================================
-- Verification queries (run manually to confirm all tables have RLS enabled
-- and no tables have zero policies):
--
--   select tablename, rowsecurity
--   from pg_tables
--   where schemaname = 'public'
--   order by tablename;
--
--   select tablename, policyname, cmd, qual, with_check
--   from pg_policies
--   where schemaname = 'public'
--   order by tablename, cmd;
-- =============================================================================
