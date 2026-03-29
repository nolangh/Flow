/**
 * useRealtimeSync
 *
 * Subscribes to Supabase Realtime channels for transactions,
 * calendar events, budget categories, and lists for the current household.
 * Calls the appropriate store refresh functions on any change so
 * both partners' devices update instantly.
 */
import { useEffect, useRef } from "react";
import type { RealtimeChannel } from "@supabase/supabase-js";
import { supabase, supabaseConfigured, subscribeToTransactions, subscribeToCalendarEvents, subscribeToBudgetCategories, subscribeToLists } from "@/lib/supabase";
import { useAuthStore } from "@/store/authStore";
import { useTransactionStore } from "@/store/transactionStore";
import { useBudgetStore } from "@/store/budgetStore";
import { useListStore } from "@/store/listStore";

export function useRealtimeSync() {
  const { household } = useAuthStore();
  const { fetchTransactions } = useTransactionStore();
  const { fetchCategories, currentMonth } = useBudgetStore();
  const { fetchLists } = useListStore();
  const channelsRef = useRef<RealtimeChannel[]>([]);

  useEffect(() => {
    if (!household?.id || !supabaseConfigured) return;

    const txChannel = subscribeToTransactions(household.id, () => {
      fetchTransactions(currentMonth);
    });

    const calChannel = subscribeToCalendarEvents(household.id, () => {
      // Calendar store refresh handled inside CalendarScreen
    });

    const catChannel = subscribeToBudgetCategories(household.id, () => {
      fetchCategories();
    });

    const listChannel = subscribeToLists(household.id, () => {
      fetchLists();
    });

    channelsRef.current = [txChannel, calChannel, catChannel, listChannel];

    return () => {
      channelsRef.current.forEach((ch) => supabase.removeChannel(ch));
      channelsRef.current = [];
    };
  }, [household?.id, currentMonth]);
}
