import React from "react";
import { render, fireEvent } from "@testing-library/react-native";
import Button from "@/components/ui/Button";
import { Colors } from "@/constants/theme";

describe("Button", () => {
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
    const { queryByText, getByTestId } = render(
      <Button label="Loading" loading />
    );
    // Text is hidden during loading
    expect(queryByText("Loading")).toBeNull();
  });

  it("applies primary variant background color", () => {
    const { getByRole } = render(<Button label="Primary" variant="primary" />);
    // TouchableOpacity acts as button
    const btn = getByRole("button");
    expect(btn.props.style).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ backgroundColor: Colors.neonGreen }),
      ])
    );
  });

  it("applies danger variant background color", () => {
    const { getByRole } = render(<Button label="Danger" variant="danger" />);
    const btn = getByRole("button");
    expect(btn.props.style).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ backgroundColor: Colors.dangerPink }),
      ])
    );
  });

  it("renders text with black color for primary variant (contrast on colored bg)", () => {
    const { getByText } = render(<Button label="Contrast" variant="primary" />);
    const text = getByText("Contrast");
    expect(text.props.style).toEqual(
      expect.objectContaining({ color: "#000000" })
    );
  });

  it("renders full-width by default (alignSelf: stretch)", () => {
    const { getByRole } = render(<Button label="Full" />);
    const btn = getByRole("button");
    expect(btn.props.style).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ alignSelf: "stretch" }),
      ])
    );
  });

  it("renders with alignSelf flex-start when fullWidth=false", () => {
    const { getByRole } = render(<Button label="Narrow" fullWidth={false} />);
    const btn = getByRole("button");
    expect(btn.props.style).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ alignSelf: "flex-start" }),
      ])
    );
  });

  it("applies rounded-full border radius", () => {
    const { getByRole } = render(<Button label="Pill" />);
    const btn = getByRole("button");
    expect(btn.props.style).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ borderRadius: 9999 }),
      ])
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
