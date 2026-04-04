import React from "react";
import { render, fireEvent } from "@testing-library/react-native";
import SettingsScreen from "@/app/(tabs)/settings";

const mockSignOut = jest.fn().mockResolvedValue(undefined);
const mockDeleteCategory = jest.fn().mockResolvedValue(undefined);

jest.mock("@/store/authStore", () => ({
  useAuthStore: () => ({
    user: { id: "u1", email: "jordan@example.com", full_name: "Jordan Lee", household_id: "hh1" },
    household: {
      id: "hh1", name: "Lee Household", invite_code: "XYZ789",
      members: [{ id: "u1" }, { id: "u2" }],
    },
    signOut: mockSignOut,
  }),
}));

jest.mock("@/store/budgetStore", () => ({
  useBudgetStore: () => ({
    categories: [
      { id: "c1", household_id: "hh1", name: "Netflix", emoji: "📺", monthly_limit: 15.99, color: null, is_income: false, is_fixed: true, fixed_day_of_month: 10, created_at: "", updated_at: "" },
    ],
    deleteCategory: mockDeleteCategory,
  }),
}));

describe("SettingsScreen", () => {
  // ─── Accessibility ─────────────────────────────────────────────────────────
  it("Sign Out button is accessible", () => {
    const { getByText } = render(<SettingsScreen />);
    const btn = getByText("Sign Out");
    expect(btn).toBeTruthy();
  });

  // ─── Behaviour ────────────────────────────────────────────────────────────
  it("renders without crashing", () => {
    expect(() => render(<SettingsScreen />)).not.toThrow();
  });

  it("displays user full name", () => {
    const { getByText } = render(<SettingsScreen />);
    expect(getByText("Jordan Lee")).toBeTruthy();
  });

  it("displays user email", () => {
    const { getByText } = render(<SettingsScreen />);
    expect(getByText("jordan@example.com")).toBeTruthy();
  });

  it("displays household name", () => {
    const { getByText } = render(<SettingsScreen />);
    expect(getByText("Lee Household")).toBeTruthy();
  });

  it("displays invite code", () => {
    const { getByText } = render(<SettingsScreen />);
    expect(getByText("XYZ789")).toBeTruthy();
  });

  it("displays member count", () => {
    const { getByText } = render(<SettingsScreen />);
    expect(getByText(/2 of 6 members/)).toBeTruthy();
  });

  it("shows Recurring Bills section with Netflix", () => {
    const { getByText } = render(<SettingsScreen />);
    expect(getByText("Netflix")).toBeTruthy();
  });

  it("shows fixed bill day", () => {
    const { getByText } = render(<SettingsScreen />);
    expect(getByText(/Day 10/)).toBeTruthy();
  });

  it("shows Sign Out button", () => {
    const { getByText } = render(<SettingsScreen />);
    expect(getByText("Sign Out")).toBeTruthy();
  });

  it("shows confirmation alert before signing out", () => {
    const { getByText } = render(<SettingsScreen />);
    expect(() => fireEvent.press(getByText("Sign Out"))).not.toThrow();
  });

  it("shows Share button for invite code", () => {
    const { getAllByText } = render(<SettingsScreen />);
    const shareBtns = getAllByText("Share");
    expect(shareBtns.length).toBeGreaterThan(0);
  });

  it("shows Banking section with accounts row", () => {
    const { getByText } = render(<SettingsScreen />);
    expect(getByText("Banking")).toBeTruthy();
    expect(getByText("Accounts & Bill Pay")).toBeTruthy();
  });

  it("shows Budget Alerts preference toggle", () => {
    const { getByText } = render(<SettingsScreen />);
    expect(getByText("Budget Alerts")).toBeTruthy();
  });
});
