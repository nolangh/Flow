import React from "react";
import { render } from "@testing-library/react-native";
import EmptyState from "@/components/ui/EmptyState";

describe("EmptyState", () => {
  it("matches snapshot (title only)", () => {
    const { toJSON } = render(<EmptyState title="Nothing here" />);
    expect(toJSON()).toMatchSnapshot();
  });

  it("matches snapshot (with subtitle)", () => {
    const { toJSON } = render(
      <EmptyState title="No transactions" subtitle="Add your first transaction to get started" />
    );
    expect(toJSON()).toMatchSnapshot();
  });

  it("renders title text", () => {
    const { getByText } = render(<EmptyState title="No data found" />);
    expect(getByText("No data found")).toBeTruthy();
  });

  it("renders subtitle when provided", () => {
    const { getByText } = render(
      <EmptyState title="Empty" subtitle="Nothing to show here yet." />
    );
    expect(getByText("Nothing to show here yet.")).toBeTruthy();
  });

  it("does not render subtitle when not provided", () => {
    const { queryByText } = render(<EmptyState title="Empty" />);
    // Only title should be present, no extra text node
    expect(queryByText(/Nothing/)).toBeNull();
  });

  it("renders an icon", () => {
    const { UNSAFE_getAllByType } = render(<EmptyState title="Empty" />);
    expect(UNSAFE_getAllByType("Ionicons").length).toBeGreaterThan(0);
  });

  it("renders without crashing when title is an empty string", () => {
    expect(() => render(<EmptyState title="" />)).not.toThrow();
  });
});
