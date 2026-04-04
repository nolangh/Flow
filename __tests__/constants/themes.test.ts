import { MIDNIGHT, FRESH, GARDEN, THEMES, THEME_META, type ThemeColors, type ThemeKey } from "@/constants/themes";

// ─── Structural completeness helpers ────────────────────────────────────────

function assertThemeComplete(theme: ThemeColors, name: string) {
  // Background group
  expect(theme.bg.app).toBeTruthy();
  expect(theme.bg.surface).toBeTruthy();
  expect(theme.bg.raised).toBeTruthy();
  expect(theme.bg.overlay).toBeTruthy();
  expect(theme.bg.card).toBeTruthy();

  // Border group
  expect(theme.border.subtle).toBeTruthy();
  expect(theme.border.dim).toBeTruthy();
  expect(theme.border.strong).toBeTruthy();

  // Accent palette
  expect(theme.accent).toBeTruthy();
  expect(theme.accentDim).toBeTruthy();
  expect(theme.accentSoft).toBeTruthy();
  expect(theme.accentBorder).toBeTruthy();

  // Danger palette
  expect(theme.danger).toBeTruthy();
  expect(theme.dangerDim).toBeTruthy();
  expect(theme.dangerSoft).toBeTruthy();
  expect(theme.dangerBorder).toBeTruthy();

  // Warning
  expect(theme.warning).toBeTruthy();
  expect(theme.warningSoft).toBeTruthy();

  // Text group
  expect(theme.text.primary).toBeTruthy();
  expect(theme.text.secondary).toBeTruthy();
  expect(theme.text.muted).toBeTruthy();
  expect(theme.text.inverse).toBeTruthy();

  // Income / expense
  expect(theme.income).toBeTruthy();
  expect(theme.expense).toBeTruthy();
  expect(theme.neutral).toBeTruthy();

  // Status bar
  expect(["light-content", "dark-content"]).toContain(theme.statusBar);
}

// ─── MIDNIGHT theme ──────────────────────────────────────────────────────────

describe("MIDNIGHT theme", () => {
  it("is structurally complete", () => assertThemeComplete(MIDNIGHT, "midnight"));

  it("has a dark app background", () => {
    expect(MIDNIGHT.bg.app).toBe("#000000");
  });

  it("uses light status bar (white text on dark background)", () => {
    expect(MIDNIGHT.statusBar).toBe("light-content");
  });

  it("has a green accent", () => {
    expect(MIDNIGHT.accent).toBe("#00D632");
  });

  it("has a red danger color", () => {
    expect(MIDNIGHT.danger).toBe("#FF453A");
  });

  it("inverse text is black (for dark buttons with light text inverting to black)", () => {
    expect(MIDNIGHT.text.inverse).toBe("#000000");
  });
});

// ─── FRESH theme ─────────────────────────────────────────────────────────────

describe("FRESH theme", () => {
  it("is structurally complete", () => assertThemeComplete(FRESH, "fresh"));

  it("has a warm cream app background", () => {
    expect(FRESH.bg.app).toBe("#F5F1E8");
  });

  it("uses dark status bar (dark text on light background)", () => {
    expect(FRESH.statusBar).toBe("dark-content");
  });

  it("has an orange-red accent", () => {
    expect(FRESH.accent).toBe("#FF3C00");
  });

  it("has white inverse text (for buttons)", () => {
    expect(FRESH.text.inverse).toBe("#FFFFFF");
  });

  it("has a light primary text color (dark ink on cream)", () => {
    expect(FRESH.text.primary).toBe("#1A1A1A");
  });
});

// ─── GARDEN theme ────────────────────────────────────────────────────────────

describe("GARDEN theme", () => {
  it("is structurally complete", () => assertThemeComplete(GARDEN, "garden"));

  it("has a warm cream app background (same as Fresh)", () => {
    expect(GARDEN.bg.app).toBe("#F5F1E8");
  });

  it("uses dark status bar", () => {
    expect(GARDEN.statusBar).toBe("dark-content");
  });

  it("has a lime green accent", () => {
    expect(GARDEN.accent).toBe("#A8D147");
  });

  it("has dark inverse text (lime is too light for white text)", () => {
    // Lime is light, so button text should be dark ink, not white
    expect(GARDEN.text.inverse).toBe("#1A1A1A");
  });

  it("has a darker accentDim", () => {
    expect(GARDEN.accentDim).toBe("#88B430");
  });
});

// ─── THEMES registry ────────────────────────────────────────────────────────

describe("THEMES registry", () => {
  it("contains exactly three themes", () => {
    expect(Object.keys(THEMES)).toHaveLength(3);
  });

  it("maps midnight key to MIDNIGHT theme", () => {
    expect(THEMES.midnight).toBe(MIDNIGHT);
  });

  it("maps fresh key to FRESH theme", () => {
    expect(THEMES.fresh).toBe(FRESH);
  });

  it("maps garden key to GARDEN theme", () => {
    expect(THEMES.garden).toBe(GARDEN);
  });
});

// ─── THEME_META ──────────────────────────────────────────────────────────────

describe("THEME_META", () => {
  const keys: ThemeKey[] = ["midnight", "fresh", "garden"];

  it("has meta for every theme key", () => {
    for (const key of keys) {
      expect(THEME_META[key]).toBeDefined();
    }
  });

  it("every meta entry has label, emoji, and description", () => {
    for (const key of keys) {
      expect(THEME_META[key].label).toBeTruthy();
      expect(THEME_META[key].emoji).toBeTruthy();
      expect(THEME_META[key].description).toBeTruthy();
    }
  });

  it("midnight label is Midnight", () => {
    expect(THEME_META.midnight.label).toBe("Midnight");
  });

  it("fresh label is Fresh", () => {
    expect(THEME_META.fresh.label).toBe("Fresh");
  });

  it("garden label is Garden", () => {
    expect(THEME_META.garden.label).toBe("Garden");
  });
});

// ─── Cross-theme uniqueness ──────────────────────────────────────────────────

describe("Theme accent uniqueness", () => {
  it("all three themes have distinct accent colors", () => {
    const accents = new Set([MIDNIGHT.accent, FRESH.accent, GARDEN.accent]);
    expect(accents.size).toBe(3);
  });

  it("midnight is the only dark theme (black app background)", () => {
    const darkThemes = Object.values(THEMES).filter((t) => t.bg.app === "#000000");
    expect(darkThemes).toHaveLength(1);
    expect(darkThemes[0]).toBe(MIDNIGHT);
  });

  it("fresh and garden share the cream app background", () => {
    expect(FRESH.bg.app).toBe(GARDEN.bg.app);
  });
});
