import { useTasksStore } from "@/store/tasksStore";
import { supabase } from "@/lib/supabase";
import * as Notifications from "expo-notifications";

// Helper to build a full Task object
function makeTask(overrides: Partial<ReturnType<typeof makeTask>> = {}) {
  return {
    id: "task-1",
    household_id: "hh-1",
    created_by: "user-1",
    assigned_to: null,
    parent_task_id: null,
    title: "Buy groceries",
    notes: null,
    due_date: "2025-06-15",
    reminder_at: null,
    recurrence_rule: null as null,
    priority: "medium" as const,
    is_completed: false,
    completed_at: null,
    created_at: "2025-01-01T00:00:00Z",
    updated_at: "2025-01-01T00:00:00Z",
    ...overrides,
  };
}

// Convenience: get the store's mock supabase chain
const mockFrom = supabase.from as jest.Mock;

function setupFromChain(overrides: Record<string, unknown> = {}) {
  const chain = {
    select: jest.fn().mockReturnThis(),
    insert: jest.fn().mockReturnThis(),
    update: jest.fn().mockReturnThis(),
    delete: jest.fn().mockReturnThis(),
    eq: jest.fn().mockReturnThis(),
    order: jest.fn().mockReturnThis(),
    single: jest.fn().mockResolvedValue({ data: null, error: null }),
    ...overrides,
  };
  mockFrom.mockReturnValue(chain);
  return chain;
}

beforeEach(() => {
  useTasksStore.setState({ tasks: [], isLoading: false });
  jest.clearAllMocks();
  (Notifications.getPermissionsAsync as jest.Mock).mockResolvedValue({ status: "granted" });
});

// Helper: build a thenable chain that resolves to a given result
function makeThenableChain(result: { data: unknown; error: unknown }) {
  const chain: Record<string, jest.Mock> = {};
  ["select", "insert", "update", "delete", "eq", "gte", "lte", "lt", "in", "order"].forEach((m) => {
    chain[m] = jest.fn().mockReturnThis();
  });
  chain.single = jest.fn().mockResolvedValue(result);
  chain.then = jest.fn().mockImplementation((fn: (v: unknown) => unknown) =>
    Promise.resolve(result).then(fn)
  );
  chain.catch = jest.fn().mockImplementation((fn: (v: unknown) => unknown) =>
    Promise.resolve(result).catch(fn)
  );
  return chain;
}

// ─── loadTasks ───────────────────────────────────────────────────────────────

describe("loadTasks", () => {
  it("resolves and sets isLoading=false", async () => {
    mockFrom.mockReturnValue(makeThenableChain({ data: [], error: null }));
    await useTasksStore.getState().loadTasks("hh-1");
    expect(useTasksStore.getState().isLoading).toBe(false);
  });

  it("populates tasks from supabase data", async () => {
    const tasks = [makeTask(), makeTask({ id: "task-2", title: "Walk the dog" })];
    mockFrom.mockReturnValue(makeThenableChain({ data: tasks, error: null }));

    await useTasksStore.getState().loadTasks("hh-1");
    expect(useTasksStore.getState().tasks).toHaveLength(2);
    expect(useTasksStore.getState().tasks[0].title).toBe("Buy groceries");
  });

  it("does not throw on supabase error", async () => {
    mockFrom.mockReturnValue(makeThenableChain({ data: null, error: new Error("DB error") }));
    await expect(useTasksStore.getState().loadTasks("hh-1")).resolves.toBeUndefined();
    expect(useTasksStore.getState().isLoading).toBe(false);
  });
});

// ─── addTask ─────────────────────────────────────────────────────────────────

