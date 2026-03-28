import React from "react";
import { render, fireEvent, waitFor } from "@testing-library/react-native";
import DashboardScreen from "@/app/(tabs)/index";
import { Colors } from "@/constants/theme";

// ── Store mocks ──────────────────────────────────────────────────────────────
const mockFetchMonthlyBudget = jest.fn().mockResolvedValue(undefined);
const mockFetchTransactions = jest.fn().mockResolvedValue(undefined);
const mockAddManualTransaction = jest.fn().mockResolvedValue(undefined);
const mockSetCurrentMonth = jest.fn();

jest.mock("@/store/authStore", () => ({
  useAuthStore: () => ({
    user: { id: "u1", email: "alex@example.com", full_name: "Alex Smith", household_id: "hh1" },
    household: { id: "hh1", name: "Smith Household", invite_code: "ABC123" },
    session: { access_token: "tok", refresh_token: "ref" },
  }),
}));

jest.mock("@/store/budgetStore", () => ({
  useBudgetStore: () => ({
    categories: [
      { id: "c1", household_id: "hh1", name: "Groceries", emoji: "🛒", monthly_limit: 500, color: null, is_income: false, is_fixed: false, fixed_day_of_month: null, spent: 200, remaining: 300, created_at: "", updated_at: "" },
    ],
    currentMonth: "2025-03",
    setCurrentMonth: mockSetCurrentMonth,
    fetchMonthlyBudget: mockFetchMonthlyBudget,
    monthlyBudget: null,
  }),
}));

jest.mock("@/store/transactionStore", () => ({
  useTransactionStore: () => ({
    transactions: [
      {
        id: "tx1", household_id: "hh1", name: "Whole Foods", merchant_name: "Whole Foods",
        amount: 120, type: "debit", date: "2025-03-10", pending: false,
        is_manual: true, plaid_transaction_id: null, account_id: null,
        budget_category_id: "c1", logo_url: null, plaid_category: null, notes: null,
        created_at: "", updated_at: "",
        category: { id: "c1", name: "Groceries", emoji: "🛒", household_id: "hh1", monthly_limit: 500, color: null, is_income: false, is_fixed: false, fixed_day_of_month: null, created_at: "", updated_at: "" },
      },
    ],
    isLoading: false,
    fetchTransactions: mockFetchTransactions,
    addManualTransaction: mockAddManualTransaction,
  }),
}));

jest.mock("@/hooks/useBudgetSummary", () => ({
  useBudgetSummary: () => ({
    totalIncome: 4000,
    totalLimit: 2500,
    totalSpent: 1200,
    totalRemaining: 1300,
    percentUsed: 48,
    isOverBudget: false,
    spendingData: Array.from({ length: 31 }, (_, i) => ({ day: i + 1, cumulative: (i + 1) * 40, daily: 40 })),
    daysInMonth: 31,
  }),
}));

describe("DashboardScreen", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("renders without crashing", () => {
    expect(() => render(<DashboardScreen />)).not.toThrow();
  });

  it("displays household name", () => {
    const { getByText } = render(<DashboardScreen />);
    expect(getByText("Smith Household")).toBeTruthy();
  });

  it("displays current month", () => {
    const { getByText } = render(<DashboardScreen />);
    expect(getByText("March 2025")).toBeTruthy();
  });

  it("displays total spent amount", () => {
    const { getAllByText } = render(<DashboardScreen />);
    expect(getAllByText("$1,200.00").length).toBeGreaterThan(0);
  });

  it("shows accent color when under budget", () => {
    const { toJSON } = render(<DashboardScreen />);
    // Recursively search rendered output for accent color (avoid JSON.stringify circular ref)
    const containsColor = (node: unknown, color: string): boolean => {
      if (!node || typeof node !== "object") return false;
      const n = node as Record<string, unknown>;
      if (n.props && typeof n.props === "object") {
        const style = (n.props as Record<string, unknown>).style;
        if (style && JSON.stringify(style).includes(color)) return true;
      }
      if (Array.isArray(n.children)) {
        return n.children.some((child) => containsColor(child, color));
      }
      return false;
    };
    expect(containsColor(toJSON(), Colors.accent)).toBe(true);
  });

  it("displays income information", () => {
    const { getAllByText } = render(<DashboardScreen />);
    // Income label and value are rendered separately
    expect(getAllByText("Income").length).toBeGreaterThan(0);
    expect(getAllByText("$4,000.00").length).toBeGreaterThan(0);
  });

  it("fetches data on mount", async () => {
    render(<DashboardScreen />);
    await waitFor(() => {
      expect(mockFetchMonthlyBudget).toHaveBeenCalledWith("2025-03");
      expect(mockFetchTransactions).toHaveBeenCalledWith("2025-03");
    });
  });

  it("displays recent transactions", () => {
    const { getByText } = render(<DashboardScreen />);
    expect(getByText("Whole Foods")).toBeTruthy();
  });

  it("shows category pills", () => {
    const { getByText } = render(<DashboardScreen />);
    expect(getByText("Groceries")).toBeTruthy();
  });

  it("shows Add Transaction button", () => {
    const { getByText } = render(<DashboardScreen />);
    expect(getByText("+ Add Transaction")).toBeTruthy();
  });

  it("opens AddTransactionModal when Add Transaction is pressed", () => {
    const { getByText } = render(<DashboardScreen />);
    fireEvent.press(getByText("+ Add Transaction"));
    // Modal title appears
    expect(getByText("Add Transaction")).toBeTruthy();
  });

  it("navigates to previous month when left arrow pressed", () => {
    const { UNSAFE_getAllByType } = render(<DashboardScreen />);
    // Navigation uses Ionicons chevron-back/forward; find all TouchableOpacity and press the prev one
    const allTouchables = UNSAFE_getAllByType(require("react-native").TouchableOpacity);
    // Press each touchable until mockSetCurrentMonth is called with prev month
    for (const t of allTouchables) {
      fireEvent.press(t);
      if (mockSetCurrentMonth.mock.calls.some((c) => c[0] === "2025-02")) break;
    }
    expect(mockSetCurrentMonth).toHaveBeenCalledWith("2025-02");
  });
});

// Over-budget color logic is unit-tested in __tests__/constants/theme.test.ts.
// getBudgetColor(spent > limit) → dangerPink is verified there without
// needing to re-render a full screen with reset modules (which causes
// React to have multiple instances and breaks hook rules).
