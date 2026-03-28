/**
 * Flow Theme Definitions
 *
 * Midnight — sleek dark fintech aesthetic (original)
 * Fresh    — editorial light mode: cream base, vibrant coral accent, Space Grotesk type
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
 * Fresh — bold editorial light mode
 * Typeface: Space Grotesk (loaded in _layout.tsx, synced via useColors())
 * Accent:   vibrant coral #FF5757 — energetic, warm, clearly readable on cream/white
 * Highlight: mint #5DDE82 for income / goal / success signals
 */
export const FRESH: ThemeColors = {
  bg: {
    app:     "#F5F1E8",   // warm cream
    surface: "#FFFFFF",   // pure white cards
    raised:  "#FBF9F5",   // slightly warm white for raised sections
    overlay: "#EDE9DF",   // cream overlay / chips
    card:    "#FFFFFF",
  },
  border: {
    subtle: "#E4E0D6",
    dim:    "#EDE9DF",
    strong: "#C0BDB7",
  },
  // Coral — energetic, trendy, pairs great with cream
  accent:       "#FF5757",
  accentDim:    "#E03E3E",
  accentSoft:   "rgba(255, 87, 87, 0.10)",
  accentBorder: "rgba(255, 87, 87, 0.24)",
  danger:       "#E53935",
  dangerDim:    "#C62828",
  dangerSoft:   "rgba(229, 57, 53, 0.10)",
  dangerBorder: "rgba(229, 57, 53, 0.25)",
  warning:      "#E67700",
  warningSoft:  "rgba(230, 119, 0, 0.10)",
  text: {
    primary:   "#1A1A1A",
    secondary: "#444444",
    muted:     "#888888",
    inverse:   "#FFFFFF",   // white text on coral buttons
  },
  // Mint — secondary highlight for income, goals, success
  neonGreen:       "#5DDE82",
  neonGreenDim:    "#3BC463",
  neonGreenGlow:   "rgba(93, 222, 130, 0.20)",
  neonGreenBorder: "rgba(93, 222, 130, 0.40)",
  dangerPink:       "#FF2D78",
  dangerPinkDim:    "#CC2461",
  dangerPinkGlow:   "rgba(255, 45, 120, 0.12)",
  dangerPinkBorder: "rgba(255, 45, 120, 0.28)",
  income:  "#2ECC71",    // mint for positive money flows
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
    description: "Editorial light mode, bold & vibrant",
  },
};
