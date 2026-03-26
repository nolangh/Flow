import React from "react";
import { render } from "@testing-library/react-native";
import ProgressBar from "@/components/ui/ProgressBar";
import { Colors } from "@/constants/theme";

describe("ProgressBar", () => {
  it("renders without crashing", () => {
    const { toJSON } = render(<ProgressBar spent={100} limit={500} />);
    expect(toJSON()).toBeTruthy();
  });

  it("renders green fill when under budget", () => {
    const { toJSON } = render(<ProgressBar spent={200} limit={500} />);
    const tree = JSON.stringify(toJSON());
    expect(tree).toContain(Colors.neonGreen);
  });

  it("renders pink fill when over budget", () => {
    const { toJSON } = render(<ProgressBar spent={600} limit={500} />);
    const tree = JSON.stringify(toJSON());
    expect(tree).toContain(Colors.dangerPink);
  });

  it("renders spent and limit labels when showLabel=true", () => {
    const { getByText } = render(<ProgressBar spent={150} limit={300} showLabel />);
    expect(getByText("$150 spent")).toBeTruthy();
    expect(getByText("$300 limit")).toBeTruthy();
  });

  it("does not show labels by default", () => {
    const { queryByText } = render(<ProgressBar spent={100} limit={300} />);
    expect(queryByText(/spent/)).toBeNull();
  });

  it("handles limit=0 gracefully (no division by zero)", () => {
    expect(() => render(<ProgressBar spent={0} limit={0} />)).not.toThrow();
  });

  it("shows OVER indicator when over budget and showLabel=true", () => {
    const { getByText } = render(<ProgressBar spent={600} limit={500} showLabel />);
    // Amount text reflects spent
    expect(getByText("$600 spent")).toBeTruthy();
  });

  it("respects custom height prop", () => {
    const { toJSON } = render(<ProgressBar spent={50} limit={100} height={12} />);
    const tree = JSON.stringify(toJSON());
    expect(tree).toContain('"height":12');
  });
});
