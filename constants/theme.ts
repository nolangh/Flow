/**
 * Flow Design System — Cash App / Chime inspired premium fintech theme.
 */

/**
 * Outfit font family — map fontWeight to the correct loaded variant.
 * Use these instead of fontWeight when you want precise control.
 */
export const Fonts = {
  light:     "Outfit-Light",
  regular:   "Outfit-Regular",
  medium:    "Outfit-Medium",
  semiBold:  "Outfit-SemiBold",
  bold:      "Outfit-Bold",
  extraBold: "Outfit-ExtraBold",
  black:     "Outfit-Black",
} as const;

export const Colors = {
  bg: {
    app: "#000000",
    surface: "#141414",
    raised: "#1C1C1E",
    overlay: "#2C2C2E",
    card: "#111111",
  },

  border: {
    subtle: "#2C2C2E",
    dim: "#1C1C1E",
    strong: "#48484A",
  },

  // Primary accent — Cash App green
  accent: "#00D632",
  accentDim: "#00A828",
  accentSoft: "rgba(0, 214, 50, 0.12)",
  accentBorder: "rgba(0, 214, 50, 0.25)",

  // Danger
  danger: "#FF453A",
  dangerDim: "#CC372F",
  dangerSoft: "rgba(255, 69, 58, 0.12)",
  dangerBorder: "rgba(255, 69, 58, 0.25)",

  // Warning
  warning: "#FF9F0A",
  warningSoft: "rgba(255, 159, 10, 0.12)",

  // Text
  text: {
    primary: "#FFFFFF",
    secondary: "#AFAFB8",
    muted: "#636366",
    inverse: "#000000",
  },

  // Semantic aliases (keep backward compat)
  neonGreen: "#00D632",
  neonGreenDim: "#00A828",
  neonGreenGlow: "rgba(0, 214, 50, 0.12)",
  neonGreenBorder: "rgba(0, 214, 50, 0.25)",
  dangerPink: "#FF453A",
  dangerPinkDim: "#CC372F",
  dangerPinkGlow: "rgba(255, 69, 58, 0.12)",
  dangerPinkBorder: "rgba(255, 69, 58, 0.25)",
  income: "#00D632",
  expense: "#FF453A",
  neutral: "#AFAFB8",
} as const;

export function getBudgetColor(spent: number, limit: number): string {
  if (limit === 0) return Colors.accent;
  const ratio = spent / limit;
  if (ratio > 1) return Colors.danger;
  if (ratio >= 0.8) return Colors.warning;
  return Colors.accent;
}

export function getBudgetGlow(spent: number, limit: number): string {
  if (limit === 0) return Colors.accentSoft;
  return spent > limit ? Colors.dangerSoft : Colors.accentSoft;
}

export const Typography = {
  xs: 11,
  sm: 13,
  base: 15,
  lg: 17,
  xl: 20,
  "2xl": 24,
  "3xl": 30,
  "4xl": 36,
  "5xl": 48,

  regular: "400" as const,
  medium: "500" as const,
  semibold: "600" as const,
  bold: "700" as const,
  black: "900" as const,
} as const;

export const Spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  base: 16,
  lg: 20,
  xl: 24,
  "2xl": 32,
  "3xl": 48,
} as const;

export const Radius = {
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  full: 9999,
} as const;

export function pillShadow(color: string) {
  return {
    shadowColor: color,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 12,
    elevation: 8,
  };
}
