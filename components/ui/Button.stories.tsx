import React from "react";
import type { Meta, StoryObj } from "@storybook/react-native";
import Button from "./Button";

const meta = {
  title: "UI/Button",
  component: Button,
  argTypes: {
    variant: {
      control: "select",
      options: ["primary", "danger", "ghost", "outline"],
    },
    size: {
      control: "select",
      options: ["sm", "md", "lg"],
    },
    loading: { control: "boolean" },
    disabled: { control: "boolean" },
    fullWidth: { control: "boolean" },
  },
} satisfies Meta<typeof Button>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Primary: Story = {
  args: { label: "Save Changes", variant: "primary" },
};

export const Danger: Story = {
  args: { label: "Delete", variant: "danger" },
};

export const Ghost: Story = {
  args: { label: "Cancel", variant: "ghost" },
};

export const Outline: Story = {
  args: { label: "Learn More", variant: "outline" },
};

export const Loading: Story = {
  args: { label: "Saving…", loading: true },
};

export const Disabled: Story = {
  args: { label: "Unavailable", disabled: true },
};

export const Small: Story = {
  args: { label: "Small", size: "sm", fullWidth: false },
};

export const Large: Story = {
  args: { label: "Large Button", size: "lg" },
};

export const WithIcon: Story = {
  args: { label: "Add Transaction", icon: "add-circle-outline" },
};
