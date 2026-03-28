import { create } from "zustand";
import { supabase, supabaseConfigured } from "@/lib/supabase";

export interface Task {
  id: string;
  household_id: string;
  created_by: string;
  assigned_to: string | null;
  title: string;
  notes: string | null;
  due_date: string | null;
  priority: "low" | "medium" | "high";
  is_completed: boolean;
  completed_at: string | null;
  created_at: string;
  updated_at: string;
}

interface TasksState {
  tasks: Task[];
  isLoading: boolean;
  loadTasks: (householdId: string) => Promise<void>;
  addTask: (task: {
    household_id: string;
    created_by: string;
    assigned_to?: string | null;
    title: string;
    notes?: string | null;
    due_date?: string | null;
    priority?: "low" | "medium" | "high";
  }) => Promise<void>;
  toggleTask: (id: string, currentValue: boolean) => Promise<void>;
  deleteTask: (id: string) => Promise<void>;
}

export const useTasksStore = create<TasksState>((set, get) => ({
  tasks: [],
  isLoading: false,

  loadTasks: async (householdId) => {
    if (!supabaseConfigured) return;
    set({ isLoading: true });
    try {
      const { data, error } = await supabase
        .from("tasks")
        .select("*")
        .eq("household_id", householdId)
        .order("due_date", { ascending: true, nullsFirst: false })
        .order("created_at", { ascending: false });

      if (error) throw error;
      set({ tasks: (data as Task[]) ?? [] });
    } catch (err) {
      console.error("loadTasks error:", err);
    } finally {
      set({ isLoading: false });
    }
  },

  addTask: async (payload) => {
    if (!supabaseConfigured) return;
    const { data, error } = await supabase
      .from("tasks")
      .insert({
        household_id: payload.household_id,
        created_by: payload.created_by,
        assigned_to: payload.assigned_to ?? null,
        title: payload.title.trim(),
        notes: payload.notes?.trim() ?? null,
        due_date: payload.due_date ?? null,
        priority: payload.priority ?? "medium",
        is_completed: false,
      })
      .select()
      .single();

    if (error) throw error;
    set((s) => ({ tasks: [data as Task, ...s.tasks] }));
  },

  toggleTask: async (id, currentValue) => {
    const completedAt = currentValue ? null : new Date().toISOString();
    set((s) => ({
      tasks: s.tasks.map((t) =>
        t.id === id ? { ...t, is_completed: !currentValue, completed_at: completedAt } : t
      ),
    }));

    const { error } = await supabase
      .from("tasks")
      .update({ is_completed: !currentValue, completed_at: completedAt })
      .eq("id", id);

    if (error) {
      // revert on failure
      set((s) => ({
        tasks: s.tasks.map((t) =>
          t.id === id ? { ...t, is_completed: currentValue, completed_at: null } : t
        ),
      }));
      throw error;
    }
  },

  deleteTask: async (id) => {
    set((s) => ({ tasks: s.tasks.filter((t) => t.id !== id) }));
    const { error } = await supabase.from("tasks").delete().eq("id", id);
    if (error) throw error;
  },
}));
