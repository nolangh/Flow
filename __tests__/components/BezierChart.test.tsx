import React from "react";
import { render } from "@testing-library/react-native";
import BezierChart from "@/components/ui/BezierChart";
import { Colors } from "@/constants/theme";
import type { SpendingDataPoint } from "@/types";

const mockData: SpendingDataPoint[] = Array.from({ length: 10 }, (_, i) => ({
  day: i + 1,
  cumulative: (i + 1) * 50,
  daily: 50,
}));

describe("BezierChart", () => {
  it("renders without crashing with valid data", () => {
    expect(() =>
      render(<BezierChart data={mockData} limit={1000} width={300} height={120} />)
    ).not.toThrow();
  });

  it("renders a placeholder when data is empty", () => {
    const { toJSON } = render(<BezierChart data={[]} limit={1000} width={300} height={120} />);
    expect(toJSON()).toBeTruthy();
  });

  it("renders a placeholder when data has only one point", () => {
    const singlePoint: SpendingDataPoint[] = [{ day: 1, cumulative: 50, daily: 50 }];
    const { toJSON } = render(<BezierChart data={singlePoint} limit={1000} width={300} height={120} />);
    expect(toJSON()).toBeTruthy();
  });

  it("uses green color when under budget", () => {
    const { toJSON } = render(
      <BezierChart data={mockData} limit={2000} width={300} height={120} />
    );
    const tree = JSON.stringify(toJSON());
    expect(tree).toContain(Colors.neonGreen);
  });

  it("uses pink color when over budget", () => {
    const overData: SpendingDataPoint[] = Array.from({ length: 5 }, (_, i) => ({
      day: i + 1,
      cumulative: (i + 1) * 300,
      daily: 300,
    }));
    const { toJSON } = render(
      <BezierChart data={overData} limit={500} width={300} height={120} />
    );
    const tree = JSON.stringify(toJSON());
    expect(tree).toContain(Colors.dangerPink);
  });

  it("renders three circles for the glowing leading dot", () => {
    const { UNSAFE_getAllByType } = render(
      <BezierChart data={mockData} limit={1000} width={300} height={120} />
    );
    // Mock SVG Circle is a string "Circle" — just ensure chart rendered
    const tree = JSON.stringify(
      render(<BezierChart data={mockData} limit={1000} width={300} height={120} />).toJSON()
    );
    // The glow effect uses multiple Circle elements (opacity 0.18, 0.35, full)
    expect(tree.split('"Circle"').length - 1).toBeGreaterThanOrEqual(3);
  });
});
