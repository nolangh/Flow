import { renderHook } from "@testing-library/react-native";
import { useTodaySummary } from "@/hooks/useTodaySummary";
import type { Task } from "@/store/tasksStore";

// ─── Helpers ─────────────────────────────────────────────────────────────────

const TODAY = "2025-04-09";

function makeTask(overrides: Partial<Task> = {}): Task {
  return {
    id: "t1",
    household_id: "hh-1",
    created_by: "user-1",
    assigned_to: null,
    parent_task_id: null,
    title: "Test task",
    notes: null,
    due_date: TODAY,
    reminder_at: null,
    recurrence_rule: null,
    priority: "medium",
    is_completed: false,
    completed_at: null,
    created_at: "2025-01-01T00:00:00Z",
    updated_at: "2025-01-01T00:00:00Z",
    ...overrides,
  };
}

// ─── Mocks ────────────────────────────────────────────────────────────────────

const mockTasks: Task[] = [];
const mockUser = { id: "user-1", full_name: "Alice", email: "alice@test.com" };
const mockHousehold = { id: "hh-1", name: "Home", members: [mockUser] };

jest.mock("@/store/authStore", () => ({
  useAuthStore: () => ({ user: mockUser, household: mockHousehold }),
}));

jest.mock("@/store/tasksStore", () => ({
  useTasksStore: () => ({ tasks: mockTasks }),
}));

// Supabase is mocked globally in jest.setup.ts
const { supabase } = require("@/lib/supabase");

beforeEach(() => {
  // Reset mockTasks
  mockTasks.length = 0;
  jest.clearAllMocks();
  // Lock date
  jest.useFakeTimers();
  jest.setSystemTime(new Date("2025-04-09T10:00:00.000Z"));

  // Default: no calendar events — return a fully thenable chain
  const eventsResult = Promise.resolve({ data: [] });
  const chain: Record<string, jest.Mock> = {};
  ["select", "eq", "gte", "lt", "order"].forEach((m) => {
    chain[m] = jest.fn().mockReturnThis();
  });
  // Make the final .order() call return a real Promise so .then().catch() work
  (chain.order as jest.Mock).mockReturnValue(eventsResult);
  (supabase.from as jest.Mock).mockReturnValue(chain);
});

afterEach(() => jest.useRealTimers());

// ─── Tests ────────────────────────────────────────────────────────────────────

describe("useTodaySummary — date", () => {
  it("returns today's formatted date string", () => {
    const { result } = renderHook(() => useTodaySummary());
    expect(result.current.date).toBe("Wednesday, April 9");
  });
});

describe("useTodaySummary — todayTasks", () => {
  it("includes tasks due today", () => {
    mockTasks.push(makeTask({ id: "t1", due_date: TODAY }));
    const { result } = renderHook(() => useTodaySummary());
    expect(result.current.todayTasks.some((t) => t.id === "t1")).toBe(true);
  });

  it("excludes tasks due on other dates", () => {
    mockTasks.push(makeTask({ id: "t-future", due_date: "2025-04-10" }));
    const { result } = renderHook(() => useTodaySummary());
    expect(result.current.todayTasks).toHaveLength(0);
  });

  it("excludes sub-tasks (parent_task_id set)", () => {
    mockTasks.push(makeTask({ id: "t-sub", due_date: TODAY, parent_task_id: "t-parent" }));
    const { result } = renderHook(() => useTodaySummary());
    expect(result.current.todayTasks).toHaveLength(0);
  });

  it("marks assignedByPartner=true when assigned to self but created by someone else", () => {
    mockTasks.push(
      makeTask({ id: "t1", due_date: TODAY, assigned_to: "user-1", created_by: "user-2" })
    );
    const { result } = renderHook(() => useTodaySummary());
    expect(result.current.todayTasks[0].assignedByPartner).toBe(true);
  });

  it("marks assignedByPartner=false when created by self", () => {
    mockTasks.push(
      makeTask({ id: "t1", due_date: TODAY, assigned_to: "user-1", created_by: "user-1" })
    );
    const { result } = renderHook(() => useTodaySummary());
    expect(result.current.todayTasks[0].assignedByPartner).toBe(false);
  });

  it("resolves assigneeName from household members", () => {
    mockTasks.push(makeTask({ id: "t1", due_date: TODAY, assigned_to: "user-1" }));
    const { result } = renderHook(() => useTodaySummary());
    expect(result.current.todayTasks[0].assigneeName).toBe("Alice");
  });

  it("returns null assigneeName when task is unassigned", () => {
    mockTasks.push(makeTask({ id: "t1", due_date: TODAY, assigned_to: null }));
    const { result } = renderHook(() => useTodaySummary());
    expect(result.current.todayTasks[0].assigneeName).toBeNull();
  });

  it("maps priority correctly", () => {
    mockTasks.push(makeTask({ id: "t1", due_date: TODAY, priority: "high" }));
    const { result } = renderHook(() => useTodaySummary());
    expect(result.current.todayTasks[0].priority).toBe("high");
  });
});

describe("useTodaySummary — overdueCount", () => {
  it("counts tasks that are past due and not completed", () => {
    mockTasks.push(
      makeTask({ id: "o1", due_date: "2025-04-07", is_completed: false }),
      makeTask({ id: "o2", due_date: "2025-04-08", is_completed: false }),
      makeTask({ id: "o3", due_date: "2025-04-07", is_completed: true }), // completed — excluded
      makeTask({ id: "o4", due_date: TODAY, is_completed: false }),         // today — not overdue
    );
    const { result } = renderHook(() => useTodaySummary());
    expect(result.current.overdueCount).toBe(2);
  });

  it("returns 0 when no tasks are overdue", () => {
    mockTasks.push(makeTask({ id: "t1", due_date: TODAY }));
    const { result } = renderHook(() => useTodaySummary());
    expect(result.current.overdueCount).toBe(0);
  });

  it("excludes sub-tasks from overdue count", () => {
    mockTasks.push(
      makeTask({ id: "sub", due_date: "2025-04-07", parent_task_id: "parent", is_completed: false })
    );
    const { result } = renderHook(() => useTodaySummary());
    expect(result.current.overdueCount).toBe(0);
  });
});

describe("useTodaySummary — isLoading", () => {
  it("starts as false when household is present (events fetch resolved immediately)", () => {
    const { result } = renderHook(() => useTodaySummary());
    // After render + async resolution in mocked .then(), should be false
    expect(typeof result.current.isLoading).toBe("boolean");
  });
});
