import { getBudgetColor, getBudgetGlow, pillShadow, Colors } from "@/constants/theme";

describe("getBudgetColor", () => {
  it("returns accent when clearly under budget", () => {
    expect(getBudgetColor(300, 500)).toBe(Colors.accent);
  });

  it("returns warning when exactly at budget (80-100% range)", () => {
    expect(getBudgetColor(500, 500)).toBe(Colors.warning);
  });

  it("returns danger when over budget", () => {
    expect(getBudgetColor(501, 500)).toBe(Colors.danger);
  });

  it("returns accent when limit is 0", () => {
    expect(getBudgetColor(999, 0)).toBe(Colors.accent);
  });
});

describe("getBudgetGlow", () => {
  it("returns accent glow when under budget", () => {
    expect(getBudgetGlow(100, 500)).toBe(Colors.accentSoft);
  });

  it("returns danger glow when over budget", () => {
    expect(getBudgetGlow(600, 500)).toBe(Colors.dangerSoft);
  });

  it("returns accent glow when limit is 0", () => {
    expect(getBudgetGlow(999, 0)).toBe(Colors.accentSoft);
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

  it("has neonGreen defined (backward-compat alias for accent)", () => {
    expect(Colors.neonGreen).toBe(Colors.accent);
  });

  it("has dangerPink defined (backward-compat alias for danger)", () => {
    expect(Colors.dangerPink).toBe(Colors.danger);
  });

  it("has border.subtle defined", () => {
    expect(Colors.border.subtle).toBeTruthy();
  });

  it("has text.inverse as black (for button labels)", () => {
    expect(Colors.text.inverse).toBe("#000000");
  });
});
