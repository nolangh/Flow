import React from "react";
import type { Meta, StoryObj } from "@storybook/react-native";
import BudgetAlertBanner from "./BudgetAlertBanner";

const meta = {
  title: "Budget/BudgetAlertBanner",
  component: BudgetAlertBanner,
  args: {
    onDismiss: () => {},
  },
} satisfies Meta<typeof BudgetAlertBanner>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Warning: Story = {
  args: {
    alert: {
      categoryId: "c1",
      categoryName: "Groceries",
      emoji: "🛒",
      pct: 85,
      spent: 425,
      limit: 500,
      threshold: 80,
    },
  },
};

export const OverBudget: Story = {
  args: {
    alert: {
      categoryId: "c2",
      categoryName: "Dining Out",
      emoji: "🍔",
      pct: 130,
      spent: 260,
      limit: 200,
      threshold: 80,
    },
  },
};

export const AtExactLimit: Story = {
  args: {
    alert: {
      categoryId: "c3",
      categoryName: "Entertainment",
      emoji: "🎬",
      pct: 100,
      spent: 150,
      limit: 150,
      threshold: 80,
    },
  },
};
