import { create } from "zustand";
import { Platform } from "react-native";
import * as WebBrowser from "expo-web-browser";
import * as AppleAuthentication from "expo-apple-authentication";
import { makeRedirectUri } from "expo-auth-session";
import { supabase, supabaseConfigured } from "@/lib/supabase";
import {
  biometricAvailable,
  authenticateWithBiometric,
  loadCredentials,
} from "@/lib/biometrics";
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
      throw err; // let the screen show the error and not navigate
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
      throw err; // let the screen show the error and not navigate
    }
  },

  signInWithGoogle: async () => {
    set({ isLoading: true, error: null });
    try {
      const redirectUri = makeRedirectUri({ scheme: "honeydo", path: "auth/callback" });

      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: { redirectTo: redirectUri, skipBrowserRedirect: true },
      });
      if (error) {
        if (error.message?.toLowerCase().includes("provider") || error.message?.toLowerCase().includes("not enabled")) {
          throw new Error("Google sign-in is not yet configured. Please sign in with email.");
        }
        throw error;
      }
      if (!data.url) throw new Error("No OAuth URL returned");

      const result = await WebBrowser.openAuthSessionAsync(data.url, redirectUri);
      if (result.type !== "success") {
        // Browser dismissed — check if a session was established anyway (Android deep-link quirk)
        const { data: sessionData } = await supabase.auth.getSession();
        if (sessionData.session) {
          await get().refreshSession();
        }
        set({ isLoading: false });
        return;
      }

      const url = result.url;
      const hashParams = new URLSearchParams(url.split("#")[1] ?? "");
      const queryParams = new URLSearchParams(url.split("?")[1]?.split("#")[0] ?? "");

      // Supabase may use PKCE (code) or implicit (tokens) depending on project config
      const code = queryParams.get("code");
      let accessToken = hashParams.get("access_token") ?? queryParams.get("access_token");
      let refreshToken = hashParams.get("refresh_token") ?? queryParams.get("refresh_token");

      let authUser: { id: string; email?: string; user_metadata?: Record<string, string>; created_at: string } | undefined;

      if (code) {
        const { data: exchanged, error: exchangeErr } = await supabase.auth.exchangeCodeForSession(code);
        if (exchangeErr) throw exchangeErr;
        accessToken = exchanged.session!.access_token;
        refreshToken = exchanged.session!.refresh_token;
        authUser = exchanged.session!.user as typeof authUser;
      } else {
        if (!accessToken || !refreshToken) throw new Error("Missing tokens in redirect");
        const { data: sessionData, error: sessionError } = await supabase.auth.setSession({
          access_token: accessToken,
          refresh_token: refreshToken,
        });
        if (sessionError) throw sessionError;
        authUser = sessionData.session!.user as typeof authUser;
      }

      let profile: User | null = null;
      let household = null;
      try {
        profile = await fetchProfile(authUser!.id);
        household = profile?.household_id ? await fetchHousehold(profile.household_id) : null;
      } catch { /* ignore DB errors */ }

      const fallback: User = {
        id: authUser!.id,
        email: authUser!.email ?? "",
        full_name: authUser!.user_metadata?.full_name ?? authUser!.user_metadata?.name ?? null,
        household_id: null,
        avatar_url: authUser!.user_metadata?.avatar_url ?? null,
        created_at: authUser!.created_at,
      };

      set({ user: profile ?? fallback, household, session: { access_token: accessToken!, refresh_token: refreshToken! }, isLoading: false });
    } catch (err: unknown) {
      set({ error: (err as Error).message, isLoading: false });
      throw err;
    }
  },

  signInWithApple: async () => {
    if (Platform.OS !== "ios") throw new Error("Apple Sign-In is only available on iOS");
    set({ isLoading: true, error: null });
    try {
      const credential = await AppleAuthentication.signInAsync({
        requestedScopes: [
          AppleAuthentication.AppleAuthenticationScope.FULL_NAME,
          AppleAuthentication.AppleAuthenticationScope.EMAIL,
        ],
      });

      if (!credential.identityToken) throw new Error("No identity token from Apple");

      const { data, error } = await supabase.auth.signInWithIdToken({
        provider: "apple",
        token: credential.identityToken,
      });
      if (error) throw error;

      const authUser = data.user!;
      const fullName = credential.fullName
        ? [credential.fullName.givenName, credential.fullName.familyName]
            .filter(Boolean)
            .join(" ") || null
        : null;

      let profile: User | null = null;
      let household = null;
      try {
        profile = await fetchProfile(authUser.id);
        if (fullName && profile && !profile.full_name) {
          await supabase.from("profiles").update({ full_name: fullName }).eq("id", authUser.id);
          profile = { ...profile, full_name: fullName };
        }
        household = profile?.household_id ? await fetchHousehold(profile.household_id) : null;
      } catch { /* ignore */ }

      const fallback: User = {
        id: authUser.id,
        email: authUser.email ?? credential.email ?? "",
        full_name: fullName ?? authUser.user_metadata?.full_name ?? null,
        household_id: null,
        avatar_url: null,
        created_at: authUser.created_at,
      };

      set({
        user: profile ?? fallback,
        household,
        session: {
          access_token: data.session!.access_token,
          refresh_token: data.session!.refresh_token,
        },
        isLoading: false,
      });
    } catch (err: unknown) {
      const code = (err as { code?: string }).code;
      if (code === "ERR_REQUEST_CANCELED") {
        set({ isLoading: false });
        return;
      }
      set({ error: (err as Error).message, isLoading: false });
      throw err;
    }
  },

  signInWithBiometric: async () => {
    const available = await biometricAvailable();
    if (!available) throw new Error("Biometric authentication not available");

    const creds = await loadCredentials();
    if (!creds) throw new Error("No saved credentials. Please sign in with email first.");

    const passed = await authenticateWithBiometric("Sign in to Honeydo");
    if (!passed) throw new Error("Biometric authentication failed");

    await get().signIn(creds.email, creds.password);
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
      // Use a security-definer RPC to bypass RLS on the first household insert
      const { data, error } = await supabase
        .rpc("create_household", { p_name: name });
      if (error) throw error;

      const household = typeof data === "string" ? JSON.parse(data) : data;

      set({
        household: household as Household,
        user: { ...user, household_id: household.id },
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
        .rpc("join_household", { p_invite_code: inviteCode });
      if (error) throw error;

      const household = typeof data === "string" ? JSON.parse(data) : data;

      set({
        household: household as Household,
        user: { ...user, household_id: household.id },
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
