/**
 * Flow Theme Definitions
 *
 * Midnight — sleek dark fintech aesthetic (original)
 * Fresh    — bold light theme inspired by high-contrast green-forward design
 */

export interface ThemeColors {
  bg: {
    app: string;
    surface: string;
    raised: string;
    overlay: string;
    card: string;
  };
  border: {
    subtle: string;
    dim: string;
    strong: string;
  };
  accent: string;
  accentDim: string;
  accentSoft: string;
  accentBorder: string;
  danger: string;
  dangerDim: string;
  dangerSoft: string;
  dangerBorder: string;
  warning: string;
  warningSoft: string;
  text: {
    primary: string;
    secondary: string;
    muted: string;
    inverse: string;
  };
  neonGreen: string;
  neonGreenDim: string;
  neonGreenGlow: string;
  neonGreenBorder: string;
  dangerPink: string;
  dangerPinkDim: string;
  dangerPinkGlow: string;
  dangerPinkBorder: string;
  income: string;
  expense: string;
  neutral: string;
  statusBar: "light-content" | "dark-content";
}

export const MIDNIGHT: ThemeColors = {
  bg: {
    app:     "#000000",
    surface: "#141414",
    raised:  "#1C1C1E",
    overlay: "#2C2C2E",
    card:    "#111111",
  },
  border: {
    subtle: "#2C2C2E",
    dim:    "#1C1C1E",
    strong: "#48484A",
  },
  accent:       "#00D632",
  accentDim:    "#00A828",
  accentSoft:   "rgba(0, 214, 50, 0.12)",
  accentBorder: "rgba(0, 214, 50, 0.25)",
  danger:       "#FF453A",
  dangerDim:    "#CC372F",
  dangerSoft:   "rgba(255, 69, 58, 0.12)",
  dangerBorder: "rgba(255, 69, 58, 0.25)",
  warning:      "#FF9F0A",
  warningSoft:  "rgba(255, 159, 10, 0.12)",
  text: {
    primary:   "#FFFFFF",
    secondary: "#AFAFB8",
    muted:     "#636366",
    inverse:   "#000000",
  },
  neonGreen:       "#00D632",
  neonGreenDim:    "#00A828",
  neonGreenGlow:   "rgba(0, 214, 50, 0.12)",
  neonGreenBorder: "rgba(0, 214, 50, 0.25)",
  dangerPink:       "#FF453A",
  dangerPinkDim:    "#CC372F",
  dangerPinkGlow:   "rgba(255, 69, 58, 0.12)",
  dangerPinkBorder: "rgba(255, 69, 58, 0.25)",
  income:  "#00D632",
  expense: "#FF453A",
  neutral: "#AFAFB8",
  statusBar: "light-content",
};

export const FRESH: ThemeColors = {
  bg: {
    app:     "#F0EDE3",
    surface: "#FFFFFF",
    raised:  "#FAFAF6",
    overlay: "#E8E4D8",
    card:    "#FFFFFF",
  },
  border: {
    subtle: "#DEDAD0",
    dim:    "#ECE9DF",
    strong: "#B5B2A8",
  },
  accent:       "#00D632",
  accentDim:    "#00A828",
  accentSoft:   "rgba(0, 214, 50, 0.14)",
  accentBorder: "rgba(0, 214, 50, 0.35)",
  danger:       "#E53935",
  dangerDim:    "#C62828",
  dangerSoft:   "rgba(229, 57, 53, 0.10)",
  dangerBorder: "rgba(229, 57, 53, 0.28)",
  warning:      "#E67700",
  warningSoft:  "rgba(230, 119, 0, 0.10)",
  text: {
    primary:   "#111111",
    secondary: "#444444",
    muted:     "#888888",
    inverse:   "#FFFFFF",
  },
  neonGreen:       "#00D632",
  neonGreenDim:    "#00A828",
  neonGreenGlow:   "rgba(0, 214, 50, 0.14)",
  neonGreenBorder: "rgba(0, 214, 50, 0.35)",
  dangerPink:       "#E53935",
  dangerPinkDim:    "#C62828",
  dangerPinkGlow:   "rgba(229, 57, 53, 0.10)",
  dangerPinkBorder: "rgba(229, 57, 53, 0.28)",
  income:  "#00D632",
  expense: "#E53935",
  neutral: "#888888",
  statusBar: "dark-content",
};

export const THEMES = {
  midnight: MIDNIGHT,
  fresh:    FRESH,
} as const;

export type ThemeKey = keyof typeof THEMES;

export const THEME_META: Record<ThemeKey, { label: string; emoji: string; description: string }> = {
  midnight: {
    label:       "Midnight",
    emoji:       "🌑",
    description: "Deep black fintech aesthetic",
  },
  fresh: {
    label:       "Fresh",
    emoji:       "🌿",
    description: "Bold light mode with green energy",
  },
};
