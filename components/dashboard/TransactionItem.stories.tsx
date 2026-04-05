import React from "react";
import type { Meta, StoryObj } from "@storybook/react-native";
import TransactionItem from "./TransactionItem";
import type { Transaction } from "@/types";

const baseCategory = {
  id: "cat-1", household_id: "hh1", name: "Groceries", emoji: "🛒",
  monthly_limit: 600, color: null, is_income: false, is_fixed: false,
  fixed_day_of_month: null, alert_threshold: null, created_at: "", updated_at: "",
};

const base: Transaction = {
  id: "tx-1", household_id: "hh1", plaid_transaction_id: null, account_id: null,
  budget_category_id: "cat-1", name: "Whole Foods Market", merchant_name: "Whole Foods",
  amount: 87.34, type: "debit", date: "2025-03-15", pending: false,
  logo_url: null, plaid_category: null, is_manual: true, notes: null,
  created_at: "", updated_at: "",
  category: baseCategory,
};

const meta = {
  title: "Dashboard/TransactionItem",
  component: TransactionItem,
  args: { onPress: () => {} },
} satisfies Meta<typeof TransactionItem>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Debit: Story = {
  args: { transaction: base },
};

export const Credit: Story = {
  args: {
    transaction: {
      ...base, id: "tx-2", name: "Direct Deposit", merchant_name: "Employer",
      amount: 3500, type: "credit",
      category: { ...baseCategory, name: "Salary", emoji: "💵", is_income: true },
    },
  },
};

export const Pending: Story = {
  args: { transaction: { ...base, pending: true } },
};

export const Uncategorized: Story = {
  args: { transaction: { ...base, category: undefined, budget_category_id: null } },
};

export const LargeAmount: Story = {
  args: { transaction: { ...base, amount: 12500.50, name: "Car Payment", merchant_name: "BMW Financial" } },
};

export const FoodDebit: Story = {
  args: {
    transaction: {
      ...base, id: "tx-3", name: "Chipotle", merchant_name: "Chipotle",
      amount: 14.75,
      category: { ...baseCategory, name: "Dining Out", emoji: "🌯" },
    },
  },
};
