import { useListStore } from "@/store/listStore";
import { supabase } from "@/lib/supabase";
import type { ShoppingList, ListItem } from "@/types";

const mockFrom = supabase.from as jest.Mock;

function makeItem(overrides: Partial<ListItem> = {}): ListItem {
  return {
    id: "item-1",
    list_id: "list-1",
    household_id: "hh-1",
    added_by: "user-1",
    text: "Milk",
    is_checked: false,
    checked_by: null,
    checked_at: null,
    position: 0,
    item_type: "item",
    note: null,
    quantity: null,
    created_at: "2025-01-01T00:00:00Z",
    updated_at: "2025-01-01T00:00:00Z",
    ...overrides,
  };
}

function makeList(overrides: Partial<ShoppingList> = {}): ShoppingList {
  return {
    id: "list-1",
    household_id: "hh-1",
    created_by: "user-1",
    name: "Groceries",
    emoji: "🛒",
    color: null,
    list_type: "checklist",
    is_starred: false,
    is_archived: false,
    recurrence_rule: null,
    recurrence_day_of_week: null,
    recurrence_day_of_month: null,
    recurrence_last_reset: null,
    created_at: "2025-01-01T00:00:00Z",
    updated_at: "2025-01-01T00:00:00Z",
    items: [],
    ...overrides,
  };
}

// Creates a chainable + thenable mock that resolves to result
function makeChain(result: { data?: unknown; error?: unknown } = {}) {
  const resolved = { data: result.data ?? null, error: result.error ?? null };
  const chain: Record<string, jest.Mock> = {};
  ["select","insert","update","delete","eq","neq","gte","lte","lt","in","order","filter"].forEach(
    (m) => { chain[m] = jest.fn().mockReturnThis(); }
  );
  chain.single = jest.fn().mockResolvedValue(resolved);
  chain.then = jest.fn().mockImplementation((fn: (v: unknown) => unknown) =>
    Promise.resolve(resolved).then(fn)
  );
  chain.catch = jest.fn().mockImplementation((fn: (v: unknown) => unknown) =>
    Promise.resolve(resolved).catch(fn)
  );
  return chain;
}

beforeEach(() => {
  useListStore.setState({ lists: [], isLoading: false, error: null });
  jest.clearAllMocks();
  (supabase.auth.getSession as jest.Mock).mockResolvedValue({
    data: { session: { user: { id: "user-1" } } },
  });
  // Default: return a success chain for all calls
  mockFrom.mockReturnValue(makeChain());
});

// ─── resetList ────────────────────────────────────────────────────────────────

describe("resetList", () => {
  it("unchecks all items in the list optimistically", async () => {
    const list = makeList({
      items: [
        makeItem({ id: "i1", is_checked: true }),
        makeItem({ id: "i2", is_checked: true }),
      ],
    });
    useListStore.setState({ lists: [list] });

    await useListStore.getState().resetList("list-1");

    const items = useListStore.getState().lists[0].items;
    expect(items.every((i) => i.is_checked === false)).toBe(true);
  });

  it("sets recurrence_last_reset to today", async () => {
    const today = new Date().toISOString().slice(0, 10);
    const list = makeList({ items: [makeItem({ is_checked: true })] });
    useListStore.setState({ lists: [list] });

    await useListStore.getState().resetList("list-1");
    expect(useListStore.getState().lists[0].recurrence_last_reset).toBe(today);
  });

  it("clears checked_by and checked_at on reset", async () => {
    const list = makeList({
      items: [makeItem({ is_checked: true, checked_by: "user-1", checked_at: "2025-01-01T10:00:00Z" })],
    });
    useListStore.setState({ lists: [list] });

    await useListStore.getState().resetList("list-1");
    const item = useListStore.getState().lists[0].items[0];
    expect(item.checked_by).toBeNull();
    expect(item.checked_at).toBeNull();
  });
});

// ─── toggleStar ──────────────────────────────────────────────────────────────

describe("toggleStar", () => {
  it("toggles is_starred from false to true", async () => {
    const list = makeList({ is_starred: false });
    useListStore.setState({ lists: [list] });

    await useListStore.getState().toggleStar("list-1");
    expect(useListStore.getState().lists[0].is_starred).toBe(true);
  });

  it("toggles is_starred from true to false", async () => {
    const list = makeList({ is_starred: true });
    useListStore.setState({ lists: [list] });

    await useListStore.getState().toggleStar("list-1");
    expect(useListStore.getState().lists[0].is_starred).toBe(false);
  });

  it("does nothing when list id does not exist", async () => {
    useListStore.setState({ lists: [] });
    mockFrom.mockClear();
    await useListStore.getState().toggleStar("nonexistent");
    expect(mockFrom).not.toHaveBeenCalled();
  });
});

// ─── deleteList ───────────────────────────────────────────────────────────────

