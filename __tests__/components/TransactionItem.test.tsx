import React from "react";
import { render, fireEvent } from "@testing-library/react-native";
import TransactionItem from "@/components/dashboard/TransactionItem";
import { Colors } from "@/constants/theme";
import type { Transaction } from "@/types";

const baseTransaction: Transaction = {
  id: "tx-1",
  household_id: "hh-1",
  plaid_transaction_id: null,
  account_id: null,
  budget_category_id: "cat-1",
  name: "Whole Foods Market",
  merchant_name: "Whole Foods",
  amount: 87.34,
  type: "debit",
  date: "2025-03-15",
  pending: false,
  logo_url: null,
  plaid_category: null,
  is_manual: true,
  notes: null,
  created_at: "2025-03-15T10:00:00Z",
  updated_at: "2025-03-15T10:00:00Z",
  category: { id: "cat-1", household_id: "hh-1", name: "Groceries", emoji: "🛒", monthly_limit: 600, color: null, is_income: false, is_fixed: false, fixed_day_of_month: null, created_at: "", updated_at: "" },
};

describe("TransactionItem", () => {
  it("renders merchant name when available", () => {
    const { getByText } = render(<TransactionItem transaction={baseTransaction} />);
    expect(getByText("Whole Foods")).toBeTruthy();
  });

  it("falls back to name when merchant_name is null", () => {
    const tx = { ...baseTransaction, merchant_name: null };
    const { getByText } = render(<TransactionItem transaction={tx} />);
    expect(getByText("Whole Foods Market")).toBeTruthy();
  });

  it("renders formatted amount", () => {
    const { getByText } = render(<TransactionItem transaction={baseTransaction} />);
    expect(getByText("-$87.34")).toBeTruthy();
  });

  it("renders credit amount with green plus sign", () => {
    const tx: Transaction = { ...baseTransaction, type: "credit", amount: 2000 };
    const { getByText } = render(<TransactionItem transaction={tx} />);
    const amountText = getByText("+$2,000.00");
    expect(amountText.props.style).toEqual(
      expect.objectContaining({ color: Colors.income })
    );
  });

  it("renders category name", () => {
    const { getByText } = render(<TransactionItem transaction={baseTransaction} />);
    expect(getByText(/Groceries/)).toBeTruthy();
  });

  it("shows Uncategorized when no category", () => {
    const tx = { ...baseTransaction, category: undefined };
    const { getByText } = render(<TransactionItem transaction={tx} />);
    expect(getByText(/Uncategorized/)).toBeTruthy();
  });

  it("shows Pending indicator when pending=true", () => {
    const tx = { ...baseTransaction, pending: true };
    const { getByText } = render(<TransactionItem transaction={tx} />);
    expect(getByText(/Pending/)).toBeTruthy();
  });

  it("calls onPress when tapped", () => {
    const onPress = jest.fn();
    const { getByText } = render(
      <TransactionItem transaction={baseTransaction} onPress={onPress} />
    );
    fireEvent.press(getByText("Whole Foods"));
    expect(onPress).toHaveBeenCalledWith(baseTransaction);
  });

  it("renders an icon for the transaction category", () => {
    const { UNSAFE_getAllByType } = render(<TransactionItem transaction={baseTransaction} />);
    // Component uses Ionicons (mocked as "Ionicons" string component) for category icons
    expect(UNSAFE_getAllByType("Ionicons").length).toBeGreaterThan(0);
  });
});
