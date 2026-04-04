import React from "react";
import type { Meta, StoryObj } from "@storybook/react-native";
import ProgressBar from "./ProgressBar";

const meta = {
  title: "UI/ProgressBar",
  component: ProgressBar,
  argTypes: {
    spent: { control: "number" },
    limit: { control: "number" },
    showLabel: { control: "boolean" },
    height: { control: "number" },
  },
} satisfies Meta<typeof ProgressBar>;

export default meta;

type Story = StoryObj<typeof meta>;

export const UnderBudget: Story = {
  args: { spent: 200, limit: 500, showLabel: true },
};

export const NearLimit: Story = {
  args: { spent: 430, limit: 500, showLabel: true },
};

export const OverBudget: Story = {
  args: { spent: 650, limit: 500, showLabel: true },
};

export const Empty: Story = {
  args: { spent: 0, limit: 500, showLabel: true },
};

export const Thick: Story = {
  args: { spent: 300, limit: 500, height: 12, showLabel: false },
};

export const CustomColor: Story = {
  args: { spent: 300, limit: 500, color: "#BF5AF2", showLabel: true },
};