describe("deleteList", () => {
  it("removes the list optimistically", async () => {
    const list = makeList();
    useListStore.setState({ lists: [list] });

    await useListStore.getState().deleteList("list-1");
    expect(useListStore.getState().lists).toHaveLength(0);
  });

  it("throws on supabase error", async () => {
    const list = makeList();
    useListStore.setState({ lists: [list] });

    // First call: delete fails; subsequent calls: fetchLists revert
    let call = 0;
    mockFrom.mockImplementation((table: string) => {
      call++;
      if (call === 1) return makeChain({ error: new Error("delete failed") });
      if (table === "profiles") {
        const c = makeChain({ data: { household_id: "hh-1" } });
        return c;
      }
      return makeChain({ data: [] });
    });

    await expect(useListStore.getState().deleteList("list-1")).rejects.toThrow();
  });
});

// ─── toggleItem ───────────────────────────────────────────────────────────────

describe("toggleItem", () => {
  it("checks an item optimistically", async () => {
    const list = makeList({ items: [makeItem({ id: "item-1", is_checked: false })] });
    useListStore.setState({ lists: [list] });

    await useListStore.getState().toggleItem("item-1", true);
    expect(useListStore.getState().lists[0].items[0].is_checked).toBe(true);
  });

  it("unchecks an item optimistically", async () => {
    const list = makeList({ items: [makeItem({ id: "item-1", is_checked: true })] });
    useListStore.setState({ lists: [list] });

    await useListStore.getState().toggleItem("item-1", false);
    expect(useListStore.getState().lists[0].items[0].is_checked).toBe(false);
  });

  it("sets checked_by to current user id when checking", async () => {
    const list = makeList({ items: [makeItem({ id: "item-1" })] });
    useListStore.setState({ lists: [list] });

    await useListStore.getState().toggleItem("item-1", true);
    expect(useListStore.getState().lists[0].items[0].checked_by).toBe("user-1");
  });

  it("clears checked_by when unchecking", async () => {
    const list = makeList({ items: [makeItem({ id: "item-1", checked_by: "user-1" })] });
    useListStore.setState({ lists: [list] });

    await useListStore.getState().toggleItem("item-1", false);
    expect(useListStore.getState().lists[0].items[0].checked_by).toBeNull();
  });
});

// ─── clearCheckedItems ────────────────────────────────────────────────────────

describe("clearCheckedItems", () => {
  it("removes checked items from the store optimistically", async () => {
    const list = makeList({
      items: [
        makeItem({ id: "i1", is_checked: true }),
        makeItem({ id: "i2", is_checked: false }),
        makeItem({ id: "i3", is_checked: true }),
      ],
    });
    useListStore.setState({ lists: [list] });

    await useListStore.getState().clearCheckedItems("list-1");
    const remaining = useListStore.getState().lists[0].items;
    expect(remaining).toHaveLength(1);
    expect(remaining[0].id).toBe("i2");
  });

  it("does nothing when no items are checked", async () => {
    const list = makeList({ items: [makeItem({ is_checked: false })] });
    useListStore.setState({ lists: [list] });
    mockFrom.mockClear();

    await useListStore.getState().clearCheckedItems("list-1");
    expect(mockFrom).not.toHaveBeenCalled();
  });
});

// ─── deleteItem ───────────────────────────────────────────────────────────────

describe("deleteItem", () => {
  it("removes item from list optimistically", async () => {
    const list = makeList({ items: [makeItem({ id: "i1" }), makeItem({ id: "i2" })] });
    useListStore.setState({ lists: [list] });

    await useListStore.getState().deleteItem("i1");
    expect(useListStore.getState().lists[0].items).toHaveLength(1);
    expect(useListStore.getState().lists[0].items[0].id).toBe("i2");
  });
});

// ─── updateList ───────────────────────────────────────────────────────────────

describe("updateList", () => {
  it("updates list fields optimistically", async () => {
    const list = makeList({ name: "Old name" });
    useListStore.setState({ lists: [list] });

    await useListStore.getState().updateList("list-1", { name: "New name" });
    expect(useListStore.getState().lists[0].name).toBe("New name");
  });

  it("throws on supabase error (with fetchLists mocked to avoid hang)", async () => {
    const list = makeList();
    useListStore.setState({ lists: [list] });

    // Mock fetchLists to be a no-op so the error revert doesn't hang
    const originalFetchLists = useListStore.getState().fetchLists;
    useListStore.setState({ fetchLists: jest.fn().mockResolvedValue(undefined) } as any);

    mockFrom.mockReturnValue(makeChain({ error: new Error("update failed") }));

    await expect(useListStore.getState().updateList("list-1", { name: "X" })).rejects.toThrow();

    // Restore
    useListStore.setState({ fetchLists: originalFetchLists } as any);
  });
});
