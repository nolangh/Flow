import { create } from "zustand";
import { supabase } from "@/lib/supabase";
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

      const profile = await fetchProfile(data.user.id);
      const household = profile?.household_id
        ? await fetchHousehold(profile.household_id)
        : null;

      set({
        user: profile,
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
        options: {
          data: { full_name: fullName },
        },
      });
      if (error) throw error;
      if (!data.user) throw new Error("No user returned");

      // Insert profile row
      const { error: profileError } = await supabase
        .from("profiles")
        .insert({ id: data.user.id, email, full_name: fullName });
      if (profileError) throw profileError;

      set({
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
    const { data } = await supabase.auth.getSession();
    if (!data.session) return;

    const profile = await fetchProfile(data.session.user.id);
    const household = profile?.household_id
      ? await fetchHousehold(profile.household_id)
      : null;

    set({
      user: profile,
      household,
      session: {
        access_token: data.session.access_token,
        refresh_token: data.session.refresh_token,
      },
    });
  },

  createHousehold: async (name) => {
    const user = get().user;
    if (!user) throw new Error("Not authenticated");

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
    }
  },

  joinHousehold: async (inviteCode) => {
    const user = get().user;
    if (!user) throw new Error("Not authenticated");

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
