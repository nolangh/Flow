import "react-native-url-polyfill/auto";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL ?? "";
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY ?? "";

// Flag: true when real credentials are present
export const supabaseConfigured =
  supabaseUrl.length > 0 &&
  !supabaseUrl.includes("placeholder") &&
  supabaseAnonKey.length > 0 &&
  !supabaseAnonKey.includes("placeholder");

const effectiveUrl = supabaseConfigured
  ? supabaseUrl
  : "https://placeholder.supabase.co";
const effectiveKey = supabaseConfigured
  ? supabaseAnonKey
  : "placeholder-anon-key";

export const supabase = createClient(effectiveUrl, effectiveKey, {
  auth: {
    storage: AsyncStorage,
    autoRefreshToken: supabaseConfigured,
    persistSession: supabaseConfigured,
    detectSessionInUrl: false,
  },
  realtime: {
    params: { eventsPerSecond: 10 },
  },
  global: {
    fetch: supabaseConfigured
      ? undefined
      : () => Promise.reject(new Error("Supabase not configured")),
  },
});

// ─── Realtime channel helpers ──────────────────────────────────────────────

export function subscribeToTransactions(
  householdId: string,
  onUpdate: (payload: Record<string, unknown>) => void
) {
  if (!supabaseConfigured) return { unsubscribe: () => {} } as ReturnType<typeof supabase.channel>;
  return supabase
    .channel(`transactions:${householdId}`)
    .on(
      "postgres_changes",
      { event: "*", schema: "public", table: "transactions", filter: `household_id=eq.${householdId}` },
      onUpdate
    )
    .subscribe();
}

export function subscribeToCalendarEvents(
  householdId: string,
  onUpdate: (payload: Record<string, unknown>) => void
) {
  if (!supabaseConfigured) return { unsubscribe: () => {} } as ReturnType<typeof supabase.channel>;
  return supabase
    .channel(`calendar_events:${householdId}`)
    .on(
      "postgres_changes",
      { event: "*", schema: "public", table: "calendar_events", filter: `household_id=eq.${householdId}` },
      onUpdate
    )
    .subscribe();
}

export function subscribeToLists(
  householdId: string,
  onListChange: (listId: string | null) => void
) {
  if (!supabaseConfigured) return { unsubscribe: () => {} } as ReturnType<typeof supabase.channel>;
  return supabase
    .channel(`lists:${householdId}`)
    .on(
      "postgres_changes",
      { event: "*", schema: "public", table: "lists", filter: `household_id=eq.${householdId}` },
      (payload) => {
        // Pass the list id so the store can do a targeted single-list refresh
        const record = (payload.new ?? payload.old) as { id?: string } | null;
        onListChange(record?.id ?? null);
      }
    )
    .on(
      "postgres_changes",
      { event: "*", schema: "public", table: "list_items", filter: `household_id=eq.${householdId}` },
      (payload) => {
        const record = (payload.new ?? payload.old) as { list_id?: string } | null;
        onListChange(record?.list_id ?? null);
      }
    )
    .subscribe();
}

export function subscribeToBudgetCategories(
  householdId: string,
  onUpdate: (payload: Record<string, unknown>) => void
) {
  if (!supabaseConfigured) return { unsubscribe: () => {} } as ReturnType<typeof supabase.channel>;
  return supabase
    .channel(`budget_categories:${householdId}`)
    .on(
      "postgres_changes",
      { event: "*", schema: "public", table: "budget_categories", filter: `household_id=eq.${householdId}` },
      onUpdate
    )
    .subscribe();
}
