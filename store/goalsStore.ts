import { create } from "zustand";
import { supabase, supabaseConfigured } from "@/lib/supabase";
import { useAuthStore } from "./authStore";

export interface Goal {
  id: string;
  household_id: string;
  name: string;
  emoji: string;
  target_amount: number;
  current_amount: number;
  deadline?: string | null;
  color: string;
  is_completed: boolean;
  created_at: string;
  updated_at: string;
}

interface GoalsStore {
  goals: Goal[];
  isLoading: boolean;
  fetchGoals: () => Promise<void>;
  createGoal: (data: Partial<Goal>) => Promise<void>;
  updateGoal: (id: string, data: Partial<Goal>) => Promise<void>;
  addContribution: (id: string, amount: number) => Promise<void>;
  deleteGoal: (id: string) => Promise<void>;
}

export const useGoalsStore = create<GoalsStore>((set, get) => ({
  goals: [],
  isLoading: false,

  fetchGoals: async () => {
    const { household } = useAuthStore.getState();
    if (!household || !supabaseConfigured) return;
    set({ isLoading: true });
    try {
      const { data, error } = await supabase
        .from("goals")
        .select("*")
        .eq("household_id", household.id)
        .order("created_at", { ascending: true });
      if (error) throw error;
      set({ goals: data ?? [] });
    } finally {
      set({ isLoading: false });
    }
  },

  createGoal: async (data) => {
    const { household } = useAuthStore.getState();
    if (!household || !supabaseConfigured) return;
    const { error } = await supabase.from("goals").insert({
      household_id: household.id,
      name: data.name ?? "New Goal",
      emoji: data.emoji ?? "🎯",
      target_amount: data.target_amount ?? 0,
      current_amount: 0,
      deadline: data.deadline ?? null,
      color: data.color ?? "#00D632",
      is_completed: false,
    });
    if (error) throw error;
    await get().fetchGoals();
  },

  updateGoal: async (id, data) => {
    if (!supabaseConfigured) return;
    const { error } = await supabase
      .from("goals")
      .update({ ...data, updated_at: new Date().toISOString() })
      .eq("id", id);
    if (error) throw error;
    await get().fetchGoals();
  },

  addContribution: async (id, amount) => {
    if (!supabaseConfigured) return;
    const goal = get().goals.find((g) => g.id === id);
    if (!goal) return;
    const newAmount = Math.min(goal.current_amount + amount, goal.target_amount);
    const isCompleted = newAmount >= goal.target_amount;
    const { error } = await supabase
      .from("goals")
      .update({
        current_amount: newAmount,
        is_completed: isCompleted,
        updated_at: new Date().toISOString(),
      })
      .eq("id", id);
    if (error) throw error;
    await get().fetchGoals();
  },

  deleteGoal: async (id) => {
    if (!supabaseConfigured) return;
    const { error } = await supabase.from("goals").delete().eq("id", id);
    if (error) throw error;
    set((s) => ({ goals: s.goals.filter((g) => g.id !== id) }));
  },
}));
