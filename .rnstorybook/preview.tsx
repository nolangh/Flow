import React from "react";
import { View } from "react-native";
import type { Preview } from "@storybook/react-native";

const preview: Preview = {
  decorators: [
    (Story) => (
      <View style={{ flex: 1, padding: 16, backgroundColor: "#0D0D0D" }}>
        <Story />
      </View>
    ),
  ],
  parameters: {
    backgrounds: {
      default: "dark",
      values: [
        { name: "dark", value: "#0D0D0D" },
        { name: "surface", value: "#1A1A1A" },
        { name: "light", value: "#FFFFFF" },
      ],
    },
  },
};

export default preview;
