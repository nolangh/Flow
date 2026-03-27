import { create } from "zustand";
import { supabase, supabaseConfigured } from "@/lib/supabase";
import { generateInviteCode } from "@/lib/utils";
import type { AuthState, User, Household } from "@/types";

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  household: null,
  session: null,
  isLoading: false,
  error: null,

  signIn: async (email, password) => {
    set({ isLoading: true, error: null });
    try {
      const { data, error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) throw error;

      const fallbackUser: User = {
        id: data.user.id,
        email,
        full_name: data.user.user_metadata?.full_name ?? null,
        household_id: null,
        avatar_url: null,
        created_at: data.user.created_at,
      };

      let profile: User | null = null;
      let household = null;
      try {
        profile = await fetchProfile(data.user.id);
        household = profile?.household_id ? await fetchHousehold(profile.household_id) : null;
      } catch {
        // DB tables may not be set up yet; fall back to auth data
      }

      set({
        user: profile ?? fallbackUser,
        household,
        session: {
          access_token: data.session.access_token,
          refresh_token: data.session.refresh_token,
        },
        isLoading: false,
      });
    } catch (err: unknown) {
      set({ error: (err as Error).message, isLoading: false });
    }
  },

  signUp: async (email, password, fullName) => {
    set({ isLoading: true, error: null });
    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: { data: { full_name: fullName } },
      });
      if (error) throw error;
      if (!data.user) throw new Error("No user returned");

      // Build a user object from auth data immediately — DB may not exist yet
      const fallbackUser: User = {
        id: data.user.id,
        email,
        full_name: fullName,
        household_id: null,
        avatar_url: null,
        created_at: new Date().toISOString(),
      };

      // Try to upsert profile row — silently skip if table doesn't exist yet
      const profile = await (async () => {
        try {
          await supabase
            .from("profiles")
            .upsert({ id: data.user!.id, email, full_name: fullName }, { onConflict: "id" });
          const fetched = await fetchProfile(data.user!.id);
          return fetched ?? fallbackUser;
        } catch {
          return fallbackUser;
        }
      })();

      set({
        user: profile,
        session: data.session
          ? { access_token: data.session.access_token, refresh_token: data.session.refresh_token }
          : null,
        isLoading: false,
      });
    } catch (err: unknown) {
      set({ error: (err as Error).message, isLoading: false });
    }
  },

  signOut: async () => {
    await supabase.auth.signOut();
    set({ user: null, household: null, session: null });
  },

  refreshSession: async () => {
    if (!supabaseConfigured) return;
    const { data } = await supabase.auth.getSession().catch(() => ({ data: { session: null } }));
    if (!data.session) return;

    const authUser = data.session.user;
    const fallbackUser: User = {
      id: authUser.id,
      email: authUser.email ?? "",
      full_name: authUser.user_metadata?.full_name ?? null,
      household_id: null,
      avatar_url: null,
      created_at: authUser.created_at,
    };

    let profile: User | null = null;
    let household = null;
    try {
      profile = await fetchProfile(authUser.id);
      household = profile?.household_id ? await fetchHousehold(profile.household_id) : null;
    } catch {
      // DB tables not set up yet — use auth data as fallback
    }

    set({
      user: profile ?? fallbackUser,
      household,
      session: {
        access_token: data.session.access_token,
        refresh_token: data.session.refresh_token,
      },
    });
  },

  createHousehold: async (name) => {
    // Prefer store user; fall back to live session or getUser() call
    let user = get().user;
    if (!user) {
      // Try session first, then getUser() (works even when email confirm is pending)
      const { data: sessionData } = await supabase.auth.getSession();
      const authUser = sessionData.session?.user ?? (await supabase.auth.getUser()).data.user;
      if (!authUser) throw new Error("Not authenticated");
      user = {
        id: authUser.id,
        email: authUser.email ?? "",
        full_name: authUser.user_metadata?.full_name ?? null,
        household_id: null,
        avatar_url: null,
        created_at: authUser.created_at,
      };
      set({ user });
    }

    set({ isLoading: true, error: null });
    try {
      const inviteCode = generateInviteCode();
      const { data, error } = await supabase
        .from("households")
        .insert({ name, invite_code: inviteCode })
        .select()
        .single();
      if (error) throw error;

      await supabase
        .from("profiles")
        .update({ household_id: data.id })
        .eq("id", user.id);

      set({
        household: data as Household,
        user: { ...user, household_id: data.id },
        isLoading: false,
      });
    } catch (err: unknown) {
      set({ error: (err as Error).message, isLoading: false });
      throw err; // bubble up so household.tsx can show the real error
    }
  },

  joinHousehold: async (inviteCode) => {
    let user = get().user;
    if (!user) {
      const { data: sessionData } = await supabase.auth.getSession();
      const authUser = sessionData.session?.user ?? (await supabase.auth.getUser()).data.user;
      if (!authUser) throw new Error("Not authenticated");
      user = {
        id: authUser.id,
        email: authUser.email ?? "",
        full_name: authUser.user_metadata?.full_name ?? null,
        household_id: null,
        avatar_url: null,
        created_at: authUser.created_at,
      };
      set({ user });
    }

    set({ isLoading: true, error: null });
    try {
      const { data, error } = await supabase
        .from("households")
        .select()
        .eq("invite_code", inviteCode.toUpperCase())
        .single();
      if (error || !data) throw new Error("Invalid invite code");

      await supabase
        .from("profiles")
        .update({ household_id: data.id })
        .eq("id", user.id);

      set({
        household: data as Household,
        user: { ...user, household_id: data.id },
        isLoading: false,
      });
    } catch (err: unknown) {
      set({ error: (err as Error).message, isLoading: false });
      throw err; // bubble up so household.tsx can show the real error
    }
  },
}));

// ─── Helpers ───────────────────────────────────────────────────────────────

async function fetchProfile(userId: string): Promise<User | null> {
  const { data } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", userId)
    .single();
  return data as User | null;
}

async function fetchHousehold(householdId: string): Promise<Household | null> {
  const { data } = await supabase
    .from("households")
    .select("*, members:profiles(*)")
    .eq("id", householdId)
    .single();
  return data as Household | null;
}
