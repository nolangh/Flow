import React from "react";
import { Text } from "react-native";
import { render } from "@testing-library/react-native";
import Card from "@/components/ui/Card";
import { Colors } from "@/constants/theme";

describe("Card", () => {
  it("renders children", () => {
    const { getByText } = render(<Card><Text>Hello</Text></Card>);
    expect(getByText("Hello")).toBeTruthy();
  });

  it("uses surface background by default", () => {
    const { toJSON } = render(<Card><Text>Child</Text></Card>);
    const tree = JSON.stringify(toJSON());
    expect(tree).toContain(Colors.bg.surface);
  });

  it("applies green glow border when glow=green", () => {
    const { toJSON } = render(<Card glow="green"><Text>G</Text></Card>);
    const tree = JSON.stringify(toJSON());
    expect(tree).toContain(Colors.neonGreenBorder);
  });

  it("applies pink glow border when glow=pink", () => {
    const { toJSON } = render(<Card glow="pink"><Text>P</Text></Card>);
    const tree = JSON.stringify(toJSON());
    expect(tree).toContain(Colors.dangerPinkBorder);
  });

  it("uses subtle border when no glow", () => {
    const { toJSON } = render(<Card><Text>Neutral</Text></Card>);
    const tree = JSON.stringify(toJSON());
    expect(tree).toContain(Colors.border.subtle);
  });

  it("respects custom padding prop", () => {
    const { toJSON } = render(<Card padding={32}><Text>Padded</Text></Card>);
    const tree = JSON.stringify(toJSON());
    expect(tree).toContain('"padding":32');
  });
});
