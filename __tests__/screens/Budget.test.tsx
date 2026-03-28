import React from "react";
import { render, fireEvent, waitFor } from "@testing-library/react-native";
import BudgetScreen from "@/app/(tabs)/budget";

const mockFetchMonthlyBudget = jest.fn().mockResolvedValue(undefined);
const mockFetchTransactions = jest.fn().mockResolvedValue(undefined);
const mockCreateCategory = jest.fn().mockResolvedValue(undefined);
const mockAddManualTransaction = jest.fn().mockResolvedValue(undefined);
const mockSetCurrentMonth = jest.fn();

const categories = [
  { id: "c1", household_id: "hh1", name: "Groceries", emoji: "🛒", monthly_limit: 500, color: null, is_income: false, is_fixed: false, fixed_day_of_month: null, spent: 250, remaining: 250, created_at: "", updated_at: "" },
  { id: "c2", household_id: "hh1", name: "Salary", emoji: "💵", monthly_limit: 4000, color: null, is_income: true, is_fixed: false, fixed_day_of_month: null, spent: 0, remaining: 4000, created_at: "", updated_at: "" },
];

jest.mock("@/store/budgetStore", () => ({
  useBudgetStore: () => ({
    categories,
    currentMonth: "2025-03",
    setCurrentMonth: mockSetCurrentMonth,
    fetchMonthlyBudget: mockFetchMonthlyBudget,
    createCategory: mockCreateCategory,
    monthlyBudget: null,
  }),
}));

jest.mock("@/store/transactionStore", () => ({
  useTransactionStore: () => ({
    transactions: [
      { id: "tx1", household_id: "hh1", name: "Trader Joe's", merchant_name: "Trader Joe's", amount: 95, type: "debit", date: "2025-03-08", pending: false, is_manual: true, plaid_transaction_id: null, account_id: null, budget_category_id: "c1", logo_url: null, plaid_category: null, notes: null, created_at: "", updated_at: "", category: categories[0] },
    ],
    isLoading: false,
    fetchTransactions: mockFetchTransactions,
    addManualTransaction: mockAddManualTransaction,
  }),
}));

jest.mock("@/hooks/useBudgetSummary", () => ({
  useBudgetSummary: () => ({
    totalIncome: 4000, totalLimit: 500, totalSpent: 250,
    totalRemaining: 250, percentUsed: 50, isOverBudget: false,
    spendingData: [], daysInMonth: 31,
  }),
}));

describe("BudgetScreen", () => {
  beforeEach(() => jest.clearAllMocks());

  it("renders without crashing", () => {
    expect(() => render(<BudgetScreen />)).not.toThrow();
  });

  it("displays Budget heading", () => {
    const { getByText } = render(<BudgetScreen />);
    expect(getByText("Budget")).toBeTruthy();
  });

  it("displays current month", () => {
    const { getByText } = render(<BudgetScreen />);
    expect(getByText("March 2025")).toBeTruthy();
  });

  it("shows income category in Income section", () => {
    const { getByText } = render(<BudgetScreen />);
    expect(getByText("Salary")).toBeTruthy();
  });

  it("shows expense category in Spending section", () => {
    const { getByText } = render(<BudgetScreen />);
    expect(getByText("Groceries")).toBeTruthy();
  });

  it("fetches data on mount", async () => {
    render(<BudgetScreen />);
    await waitFor(() => {
      expect(mockFetchMonthlyBudget).toHaveBeenCalledWith("2025-03");
    });
  });

  it("switches to Transactions tab", () => {
    const { getByText } = render(<BudgetScreen />);
    fireEvent.press(getByText("transactions"));
    expect(getByText("Trader Joe's")).toBeTruthy();
  });

  it("opens AddCategoryModal when Add Category is pressed", () => {
    const { getByText } = render(<BudgetScreen />);
    fireEvent.press(getByText("+ Add Category"));
    expect(getByText("New Category")).toBeTruthy();
  });

  it("opens AddTransactionModal when Add Transaction is pressed", async () => {
    const { getAllByText, getByText } = render(<BudgetScreen />);
    fireEvent.press(getByText("+ Add Transaction"));
    expect(getByText("Add Transaction")).toBeTruthy();
  });

  it("shows summary income/spent/remaining values", () => {
    const { getAllByText, getByText } = render(<BudgetScreen />);
    // "Income" appears as both a summary label and a section header — just check at least one exists
    expect(getAllByText("Income").length).toBeGreaterThan(0);
    expect(getByText("Spent")).toBeTruthy();
    expect(getByText("Left")).toBeTruthy();
  });
});
