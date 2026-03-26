import { renderHook } from "@testing-library/react-native";
import { useBudgetSummary } from "@/hooks/useBudgetSummary";

// ── Mock stores ──────────────────────────────────────────────────────────────
const mockTransactions = [
  { id: "t1", type: "debit" as const, amount: 200, date: "2025-03-05", household_id: "hh", plaid_transaction_id: null, account_id: null, budget_category_id: null, name: "A", merchant_name: null, pending: false, logo_url: null, plaid_category: null, is_manual: true, notes: null, created_at: "", updated_at: "" },
  { id: "t2", type: "debit" as const, amount: 150, date: "2025-03-12", household_id: "hh", plaid_transaction_id: null, account_id: null, budget_category_id: null, name: "B", merchant_name: null, pending: false, logo_url: null, plaid_category: null, is_manual: true, notes: null, created_at: "", updated_at: "" },
  { id: "t3", type: "credit" as const, amount: 3000, date: "2025-03-01", household_id: "hh", plaid_transaction_id: null, account_id: null, budget_category_id: null, name: "Salary", merchant_name: null, pending: false, logo_url: null, plaid_category: null, is_manual: true, notes: null, created_at: "", updated_at: "" },
];

const mockCategories = [
  { id: "c1", household_id: "hh", name: "Salary", emoji: "💵", monthly_limit: 3000, color: null, is_income: true, is_fixed: false, fixed_day_of_month: null, created_at: "", updated_at: "" },
  { id: "c2", household_id: "hh", name: "Groceries", emoji: "🛒", monthly_limit: 400, color: null, is_income: false, is_fixed: false, fixed_day_of_month: null, created_at: "", updated_at: "" },
  { id: "c3", household_id: "hh", name: "Dining", emoji: "🍔", monthly_limit: 300, color: null, is_income: false, is_fixed: false, fixed_day_of_month: null, created_at: "", updated_at: "" },
];

jest.mock("@/store/transactionStore", () => ({
  useTransactionStore: () => ({ transactions: mockTransactions }),
}));

jest.mock("@/store/budgetStore", () => ({
  useBudgetStore: () => ({
    transactions: mockTransactions,
    categories: mockCategories,
    monthlyBudget: null,
    currentMonth: "2025-03",
  }),
}));

describe("useBudgetSummary", () => {
  it("calculates totalIncome from income categories", () => {
    const { result } = renderHook(() => useBudgetSummary());
    expect(result.current.totalIncome).toBe(3000);
  });

  it("calculates totalLimit from spending categories", () => {
    const { result } = renderHook(() => useBudgetSummary());
    expect(result.current.totalLimit).toBe(700); // 400 + 300
  });

  it("calculates totalSpent from debit transactions only", () => {
    const { result } = renderHook(() => useBudgetSummary());
    expect(result.current.totalSpent).toBe(350); // 200 + 150
  });

  it("calculates totalRemaining correctly", () => {
    const { result } = renderHook(() => useBudgetSummary());
    expect(result.current.totalRemaining).toBe(350); // 700 - 350
  });

  it("returns isOverBudget=false when under limit", () => {
    const { result } = renderHook(() => useBudgetSummary());
    expect(result.current.isOverBudget).toBe(false);
  });

  it("returns percentUsed proportional to spent/limit", () => {
    const { result } = renderHook(() => useBudgetSummary());
    // 350/700 = 50%
    expect(result.current.percentUsed).toBeCloseTo(50);
  });

  it("returns spendingData with daysInMonth entries", () => {
    const { result } = renderHook(() => useBudgetSummary());
    expect(result.current.spendingData).toHaveLength(result.current.daysInMonth);
  });

  it("spendingData accumulates debit amounts correctly", () => {
    const { result } = renderHook(() => useBudgetSummary());
    const { spendingData } = result.current;
    // Day 5: first debit of 200 → cumulative=200
    expect(spendingData[4].cumulative).toBe(200);
    // Day 12: second debit of 150 → cumulative=350
    expect(spendingData[11].cumulative).toBe(350);
  });
});
