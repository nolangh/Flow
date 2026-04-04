import React from "react";
import { Text, View } from "react-native";
import type { Meta, StoryObj } from "@storybook/react-native";
import Divider from "./Divider";

const meta = {
  title: "UI/Divider",
  component: Divider,
  argTypes: {
    mt: { control: "number" },
    mb: { control: "number" },
  },
} satisfies Meta<typeof Divider>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {},
  render: (args) => (
    <View>
      <Text style={{ color: "#fff" }}>Above divider</Text>
      <Divider {...args} />
      <Text style={{ color: "#fff" }}>Below divider</Text>
    </View>
  ),
};

export const WithMargins: Story = {
  args: { mt: 16, mb: 16 },
  render: (args) => (
    <View>
      <Text style={{ color: "#fff" }}>Section A</Text>
      <Divider {...args} />
      <Text style={{ color: "#fff" }}>Section B</Text>
    </View>
  ),
};
