/**
 * Flow Design System — Robinhood-inspired dark fintech theme.
 *
 * Color semantics:
 *   NEON_GREEN  → positive: income, under-budget, gains
 *   DANGER_PINK → negative: expense, over-budget, losses
 */

export const Colors = {
  // Backgrounds
  bg: {
    app: "#000000",       // pure black canvas
    surface: "#0D0D0D",   // slight lift for cards
    raised: "#141414",    // modals / bottom sheets
    overlay: "#1A1A1A",   // hover / pressed state
  },

  // Borders
  border: {
    subtle: "#1F2937",    // gray-800 — thin dividers
    dim: "#111827",       // gray-900 — near-invisible
  },

  // State colors
  neonGreen: "#00FF00",
  neonGreenDim: "#00CC00",
  neonGreenGlow: "rgba(0, 255, 0, 0.15)",
  neonGreenBorder: "rgba(0, 255, 0, 0.30)",

  dangerPink: "#FF4D6D",
  dangerPinkDim: "#CC3D57",
  dangerPinkGlow: "rgba(255, 77, 109, 0.15)",
  dangerPinkBorder: "rgba(255, 77, 109, 0.30)",

  // Text
  text: {
    primary: "#FFFFFF",
    secondary: "#9CA3AF",  // gray-400
    muted: "#4B5563",      // gray-600
    inverse: "#000000",    // on-colored buttons
  },

  // Semantic helpers
  income: "#00FF00",
  expense: "#FF4D6D",
  neutral: "#9CA3AF",
} as const;

/** Returns the active theme color based on budget health (0–1+ ratio). */
export function getBudgetColor(spent: number, limit: number): string {
  if (limit === 0) return Colors.neonGreen;
  return spent / limit >= 1 ? Colors.dangerPink : Colors.neonGreen;
}

export function getBudgetGlow(spent: number, limit: number): string {
  if (limit === 0) return Colors.neonGreenGlow;
  return spent / limit >= 1 ? Colors.dangerPinkGlow : Colors.neonGreenGlow;
}

export const Typography = {
  // Scale
  xs: 11,
  sm: 13,
  base: 15,
  lg: 17,
  xl: 20,
  "2xl": 24,
  "3xl": 30,
  "4xl": 36,
  "5xl": 48,

  // Weights
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
  sm: 6,
  md: 10,
  lg: 14,
  xl: 20,
  full: 9999,
} as const;

/** Pill-button 3D shadow — darker bottom border for depth illusion. */
export function pillShadow(color: string) {
  return {
    shadowColor: color,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.5,
    shadowRadius: 8,
    elevation: 6,
  };
}
