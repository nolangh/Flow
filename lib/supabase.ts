import "react-native-url-polyfill/auto";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY!;

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage: AsyncStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
  realtime: {
    params: {
      eventsPerSecond: 10,
    },
  },
});

// ─── Realtime channel helpers ──────────────────────────────────────────────

/**
 * Subscribe to all transaction inserts/updates for a household.
 * Calls `onUpdate` whenever a new row arrives so that UI can refresh.
 */
export function subscribeToTransactions(
  householdId: string,
  onUpdate: (payload: Record<string, unknown>) => void
) {
  return supabase
    .channel(`transactions:${householdId}`)
    .on(
      "postgres_changes",
      {
        event: "*",
        schema: "public",
        table: "transactions",
        filter: `household_id=eq.${householdId}`,
      },
      onUpdate
    )
    .subscribe();
}

/**
 * Subscribe to calendar event changes for a household.
 */
export function subscribeToCalendarEvents(
  householdId: string,
  onUpdate: (payload: Record<string, unknown>) => void
) {
  return supabase
    .channel(`calendar_events:${householdId}`)
    .on(
      "postgres_changes",
      {
        event: "*",
        schema: "public",
        table: "calendar_events",
        filter: `household_id=eq.${householdId}`,
      },
      onUpdate
    )
    .subscribe();
}

/**
 * Subscribe to budget category changes.
 */
export function subscribeToBudgetCategories(
  householdId: string,
  onUpdate: (payload: Record<string, unknown>) => void
) {
  return supabase
    .channel(`budget_categories:${householdId}`)
    .on(
      "postgres_changes",
      {
        event: "*",
        schema: "public",
        table: "budget_categories",
        filter: `household_id=eq.${householdId}`,
      },
      onUpdate
    )
    .subscribe();
}
