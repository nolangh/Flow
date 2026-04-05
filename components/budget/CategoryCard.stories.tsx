import React from "react";
import type { Meta, StoryObj } from "@storybook/react-native";
import CategoryCard from "./CategoryCard";
import type { BudgetCategory } from "@/types";

const expense: BudgetCategory = {
  id: "c1", household_id: "hh1", name: "Groceries", emoji: "🛒",
  monthly_limit: 500, color: null, is_income: false, is_fixed: false,
  fixed_day_of_month: null, alert_threshold: null, spent: 250, remaining: 250, created_at: "", updated_at: "",
};

const meta = {
  title: "Budget/CategoryCard",
  component: CategoryCard,
} satisfies Meta<typeof CategoryCard>;

export default meta;

type Story = StoryObj<typeof meta>;

export const UnderBudget: Story = {
  args: { category: expense },
};

export const NearLimit: Story = {
  args: {
    category: { ...expense, name: "Dining Out", emoji: "🍔", spent: 430, remaining: 70 },
  },
};

export const OverBudget: Story = {
  args: {
    category: { ...expense, name: "Entertainment", emoji: "🎬", spent: 650, remaining: -150 },
  },
};

export const Income: Story = {
  args: {
    category: {
      ...expense, id: "c2", name: "Salary", emoji: "💵",
      monthly_limit: 5000, is_income: true, spent: 0, remaining: 5000,
    },
  },
};

export const FixedBill: Story = {
  args: {
    category: {
      ...expense, id: "c3", name: "Netflix", emoji: "📺",
      monthly_limit: 15.99, is_fixed: true, fixed_day_of_month: 15,
      spent: 0, remaining: 15.99,
    },
  },
};

export const Empty: Story = {
  args: {
    category: { ...expense, name: "Shopping", emoji: "🛍️", spent: 0, remaining: 300 },
  },
};
