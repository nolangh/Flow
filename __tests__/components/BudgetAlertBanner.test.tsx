import React from "react";
import { render, fireEvent } from "@testing-library/react-native";
import BudgetAlertBanner, { type BudgetAlert } from "@/components/budget/BudgetAlertBanner";

const warningAlert: BudgetAlert = {
  categoryId: "c1",
  categoryName: "Groceries",
  emoji: "🛒",
  pct: 85,
  spent: 425,
  limit: 500,
  threshold: 80,
};

const overBudgetAlert: BudgetAlert = {
  categoryId: "c2",
  categoryName: "Dining Out",
  emoji: "🍔",
  pct: 120,
  spent: 240,
  limit: 200,
  threshold: 80,
};

describe("BudgetAlertBanner", () => {
  // ─── Snapshot ─────────────────────────────────────────────────────────────
  it("matches snapshot (warning — near budget)", () => {
    const { toJSON } = render(
      <BudgetAlertBanner alert={warningAlert} onDismiss={jest.fn()} />
    );
    expect(toJSON()).toMatchSnapshot();
  });

  it("matches snapshot (over budget)", () => {
    const { toJSON } = render(
      <BudgetAlertBanner alert={overBudgetAlert} onDismiss={jest.fn()} />
    );
    expect(toJSON()).toMatchSnapshot();
  });

  // ─── Accessibility ─────────────────────────────────────────────────────────
  it("dismiss button is pressable", () => {
    const onDismiss = jest.fn();
    const { UNSAFE_getAllByType } = render(
      <BudgetAlertBanner alert={warningAlert} onDismiss={onDismiss} />
    );
    const { TouchableOpacity } = require("react-native");
    const touchables = UNSAFE_getAllByType(TouchableOpacity);
    // Last touchable is the dismiss (×) button
    fireEvent.press(touchables[touchables.length - 1]);
    expect(onDismiss).toHaveBeenCalledWith("c1");
  });

  // ─── Behaviour ────────────────────────────────────────────────────────────
  it("renders category name", () => {
    const { getByText } = render(
      <BudgetAlertBanner alert={warningAlert} onDismiss={jest.fn()} />
    );
    expect(getByText("Groceries")).toBeTruthy();
  });

  it("renders category emoji", () => {
    const { getByText } = render(
      <BudgetAlertBanner alert={warningAlert} onDismiss={jest.fn()} />
    );
    expect(getByText("🛒")).toBeTruthy();
  });

  it("renders percentage badge", () => {
    const { getByText } = render(
      <BudgetAlertBanner alert={warningAlert} onDismiss={jest.fn()} />
    );
    expect(getByText("85%")).toBeTruthy();
  });

  it("shows warning message when near budget", () => {
    const { getByText } = render(
      <BudgetAlertBanner alert={warningAlert} onDismiss={jest.fn()} />
    );
    expect(getByText(/85% of your Groceries budget/)).toBeTruthy();
  });

  it("shows over-budget message when spent exceeds limit", () => {
    const { getByText } = render(
      <BudgetAlertBanner alert={overBudgetAlert} onDismiss={jest.fn()} />
    );
    expect(getByText(/gone over your Dining Out budget/)).toBeTruthy();
  });

  it("shows remaining amount in warning message", () => {
    const { getByText } = render(
      <BudgetAlertBanner alert={warningAlert} onDismiss={jest.fn()} />
    );
    expect(getByText(/\$75\.00 left for the month/)).toBeTruthy();
  });

  it("calls onDismiss with the correct categoryId when dismissed", () => {
    const onDismiss = jest.fn();
    const { UNSAFE_getAllByType } = render(
      <BudgetAlertBanner alert={warningAlert} onDismiss={onDismiss} />
    );
    const { TouchableOpacity } = require("react-native");
    const touchables = UNSAFE_getAllByType(TouchableOpacity);
    fireEvent.press(touchables[touchables.length - 1]);
    expect(onDismiss).toHaveBeenCalledWith("c1");
  });

  it("renders without crashing", () => {
    expect(() =>
      render(<BudgetAlertBanner alert={warningAlert} onDismiss={jest.fn()} />)
    ).not.toThrow();
  });
});
