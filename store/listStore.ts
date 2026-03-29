import { create } from "zustand";
import { supabase } from "@/lib/supabase";
import type { ShoppingList, ListItem, ListState, ListType, ListItemType } from "@/types";

async function getHouseholdId(): Promise<{ userId: string; householdId: string }> {
  const { data: session } = await supabase.auth.getSession();
  const userId = session.session?.user.id;
  if (!userId) throw new Error("Not authenticated");
  const { data: profile } = await supabase
    .from("profiles")
    .select("household_id")
    .eq("id", userId)
    .single();
  if (!profile?.household_id) throw new Error("No household");
  return { userId, householdId: profile.household_id };
}

function sortItems(items: ListItem[]): ListItem[] {
  return [...items].sort((a, b) => a.position - b.position);
}

export const useListStore = create<ListState>((set, get) => ({
  lists: [],
  isLoading: false,
  error: null,

  fetchLists: async () => {
    set({ isLoading: true, error: null });
    try {
      const { householdId } = await getHouseholdId();
      const { data, error } = await supabase
        .from("lists")
        .select("*, items:list_items(*)")
        .eq("household_id", householdId)
        .eq("is_archived", false)
        .order("is_starred", { ascending: false })
        .order("created_at", { ascending: true });
      if (error) throw error;
      const lists = (data ?? []).map((l) => ({
        ...l,
        items: sortItems((l.items ?? []) as ListItem[]),
      })) as ShoppingList[];
      set({ lists, isLoading: false });
    } catch (err: unknown) {
      set({ error: (err as Error).message, isLoading: false });
    }
  },

  // Targeted single-list refresh — used by realtime to avoid full refetch flicker
  refreshList: async (listId: string) => {
    try {
      const { data, error } = await supabase
        .from("lists")
        .select("*, items:list_items(*)")
        .eq("id", listId)
        .single();
      if (error || !data) return;
      const updated = { ...data, items: sortItems((data.items ?? []) as ListItem[]) } as ShoppingList;
      set((state) => ({
        lists: state.lists.map((l) => (l.id === listId ? updated : l)),
      }));
    } catch { /* silent */ }
  },

  createList: async ({ name, emoji, color, list_type }) => {
    const { userId, householdId } = await getHouseholdId();
    const { data, error } = await supabase.from("lists").insert({
      household_id: householdId,
      created_by: userId,
      name: name.trim(),
      emoji: emoji ?? "📋",
      color: color ?? null,
      list_type: list_type ?? "checklist",
    }).select("*, items:list_items(*)").single();
    if (error) throw error;
    const newList = { ...data, items: [] } as ShoppingList;
    set((state) => ({ lists: [...state.lists, newList] }));
  },

  updateList: async (id, data) => {
    // Optimistic
    set((state) => ({
      lists: state.lists.map((l) => (l.id === id ? { ...l, ...data } : l)),
    }));
    const { error } = await supabase.from("lists").update(data).eq("id", id);
    if (error) {
      // Revert on error
      await get().fetchLists();
      throw error;
    }
  },

  toggleStar: async (id) => {
    const list = get().lists.find((l) => l.id === id);
    if (!list) return;
    const newVal = !list.is_starred;
    // Optimistic
    set((state) => ({
      lists: state.lists
        .map((l) => (l.id === id ? { ...l, is_starred: newVal } : l))
        .sort((a, b) => Number(b.is_starred) - Number(a.is_starred) || a.created_at.localeCompare(b.created_at)),
    }));
    const { error } = await supabase.from("lists").update({ is_starred: newVal }).eq("id", id);
    if (error) await get().fetchLists();
  },

  deleteList: async (id) => {
    // Optimistic
    set((state) => ({ lists: state.lists.filter((l) => l.id !== id) }));
    const { error } = await supabase.from("lists").delete().eq("id", id);
    if (error) {
      await get().fetchLists();
      throw error;
    }
  },

  addItem: async (listId, { text, item_type = "item", note, quantity }) => {
    const { userId, householdId } = await getHouseholdId();
    const list = get().lists.find((l) => l.id === listId);
    const position = list?.items?.length ?? 0;

    // Optimistic — temp id replaced after DB insert
    const tempId = `temp-${Date.now()}`;
    const tempItem: ListItem = {
      id: tempId,
      list_id: listId,
      household_id: householdId,
      added_by: userId,
      text: text.trim(),
      is_checked: false,
      checked_by: null,
      checked_at: null,
      position,
      item_type,
      note: note ?? null,
      quantity: quantity ?? null,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    set((state) => ({
      lists: state.lists.map((l) =>
        l.id === listId ? { ...l, items: [...l.items, tempItem] } : l
      ),
    }));

    const { data, error } = await supabase.from("list_items").insert({
      list_id: listId,
      household_id: householdId,
      added_by: userId,
      text: text.trim(),
      position,
      item_type,
      note: note ?? null,
      quantity: quantity ?? null,
    }).select().single();

    if (error) {
      // Remove temp item on failure
      set((state) => ({
        lists: state.lists.map((l) =>
          l.id === listId ? { ...l, items: l.items.filter((i) => i.id !== tempId) } : l
        ),
      }));
      throw error;
    }
    // Replace temp with real
    set((state) => ({
      lists: state.lists.map((l) =>
        l.id === listId
          ? { ...l, items: l.items.map((i) => (i.id === tempId ? (data as ListItem) : i)) }
          : l
      ),
    }));
  },

  updateItem: async (itemId, data) => {
    // Optimistic
    set((state) => ({
      lists: state.lists.map((l) => ({
        ...l,
        items: l.items.map((i) => (i.id === itemId ? { ...i, ...data } : i)),
      })),
    }));
    const { error } = await supabase.from("list_items").update(data).eq("id", itemId);
    if (error) {
      await get().fetchLists();
      throw error;
    }
  },

  toggleItem: async (itemId, checked) => {
    const { data: session } = await supabase.auth.getSession();
    const userId = session.session?.user.id ?? null;
    // Optimistic
    set((state) => ({
      lists: state.lists.map((l) => ({
        ...l,
        items: l.items.map((i) =>
          i.id === itemId
            ? { ...i, is_checked: checked, checked_by: checked ? userId : null, checked_at: checked ? new Date().toISOString() : null }
            : i
        ),
      })),
    }));
    const { error } = await supabase.from("list_items").update({
      is_checked: checked,
      checked_by: checked ? userId : null,
      checked_at: checked ? new Date().toISOString() : null,
    }).eq("id", itemId);
    if (error) await get().fetchLists();
  },

  deleteItem: async (itemId) => {
    // Optimistic
    set((state) => ({
      lists: state.lists.map((l) => ({
        ...l,
        items: l.items.filter((i) => i.id !== itemId),
      })),
    }));
    const { error } = await supabase.from("list_items").delete().eq("id", itemId);
    if (error) await get().fetchLists();
  },

  clearCheckedItems: async (listId) => {
    const checkedIds = get().lists
      .find((l) => l.id === listId)?.items
      .filter((i) => i.is_checked).map((i) => i.id) ?? [];
    if (!checkedIds.length) return;
    // Optimistic
    set((state) => ({
      lists: state.lists.map((l) =>
        l.id === listId ? { ...l, items: l.items.filter((i) => !i.is_checked) } : l
      ),
    }));
    const { error } = await supabase.from("list_items").delete().in("id", checkedIds);
    if (error) await get().fetchLists();
  },
}));
