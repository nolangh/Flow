import { create } from "zustand";
import { supabase } from "@/lib/supabase";
import { currentYearMonth, monthBounds } from "@/lib/utils";
import type { BudgetState, BudgetCategory, MonthlyBudget } from "@/types";

export const useBudgetStore = create<BudgetState>((set, get) => ({
  currentMonth: currentYearMonth(),
  monthlyBudget: null,
  categories: [],
  isLoading: false,
  error: null,

  setCurrentMonth: (month) => {
    set({ currentMonth: month });
    get().fetchMonthlyBudget(month);
  },

  fetchCategories: async () => {
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

      const { data, error } = await supabase
        .from("budget_categories")
        .select("*")
        .eq("household_id", profile?.household_id)
        .order("is_income", { ascending: false })
        .order("name");

      if (error) throw error;
      set({ categories: (data as BudgetCategory[]) ?? [], isLoading: false });
    } catch (err: unknown) {
      set({ error: (err as Error).message, isLoading: false });
    }
  },

  fetchMonthlyBudget: async (month) => {
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

      const householdId = profile?.household_id;
      const { start, end } = monthBounds(month);

      // Fetch or upsert monthly budget row
      let { data: budget } = await supabase
        .from("monthly_budgets")
        .select("*")
        .eq("household_id", householdId)
        .eq("month", month)
        .single();

      if (!budget) {
        const { data: newBudget, error } = await supabase
          .from("monthly_budgets")
          .insert({ household_id: householdId, month, total_income: 0, total_limit: 0, total_spent: 0, rollover_amount: 0 })
          .select()
          .single();
        if (error) throw error;
        budget = newBudget;
      }

      // Fetch categories with spending sums for the month
      const { data: categories } = await supabase
        .from("budget_categories")
        .select(`
          *,
          transactions!transactions_budget_category_id_fkey (
            amount
          )
        `)
        .eq("household_id", householdId);

      const enrichedCategories = (categories ?? []).map((cat) => {
        const txs = (cat.transactions ?? []) as { amount: number }[];
        const spent = txs.reduce((sum, tx) => sum + tx.amount, 0);
        return { ...cat, spent, remaining: cat.monthly_limit - spent };
      });

      // Fetch transactions for date range
      const { data: txs } = await supabase
        .from("transactions")
        .select("amount")
        .eq("household_id", householdId)
        .gte("date", start)
        .lte("date", end)
        .eq("type", "debit");

      const totalSpent = (txs ?? []).reduce((sum, tx) => sum + tx.amount, 0);

      set({
        monthlyBudget: {
          ...budget,
          total_spent: totalSpent,
          categories: enrichedCategories as BudgetCategory[],
        } as MonthlyBudget,
        categories: enrichedCategories as BudgetCategory[],
        isLoading: false,
      });
    } catch (err: unknown) {
      set({ error: (err as Error).message, isLoading: false });
    }
  },

  createCategory: async (data) => {
    const { data: session } = await supabase.auth.getSession();
    const userId = session.session?.user.id;
    const { data: profile } = await supabase
      .from("profiles")
      .select("household_id")
      .eq("id", userId!)
      .single();

    const { error } = await supabase
      .from("budget_categories")
      .insert({ ...data, household_id: profile?.household_id });
    if (error) throw error;
    await get().fetchCategories();
  },

  updateCategory: async (id, data) => {
    const { error } = await supabase
      .from("budget_categories")
      .update(data)
      .eq("id", id);
    if (error) throw error;
    await get().fetchCategories();
  },

  deleteCategory: async (id) => {
    const { error } = await supabase
      .from("budget_categories")
      .delete()
      .eq("id", id);
    if (error) throw error;
    set((state) => ({
      categories: state.categories.filter((c) => c.id !== id),
    }));
  },
}));
