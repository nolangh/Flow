import React from "react";
import { render, fireEvent } from "@testing-library/react-native";
import Button from "@/components/ui/Button";
import { Colors } from "@/constants/theme";

describe("Button", () => {
  // ─── Snapshot ─────────────────────────────────────────────────────────────
  it("matches snapshot (primary, default)", () => {
    const { toJSON } = render(<Button label="Save" />);
    expect(toJSON()).toMatchSnapshot();
  });

  it("matches snapshot (danger variant)", () => {
    const { toJSON } = render(<Button label="Delete" variant="danger" />);
    expect(toJSON()).toMatchSnapshot();
  });

  it("matches snapshot (ghost variant)", () => {
    const { toJSON } = render(<Button label="Cancel" variant="ghost" />);
    expect(toJSON()).toMatchSnapshot();
  });

  it("matches snapshot (outline variant)", () => {
    const { toJSON } = render(<Button label="Outline" variant="outline" />);
    expect(toJSON()).toMatchSnapshot();
  });

  it("matches snapshot (loading state)", () => {
    const { toJSON } = render(<Button label="Loading" loading />);
    expect(toJSON()).toMatchSnapshot();
  });

  it("matches snapshot (disabled state)", () => {
    const { toJSON } = render(<Button label="Disabled" disabled />);
    expect(toJSON()).toMatchSnapshot();
  });

  // ─── Accessibility ─────────────────────────────────────────────────────────
  it("has accessibilityRole=button", () => {
    const { getByRole } = render(<Button label="A11y" />);
    expect(getByRole("button")).toBeTruthy();
  });

  it("is accessible when disabled (opacity reduced)", () => {
    const { getByRole } = render(<Button label="Locked" disabled />);
    const btn = getByRole("button");
    // disabled reduces opacity to 0.45
    expect(btn.props.style).toEqual(expect.objectContaining({ opacity: 0.45 }));
  });

  it("label text is readable by assistive tech", () => {
    const { getByText } = render(<Button label="Submit Form" />);
    const text = getByText("Submit Form");
    expect(text).toBeTruthy();
  });

  // ─── Interaction ───────────────────────────────────────────────────────────
  it("renders the label", () => {
    const { getByText } = render(<Button label="Tap Me" />);
    expect(getByText("Tap Me")).toBeTruthy();
  });

  it("calls onPress when tapped", () => {
    const onPress = jest.fn();
    const { getByText } = render(<Button label="Click" onPress={onPress} />);
    fireEvent.press(getByText("Click"));
    expect(onPress).toHaveBeenCalledTimes(1);
  });

  it("does not call onPress when disabled", () => {
    const onPress = jest.fn();
    const { getByText } = render(<Button label="Disabled" onPress={onPress} disabled />);
    fireEvent.press(getByText("Disabled"));
    expect(onPress).not.toHaveBeenCalled();
  });

  it("shows ActivityIndicator when loading", () => {
    const { queryByText } = render(<Button label="Loading" loading />);
    expect(queryByText("Loading")).toBeNull();
  });

  it("applies primary variant background color", () => {
    const { getByRole } = render(<Button label="Primary" variant="primary" />);
    const btn = getByRole("button");
    expect(btn.props.style).toEqual(
      expect.objectContaining({ backgroundColor: Colors.neonGreen })
    );
  });

  it("applies danger variant background color", () => {
    const { getByRole } = render(<Button label="Danger" variant="danger" />);
    const btn = getByRole("button");
    expect(btn.props.style).toEqual(
      expect.objectContaining({ backgroundColor: Colors.dangerPink })
    );
  });

  it("renders full-width by default (alignSelf: stretch)", () => {
    const { getByRole } = render(<Button label="Full" />);
    const btn = getByRole("button");
    expect(btn.props.style).toEqual(
      expect.objectContaining({ alignSelf: "stretch" })
    );
  });

  it("renders with alignSelf flex-start when fullWidth=false", () => {
    const { getByRole } = render(<Button label="Narrow" fullWidth={false} />);
    const btn = getByRole("button");
    expect(btn.props.style).toEqual(
      expect.objectContaining({ alignSelf: "flex-start" })
    );
  });

  it("applies rounded-full border radius", () => {
    const { getByRole } = render(<Button label="Pill" />);
    const btn = getByRole("button");
    expect(btn.props.style).toEqual(
      expect.objectContaining({ borderRadius: 9999 })
    );
  });

  it("applies sm size styles", () => {
    const { getByText } = render(<Button label="Small" size="sm" />);
    expect(getByText("Small").props.style).toEqual(
      expect.objectContaining({ fontSize: 13 })
    );
  });

  it("applies lg size styles", () => {
    const { getByText } = render(<Button label="Large" size="lg" />);
    expect(getByText("Large").props.style).toEqual(
      expect.objectContaining({ fontSize: 17 })
    );
  });
});
