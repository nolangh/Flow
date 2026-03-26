/**
 * useRealtimeSync
 *
 * Subscribes to Supabase Realtime channels for transactions,
 * calendar events, and budget categories for the current household.
 * Calls the appropriate store refresh functions on any change so
 * both partners' devices update instantly.
 */
import { useEffect, useRef } from "react";
import type { RealtimeChannel } from "@supabase/supabase-js";
import { supabase, subscribeToTransactions, subscribeToCalendarEvents, subscribeToBudgetCategories } from "@/lib/supabase";
import { useAuthStore } from "@/store/authStore";
import { useTransactionStore } from "@/store/transactionStore";
import { useBudgetStore } from "@/store/budgetStore";

export function useRealtimeSync() {
  const { household } = useAuthStore();
  const { fetchTransactions } = useTransactionStore();
  const { fetchCategories, currentMonth } = useBudgetStore();
  const channelsRef = useRef<RealtimeChannel[]>([]);

  useEffect(() => {
    if (!household?.id) return;

    const txChannel = subscribeToTransactions(household.id, () => {
      fetchTransactions(currentMonth);
    });

    const calChannel = subscribeToCalendarEvents(household.id, () => {
      // Calendar store refresh handled inside CalendarScreen
    });

    const catChannel = subscribeToBudgetCategories(household.id, () => {
      fetchCategories();
    });

    channelsRef.current = [txChannel, calChannel, catChannel];

    return () => {
      channelsRef.current.forEach((ch) => supabase.removeChannel(ch));
      channelsRef.current = [];
    };
  }, [household?.id, currentMonth]);
}
