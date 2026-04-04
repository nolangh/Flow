import React from "react";
import { render, fireEvent } from "@testing-library/react-native";
import CategoryCard from "@/components/budget/CategoryCard";
import type { BudgetCategory } from "@/types";

const expenseCategory: BudgetCategory = {
  id: "c1",
  household_id: "hh1",
  name: "Groceries",
  emoji: "🛒",
  monthly_limit: 500,
  color: null,
  is_income: false,
  is_fixed: false,
  fixed_day_of_month: null,
  spent: 250,
  remaining: 250,
  created_at: "",
  updated_at: "",
};

const incomeCategory: BudgetCategory = {
  ...expenseCategory,
  id: "c2",
  name: "Salary",
  emoji: "💵",
  monthly_limit: 4000,
  is_income: true,
  spent: 0,
  remaining: 4000,
};

const fixedCategory: BudgetCategory = {
  ...expenseCategory,
  id: "c3",
  name: "Netflix",
  emoji: "📺",
  monthly_limit: 15.99,
  is_fixed: true,
  fixed_day_of_month: 10,
  spent: 0,
  remaining: 15.99,
};

const overBudgetCategory: BudgetCategory = {
  ...expenseCategory,
  id: "c4",
  name: "Dining Out",
  emoji: "🍔",
  monthly_limit: 200,
  spent: 350,
  remaining: -150,
};

describe("CategoryCard", () => {
  // ─── Snapshot ─────────────────────────────────────────────────────────────
  it("matches snapshot (expense category)", () => {
    const { toJSON } = render(<CategoryCard category={expenseCategory} />);
    expect(toJSON()).toMatchSnapshot();
  });

  it("matches snapshot (income category)", () => {
    const { toJSON } = render(<CategoryCard category={incomeCategory} />);
    expect(toJSON()).toMatchSnapshot();
  });

  it("matches snapshot (fixed bill)", () => {
    const { toJSON } = render(<CategoryCard category={fixedCategory} />);
    expect(toJSON()).toMatchSnapshot();
  });

  it("matches snapshot (over budget)", () => {
    const { toJSON } = render(<CategoryCard category={overBudgetCategory} />);
    expect(toJSON()).toMatchSnapshot();
  });

  // ─── Accessibility ─────────────────────────────────────────────────────────
  it("is pressable", () => {
    const onPress = jest.fn();
    const { getByText } = render(<CategoryCard category={expenseCategory} onPress={onPress} />);
    fireEvent.press(getByText("Groceries"));
    expect(onPress).toHaveBeenCalledWith(expenseCategory);
  });

  // ─── Behaviour ────────────────────────────────────────────────────────────
  it("renders expense category name", () => {
    const { getByText } = render(<CategoryCard category={expenseCategory} />);
    expect(getByText("Groceries")).toBeTruthy();
  });

  it("renders income category name", () => {
    const { getByText } = render(<CategoryCard category={incomeCategory} />);
    expect(getByText("Salary")).toBeTruthy();
  });

  it("renders fixed category name", () => {
    const { getByText } = render(<CategoryCard category={fixedCategory} />);
    expect(getByText("Netflix")).toBeTruthy();
  });

  it("shows OVER badge when over budget", () => {
    const { getByText } = render(<CategoryCard category={overBudgetCategory} />);
    expect(getByText("OVER")).toBeTruthy();
  });

  it("does not show OVER badge when under budget", () => {
    const { queryByText } = render(<CategoryCard category={expenseCategory} />);
    expect(queryByText("OVER")).toBeNull();
  });

  it("shows due date for fixed category", () => {
    const { getByText } = render(<CategoryCard category={fixedCategory} />);
    expect(getByText(/10th each month/)).toBeTruthy();
  });

  it("shows emoji", () => {
    const { getByText } = render(<CategoryCard category={expenseCategory} />);
    expect(getByText("🛒")).toBeTruthy();
  });

  it("renders without crashing when onPress is not provided", () => {
    expect(() => render(<CategoryCard category={expenseCategory} />)).not.toThrow();
  });
});
