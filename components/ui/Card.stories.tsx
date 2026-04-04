import React from "react";
import { Text } from "react-native";
import type { Meta, StoryObj } from "@storybook/react-native";
import Card from "./Card";

const meta = {
  title: "UI/Card",
  component: Card,
  argTypes: {
    glow: {
      control: "select",
      options: [null, "green", "pink"],
    },
    padding: { control: "number" },
  },
} satisfies Meta<typeof Card>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: { padding: 16 },
  render: (args) => (
    <Card {...args}>
      <Text style={{ color: "#fff" }}>Card content goes here</Text>
    </Card>
  ),
};

export const GreenGlow: Story = {
  args: { glow: "green", padding: 16 },
  render: (args) => (
    <Card {...args}>
      <Text style={{ color: "#00D632" }}>Under budget</Text>
    </Card>
  ),
};

export const PinkGlow: Story = {
  args: { glow: "pink", padding: 16 },
  render: (args) => (
    <Card {...args}>
      <Text style={{ color: "#FF453A" }}>Over budget!</Text>
    </Card>
  ),
};

export const LargePadding: Story = {
  args: { padding: 32 },
  render: (args) => (
    <Card {...args}>
      <Text style={{ color: "#fff" }}>Spacious card</Text>
    </Card>
  ),
};
