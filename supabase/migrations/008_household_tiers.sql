-- =============================================================================
-- 008 – Household tiers: owner_id, is_premium, premium_tier, member cap
-- =============================================================================

-- 1. Add new columns to households
alter table public.households
  add column if not exists owner_id          uuid references auth.users(id) on delete set null,
  add column if not exists is_premium        boolean not null default false,
  add column if not exists premium_tier      text check (premium_tier in ('personal','family','power')),
  add column if not exists premium_expires_at timestamptz;

-- Index to quickly find all households owned by a user
create index if not exists households_owner_idx on public.households (owner_id);

-- 2. Backfill owner_id for existing households where possible:
--    the oldest profile in the household becomes the presumed owner.
update public.households h
set owner_id = (
  select p.id
  from public.profiles p
  where p.household_id = h.id
  order by p.created_at asc
  limit 1
)
where h.owner_id is null;

-- 3. Update RLS: household owner can read/update any household they own
drop policy if exists "owner_update_household"    on public.households;
drop policy if exists "owner_read_own_households" on public.households;

create policy "owner_update_household" on public.households
  for update using (owner_id = auth.uid() or id = public.my_household_id());

create policy "owner_read_own_households" on public.households
  for select using (owner_id = auth.uid() or id = public.my_household_id());

-- 4. CREATE HOUSEHOLD RPC (security definer so it can bypass RLS on first insert)
create or replace function public.create_household(p_name text)
returns json language plpgsql security definer set search_path = public as $$
declare
  v_invite_code  text;
  v_household_id uuid;
  v_owned_count  int;
  v_max_allowed  int := 1;
  v_result       json;
begin
  -- Determine how many households this user is allowed to own based on
  -- their highest active premium_tier across existing owned households.
  select coalesce(
    case max(premium_tier)
      when 'power'  then 999999
      when 'family' then 3
      else 1
    end, 1)
  into v_max_allowed
  from public.households
  where owner_id = auth.uid() and is_premium = true;

  -- Count currently owned households
  select count(*) into v_owned_count
  from public.households
  where owner_id = auth.uid();

  if v_owned_count >= v_max_allowed then
    if v_max_allowed = 1 then
      raise exception 'Your Personal plan includes 1 household. Upgrade to Family for up to 3 households or Power for unlimited.';
    elsif v_max_allowed = 3 then
      raise exception 'Your Family plan includes up to 3 households. Upgrade to Power for unlimited households.';
    end if;
  end if;

  -- Generate a unique 6-char invite code
  loop
    v_invite_code := upper(substring(md5(random()::text || clock_timestamp()::text) from 1 for 6));
    exit when not exists (select 1 from public.households where invite_code = v_invite_code);
  end loop;

  -- Create the household
  insert into public.households (name, invite_code, owner_id)
  values (p_name, v_invite_code, auth.uid())
  returning id into v_household_id;

  -- Link the creator's profile to this household
  update public.profiles
  set household_id = v_household_id
  where id = auth.uid();

  -- Return full household + members
  select row_to_json(h) into v_result
  from (
    select
      hh.id, hh.name, hh.invite_code, hh.owner_id,
      hh.is_premium, hh.premium_tier, hh.premium_expires_at,
      hh.created_at, hh.updated_at,
      coalesce(json_agg(p.* order by p.created_at) filter (where p.id is not null), '[]') as members
    from public.households hh
    left join public.profiles p on p.household_id = hh.id
    where hh.id = v_household_id
    group by hh.id
  ) h;

  return v_result;
end;
$$;

-- 5. JOIN HOUSEHOLD RPC with 6-member cap
create or replace function public.join_household(p_invite_code text)
returns json language plpgsql security definer set search_path = public as $$
declare
  v_household_id uuid;
  v_member_count int;
  v_result       json;
begin
  -- Lookup by invite code (case-insensitive)
  select id into v_household_id
  from public.households
  where invite_code = upper(trim(p_invite_code));

  if v_household_id is null then
    raise exception 'Invalid invite code. Check the code and try again.';
  end if;

  -- Enforce 6-member household cap
  select count(*) into v_member_count
  from public.profiles
  where household_id = v_household_id;

  if v_member_count >= 6 then
    raise exception 'This household already has 6 members (the maximum). Ask the owner to upgrade or remove a member.';
  end if;

  -- Join the household
  update public.profiles
  set household_id = v_household_id
  where id = auth.uid();

  -- Return full household + members
  select row_to_json(h) into v_result
  from (
    select
      hh.id, hh.name, hh.invite_code, hh.owner_id,
      hh.is_premium, hh.premium_tier, hh.premium_expires_at,
      hh.created_at, hh.updated_at,
      coalesce(json_agg(p.* order by p.created_at) filter (where p.id is not null), '[]') as members
    from public.households hh
    left join public.profiles p on p.household_id = hh.id
    where hh.id = v_household_id
    group by hh.id
  ) h;

  return v_result;
end;
$$;

-- 6. Helper: get the premium status of the current user's household
create or replace function public.my_household_is_premium()
returns boolean language sql stable security definer as $$
  select coalesce(
    (select h.is_premium
     from public.households h
     join public.profiles p on p.household_id = h.id
     where p.id = auth.uid()),
    false
  );
$$;
