import React from "react";
import { render } from "@testing-library/react-native";
import Divider from "@/components/ui/Divider";

describe("Divider", () => {
  it("matches snapshot (default)", () => {
    const { toJSON } = render(<Divider />);
    expect(toJSON()).toMatchSnapshot();
  });

  it("matches snapshot (with mt and mb)", () => {
    const { toJSON } = render(<Divider mt={16} mb={8} />);
    expect(toJSON()).toMatchSnapshot();
  });

  it("renders without crashing", () => {
    expect(() => render(<Divider />)).not.toThrow();
  });

  it("applies marginTop when mt prop is set", () => {
    const { toJSON } = render(<Divider mt={20} />);
    const tree = JSON.stringify(toJSON());
    expect(tree).toContain('"marginTop":20');
  });

  it("applies marginBottom when mb prop is set", () => {
    const { toJSON } = render(<Divider mb={12} />);
    const tree = JSON.stringify(toJSON());
    expect(tree).toContain('"marginBottom":12');
  });

  it("has height of 1", () => {
    const { toJSON } = render(<Divider />);
    const tree = JSON.stringify(toJSON());
    expect(tree).toContain('"height":1');
  });

  it("defaults marginTop to 0 when not provided", () => {
    const { toJSON } = render(<Divider />);
    const tree = JSON.stringify(toJSON());
    expect(tree).toContain('"marginTop":0');
  });
});
