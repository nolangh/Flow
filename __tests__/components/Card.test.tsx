import React from "react";
import { Text } from "react-native";
import { render } from "@testing-library/react-native";
import Card from "@/components/ui/Card";
import { Colors } from "@/constants/theme";

describe("Card", () => {
  // ─── Snapshot ─────────────────────────────────────────────────────────────
  it("matches snapshot (default)", () => {
    const { toJSON } = render(<Card><Text>Content</Text></Card>);
    expect(toJSON()).toMatchSnapshot();
  });

  it("matches snapshot (glow=green)", () => {
    const { toJSON } = render(<Card glow="green"><Text>Green</Text></Card>);
    expect(toJSON()).toMatchSnapshot();
  });

  it("matches snapshot (glow=pink)", () => {
    const { toJSON } = render(<Card glow="pink"><Text>Pink</Text></Card>);
    expect(toJSON()).toMatchSnapshot();
  });

  it("matches snapshot (custom padding)", () => {
    const { toJSON } = render(<Card padding={32}><Text>Padded</Text></Card>);
    expect(toJSON()).toMatchSnapshot();
  });

  // ─── Behaviour ────────────────────────────────────────────────────────────
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