describe("addTask", () => {
  it("adds a new task to the store", async () => {
    const newTask = makeTask({ id: "task-new" });
    mockFrom.mockReturnValue(makeThenableChain({ data: newTask, error: null }));

    await useTasksStore.getState().addTask({
      household_id: "hh-1",
      created_by: "user-1",
      title: "Buy groceries",
    });

    expect(useTasksStore.getState().tasks).toHaveLength(1);
    expect(useTasksStore.getState().tasks[0].id).toBe("task-new");
  });

  it("throws when supabase returns an error", async () => {
    mockFrom.mockReturnValue(makeThenableChain({ data: null, error: new Error("insert failed") }));

    await expect(
      useTasksStore.getState().addTask({ household_id: "hh-1", created_by: "user-1", title: "Test" })
    ).rejects.toThrow();
  });

  it("schedules a reminder when reminder_at is provided", async () => {
    const futureDate = new Date(Date.now() + 60_000).toISOString();
    const newTask = makeTask({ id: "task-r", reminder_at: futureDate });
    mockFrom.mockReturnValue(makeThenableChain({ data: newTask, error: null }));

    await useTasksStore.getState().addTask({
      household_id: "hh-1",
      created_by: "user-1",
      title: "Reminder task",
      reminder_at: futureDate,
    });

    expect(Notifications.scheduleNotificationAsync).toHaveBeenCalled();
  });

  it("does not schedule a reminder when reminder_at is null", async () => {
    const newTask = makeTask({ id: "task-no-r" });
    mockFrom.mockReturnValue(makeThenableChain({ data: newTask, error: null }));

    await useTasksStore.getState().addTask({
      household_id: "hh-1",
      created_by: "user-1",
      title: "No reminder",
    });

    expect(Notifications.scheduleNotificationAsync).not.toHaveBeenCalled();
  });
});

// ─── toggleTask ───────────────────────────────────────────────────────────────

describe("toggleTask", () => {
  it("marks a task complete optimistically", async () => {
    const task = makeTask({ id: "task-1", is_completed: false });
    useTasksStore.setState({ tasks: [task] });
    mockFrom.mockReturnValue(makeThenableChain({ error: null }));

    await useTasksStore.getState().toggleTask("task-1", false);
    expect(useTasksStore.getState().tasks[0].is_completed).toBe(true);
  });

  it("marks a task incomplete optimistically", async () => {
    const task = makeTask({ id: "task-1", is_completed: true });
    useTasksStore.setState({ tasks: [task] });
    mockFrom.mockReturnValue(makeThenableChain({ error: null }));

    await useTasksStore.getState().toggleTask("task-1", true);
    expect(useTasksStore.getState().tasks[0].is_completed).toBe(false);
  });

  it("reverts optimistic update on supabase error", async () => {
    const task = makeTask({ id: "task-1", is_completed: false });
    useTasksStore.setState({ tasks: [task] });
    mockFrom.mockReturnValue(makeThenableChain({ error: new Error("update failed") }));

    await expect(useTasksStore.getState().toggleTask("task-1", false)).rejects.toThrow();
    expect(useTasksStore.getState().tasks[0].is_completed).toBe(false);
  });

  it("spawns a new occurrence when completing a recurring task", async () => {
    const recurringTask = makeTask({
      id: "task-r",
      due_date: "2025-06-15",
      recurrence_rule: "weekly",
      is_completed: false,
    });
    useTasksStore.setState({ tasks: [recurringTask] });

    const nextTask = makeTask({ id: "task-r-next", due_date: "2025-06-22" });
    let callCount = 0;
    mockFrom.mockImplementation(() => {
      callCount++;
      // First call is the toggle update, second is the addTask insert
      return makeThenableChain(callCount === 1 ? { error: null } : { data: nextTask, error: null });
    });

    await useTasksStore.getState().toggleTask("task-r", false);

    const tasks = useTasksStore.getState().tasks;
    expect(tasks.length).toBeGreaterThan(1);
    const spawned = tasks.find((t) => t.id === "task-r-next");
    expect(spawned).toBeDefined();
    expect(spawned?.due_date).toBe("2025-06-22");
  });

  it("does not spawn a new occurrence when uncompleting a recurring task", async () => {
    const recurringTask = makeTask({
      id: "task-r",
      due_date: "2025-06-15",
      recurrence_rule: "weekly",
      is_completed: true,
    });
    useTasksStore.setState({ tasks: [recurringTask] });
    mockFrom.mockReturnValue(makeThenableChain({ error: null }));

    await useTasksStore.getState().toggleTask("task-r", true);
    expect(useTasksStore.getState().tasks).toHaveLength(1);
  });

  it("does not spawn a new occurrence for a sub-task", async () => {
    const subTask = makeTask({
      id: "task-sub",
      due_date: "2025-06-15",
      recurrence_rule: "weekly",
      parent_task_id: "task-parent",
      is_completed: false,
    });
    useTasksStore.setState({ tasks: [subTask] });
    mockFrom.mockReturnValue(makeThenableChain({ error: null }));

    await useTasksStore.getState().toggleTask("task-sub", false);
    expect(useTasksStore.getState().tasks).toHaveLength(1);
  });
});

