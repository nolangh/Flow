import { create } from "zustand";
import { supabase } from "@/lib/supabase";
import type { ShoppingList, ListItem, ListState } from "@/types";

export const useListStore = create<ListState>((set, get) => ({
  lists: [],
  isLoading: false,
  error: null,

  fetchLists: async () => {
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
      if (!profile?.household_id) throw new Error("No household");

      const { data, error } = await supabase
        .from("lists")
        .select("*, items:list_items(*)")
        .eq("household_id", profile.household_id)
        .eq("is_archived", false)
        .order("created_at", { ascending: true });

      if (error) throw error;

      // Sort items by position within each list
      const lists = (data ?? []).map((l) => ({
        ...l,
        items: ((l.items ?? []) as ListItem[]).sort((a, b) => a.position - b.position),
      })) as ShoppingList[];

      set({ lists, isLoading: false });
    } catch (err: unknown) {
      set({ error: (err as Error).message, isLoading: false });
    }
  },

  createList: async ({ name, emoji, color }) => {
    const { data: session } = await supabase.auth.getSession();
    const userId = session.session?.user.id;
    if (!userId) throw new Error("Not authenticated");

    const { data: profile } = await supabase
      .from("profiles")
      .select("household_id")
      .eq("id", userId)
      .single();
    if (!profile?.household_id) throw new Error("No household");

    const { error } = await supabase.from("lists").insert({
      household_id: profile.household_id,
      created_by: userId,
      name: name.trim(),
      emoji: emoji ?? "📋",
      color: color ?? null,
    });
    if (error) throw error;
    await get().fetchLists();
  },

  updateList: async (id, data) => {
    const { error } = await supabase
      .from("lists")
      .update(data)
      .eq("id", id);
    if (error) throw error;
    await get().fetchLists();
  },

  deleteList: async (id) => {
    const { error } = await supabase.from("lists").delete().eq("id", id);
    if (error) throw error;
    set((state) => ({ lists: state.lists.filter((l) => l.id !== id) }));
  },

  addItem: async (listId, text) => {
    const { data: session } = await supabase.auth.getSession();
    const userId = session.session?.user.id;
    if (!userId) throw new Error("Not authenticated");

    const { data: profile } = await supabase
      .from("profiles")
      .select("household_id")
      .eq("id", userId)
      .single();
    if (!profile?.household_id) throw new Error("No household");

    // Position = current item count
    const list = get().lists.find((l) => l.id === listId);
    const position = list?.items?.length ?? 0;

    const { error } = await supabase.from("list_items").insert({
      list_id: listId,
      household_id: profile.household_id,
      added_by: userId,
      text: text.trim(),
      position,
    });
    if (error) throw error;
    await get().fetchLists();
  },

  toggleItem: async (itemId, checked) => {
    const { data: session } = await supabase.auth.getSession();
    const userId = session.session?.user.id;

    const { error } = await supabase
      .from("list_items")
      .update({
        is_checked: checked,
        checked_by: checked ? userId : null,
        checked_at: checked ? new Date().toISOString() : null,
      })
      .eq("id", itemId);
    if (error) throw error;

    // Optimistic update
    set((state) => ({
      lists: state.lists.map((l) => ({
        ...l,
        items: l.items.map((item) =>
          item.id === itemId
            ? { ...item, is_checked: checked, checked_by: checked ? (userId ?? null) : null }
            : item
        ),
      })),
    }));
  },

  deleteItem: async (itemId) => {
    const { error } = await supabase.from("list_items").delete().eq("id", itemId);
    if (error) throw error;
    set((state) => ({
      lists: state.lists.map((l) => ({
        ...l,
        items: l.items.filter((item) => item.id !== itemId),
      })),
    }));
  },

  clearCheckedItems: async (listId) => {
    const list = get().lists.find((l) => l.id === listId);
    const checkedIds = list?.items.filter((i) => i.is_checked).map((i) => i.id) ?? [];
    if (!checkedIds.length) return;

    const { error } = await supabase
      .from("list_items")
      .delete()
      .in("id", checkedIds);
    if (error) throw error;
    set((state) => ({
      lists: state.lists.map((l) =>
        l.id === listId
          ? { ...l, items: l.items.filter((i) => !i.is_checked) }
          : l
      ),
    }));
  },
}));
