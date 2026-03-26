import { getBudgetColor, getBudgetGlow, pillShadow, Colors } from "@/constants/theme";

describe("getBudgetColor", () => {
  it("returns neonGreen when under budget", () => {
    expect(getBudgetColor(400, 500)).toBe(Colors.neonGreen);
  });

  it("returns neonGreen when exactly at budget", () => {
    // isOverBudget requires strictly greater-than
    expect(getBudgetColor(500, 500)).toBe(Colors.neonGreen);
  });

  it("returns dangerPink when over budget", () => {
    expect(getBudgetColor(501, 500)).toBe(Colors.dangerPink);
  });

  it("returns neonGreen when limit is 0", () => {
    expect(getBudgetColor(999, 0)).toBe(Colors.neonGreen);
  });
});

describe("getBudgetGlow", () => {
  it("returns green glow when under budget", () => {
    expect(getBudgetGlow(100, 500)).toBe(Colors.neonGreenGlow);
  });

  it("returns pink glow when over budget", () => {
    expect(getBudgetGlow(600, 500)).toBe(Colors.dangerPinkGlow);
  });

  it("returns green glow when limit is 0", () => {
    expect(getBudgetGlow(999, 0)).toBe(Colors.neonGreenGlow);
  });
});

describe("pillShadow", () => {
  it("returns an object with shadowColor matching input", () => {
    const shadow = pillShadow("#00FF00");
    expect(shadow.shadowColor).toBe("#00FF00");
  });

  it("returns positive elevation", () => {
    const shadow = pillShadow("#FF4D6D");
    expect(shadow.elevation).toBeGreaterThan(0);
  });

  it("returns positive shadowRadius", () => {
    const shadow = pillShadow("#00FF00");
    expect(shadow.shadowRadius).toBeGreaterThan(0);
  });
});

describe("Colors", () => {
  it("has pure black app background", () => {
    expect(Colors.bg.app).toBe("#000000");
  });

  it("has neonGreen defined", () => {
    expect(Colors.neonGreen).toBe("#00FF00");
  });

  it("has dangerPink defined", () => {
    expect(Colors.dangerPink).toBe("#FF4D6D");
  });

  it("has border.subtle as gray-800 equivalent", () => {
    expect(Colors.border.subtle).toBe("#1F2937");
  });

  it("has text.inverse as black (for button labels)", () => {
    expect(Colors.text.inverse).toBe("#000000");
  });
});
