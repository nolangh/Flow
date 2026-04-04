import React from "react";
import type { Meta, StoryObj } from "@storybook/react-native";
import EmptyState from "./EmptyState";

const meta = {
  title: "UI/EmptyState",
  component: EmptyState,
  argTypes: {
    title: { control: "text" },
    subtitle: { control: "text" },
  },
} satisfies Meta<typeof EmptyState>;

export default meta;

type Story = StoryObj<typeof meta>;

export const TitleOnly: Story = {
  args: { title: "No transactions yet" },
};

export const WithSubtitle: Story = {
  args: {
    title: "No transactions yet",
    subtitle: "Add your first transaction to start tracking your spending.",
  },
};

export const BudgetEmpty: Story = {
  args: {
    title: "No categories",
    subtitle: "Add a budget category to get started.",
  },
};

export const ListsEmpty: Story = {
  args: {
    title: "No lists",
    subtitle: "Create your first list to start organizing tasks.",
  },
};
