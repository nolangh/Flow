import { create } from "zustand";
import { supabase } from "@/lib/supabase";
import { monthBounds } from "@/lib/utils";
import type { TransactionState, Transaction } from "@/types";

export const useTransactionStore = create<TransactionState>((set, get) => ({
  transactions: [],
  isLoading: false,
  error: null,

  fetchTransactions: async (month) => {
    set({ isLoading: true, error: null });
    try {
      const { data: session } = await supabase.auth.getSession();
      const userId = session.session?.user.id;
      if (!userId) throw new Error("Not authenticated");

      const { data: profile } = await supabase
        .from("profiles")
        .select("household_id")
        .eq("id", userId)
        .single();

      const { start, end } = monthBounds(month);

      const { data, error } = await supabase
        .from("transactions")
        .select(`
          *,
          category:budget_categories (
            id, name, emoji, color
          )
        `)
        .eq("household_id", profile?.household_id)
        .gte("date", start)
        .lte("date", end)
        .order("date", { ascending: false })
        .order("created_at", { ascending: false });

      if (error) throw error;
      set({ transactions: (data as Transaction[]) ?? [], isLoading: false });
    } catch (err: unknown) {
      set({ error: (err as Error).message, isLoading: false });
    }
  },

  addManualTransaction: async (data) => {
    set({ isLoading: true, error: null });
    try {
      const { data: session } = await supabase.auth.getSession();
      const userId = session.session?.user.id;
      const { data: profile } = await supabase
        .from("profiles")
        .select("household_id")
        .eq("id", userId!)
        .single();

      const { error } = await supabase.from("transactions").insert({
        ...data,
        household_id: profile?.household_id,
        is_manual: true,
        plaid_transaction_id: null,
      });
      if (error) throw error;

      const month = (data.date ?? new Date().toISOString()).substring(0, 7);
      await get().fetchTransactions(month);
    } catch (err: unknown) {
      set({ error: (err as Error).message, isLoading: false });
    }
  },

  updateTransaction: async (id, data) => {
    const { error } = await supabase
      .from("transactions")
      .update(data)
      .eq("id", id);
    if (error) throw error;

    set((state) => ({
      transactions: state.transactions.map((tx) =>
        tx.id === id ? { ...tx, ...data } : tx
      ),
    }));
  },

  deleteTransaction: async (id) => {
    const { error } = await supabase
      .from("transactions")
      .delete()
      .eq("id", id);
    if (error) throw error;
    set((state) => ({
      transactions: state.transactions.filter((tx) => tx.id !== id),
    }));
  },

  reassignCategory: async (id, categoryId) => {
    await get().updateTransaction(id, { budget_category_id: categoryId });
  },
}));