// ─── deleteTask ───────────────────────────────────────────────────────────────

describe("deleteTask", () => {
  it("removes the task from the store optimistically", async () => {
    const task = makeTask({ id: "task-del" });
    useTasksStore.setState({ tasks: [task] });
    mockFrom.mockReturnValue(makeThenableChain({ error: null }));

    await useTasksStore.getState().deleteTask("task-del");
    expect(useTasksStore.getState().tasks).toHaveLength(0);
  });

  it("also removes child tasks (parent_task_id matches)", async () => {
    const parent = makeTask({ id: "parent" });
    const child = makeTask({ id: "child", parent_task_id: "parent" });
    useTasksStore.setState({ tasks: [parent, child] });
    mockFrom.mockReturnValue(makeThenableChain({ error: null }));

    await useTasksStore.getState().deleteTask("parent");
    expect(useTasksStore.getState().tasks).toHaveLength(0);
  });

  it("cancels the task's reminder notification", async () => {
    const task = makeTask({ id: "task-with-reminder" });
    useTasksStore.setState({ tasks: [task] });
    mockFrom.mockReturnValue(makeThenableChain({ error: null }));

    await useTasksStore.getState().deleteTask("task-with-reminder");
    expect(Notifications.cancelScheduledNotificationAsync).toHaveBeenCalledWith("task-with-reminder");
  });
});

// ─── updateTask ───────────────────────────────────────────────────────────────

describe("updateTask", () => {
  it("updates task fields optimistically", async () => {
    const task = makeTask({ id: "task-u", title: "Old title" });
    useTasksStore.setState({ tasks: [task] });
    mockFrom.mockReturnValue(makeThenableChain({ error: null }));

    await useTasksStore.getState().updateTask("task-u", { title: "New title" });
    expect(useTasksStore.getState().tasks[0].title).toBe("New title");
  });

  it("reschedules a reminder when reminder_at is updated", async () => {
    const futureDate = new Date(Date.now() + 60_000).toISOString();
    const task = makeTask({ id: "task-u" });
    useTasksStore.setState({ tasks: [task] });
    mockFrom.mockReturnValue(makeThenableChain({ error: null }));

    await useTasksStore.getState().updateTask("task-u", { reminder_at: futureDate });
    expect(Notifications.scheduleNotificationAsync).toHaveBeenCalled();
  });

  it("cancels reminder when reminder_at is set to null", async () => {
    const task = makeTask({ id: "task-u", reminder_at: "2025-06-15T09:00:00Z" });
    useTasksStore.setState({ tasks: [task] });
    mockFrom.mockReturnValue(makeThenableChain({ error: null }));

    await useTasksStore.getState().updateTask("task-u", { reminder_at: null });
    expect(Notifications.cancelScheduledNotificationAsync).toHaveBeenCalledWith("task-u");
  });

  it("throws on supabase error", async () => {
    const task = makeTask({ id: "task-u" });
    useTasksStore.setState({ tasks: [task] });
    mockFrom.mockReturnValue(makeThenableChain({ error: new Error("update failed") }));

    await expect(
      useTasksStore.getState().updateTask("task-u", { title: "New" })
    ).rejects.toThrow();
  });
});
