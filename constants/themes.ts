/**
 * Flow Theme Definitions
 *
 * Midnight — sleek dark fintech aesthetic (original)
 * Fresh    — editorial light mode: cream backgrounds, charcoal actions, mint highlights
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

/**
 * Fresh — editorial light mode
 * Inspired by bold print + bold design: cream base, charcoal primary actions,
 * mint green as a decorative highlight (not the primary action color).
 */
export const FRESH: ThemeColors = {
  bg: {
    app:     "#F5F1E8",  // warm cream
    surface: "#FFFFFF",
    raised:  "#FAFAF7",
    overlay: "#EDEAE0",
    card:    "#FFFFFF",
  },
  border: {
    subtle: "#E0DDD5",
    dim:    "#EAE7DF",
    strong: "#BBBAB4",
  },
  // Primary accent = charcoal — for buttons, active states, badges
  accent:       "#111111",
  accentDim:    "#2C2C2C",
  accentSoft:   "rgba(17, 17, 17, 0.07)",
  accentBorder: "rgba(17, 17, 17, 0.16)",
  danger:       "#E53935",
  dangerDim:    "#C62828",
  dangerSoft:   "rgba(229, 57, 53, 0.10)",
  dangerBorder: "rgba(229, 57, 53, 0.25)",
  warning:      "#E67700",
  warningSoft:  "rgba(230, 119, 0, 0.10)",
  text: {
    primary:   "#111111",
    secondary: "#444444",
    muted:     "#888888",
    inverse:   "#FFFFFF",  // white text on dark/charcoal buttons
  },
  // Mint green — decorative highlight (income, goals, success indicators)
  neonGreen:       "#5DDE82",
  neonGreenDim:    "#3BC463",
  neonGreenGlow:   "rgba(93, 222, 130, 0.22)",
  neonGreenBorder: "rgba(93, 222, 130, 0.42)",
  dangerPink:       "#E53935",
  dangerPinkDim:    "#C62828",
  dangerPinkGlow:   "rgba(229, 57, 53, 0.10)",
  dangerPinkBorder: "rgba(229, 57, 53, 0.25)",
  income:  "#2ECC71",   // mint green for positive money flows
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
    description: "Editorial light mode, bold & clean",
  },
};
