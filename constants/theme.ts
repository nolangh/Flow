/**
 * Flow Design System
 *
 * useColors() — reactive hook, call inside every component.
 * Colors      — static reference to Midnight (for non-React contexts only).
 */

import { THEMES, MIDNIGHT } from "@/constants/themes";
import { useThemeStore } from "@/store/themeStore";
import type { ThemeColors } from "@/constants/themes";

export type { ThemeColors };
export { THEMES, MIDNIGHT };

export const Fonts = {
  light:     "Outfit-Light",
  regular:   "Outfit-Regular",
  medium:    "Outfit-Medium",
  semiBold:  "Outfit-SemiBold",
  bold:      "Outfit-Bold",
  extraBold: "Outfit-ExtraBold",
  black:     "Outfit-Black",
} as const;

/** Reactive hook — call at the top of every component. */
export function useColors(): ThemeColors {
  const { theme } = useThemeStore();
  return THEMES[theme];
}

/** Static fallback for non-React contexts (always Midnight). */
export const Colors = MIDNIGHT;

/** Theme-aware budget color. Pass `colors` from useColors(). */
export function getBudgetColor(spent: number, limit: number, colors: ThemeColors = MIDNIGHT): string {
  if (limit === 0) return colors.accent;
  const ratio = spent / limit;
  if (ratio > 1) return colors.danger;
  if (ratio >= 0.8) return colors.warning;
  return colors.accent;
}

/** Theme-aware budget glow. Pass `colors` from useColors(). */
export function getBudgetGlow(spent: number, limit: number, colors: ThemeColors = MIDNIGHT): string {
  if (limit === 0) return colors.accentSoft;
  return spent > limit ? colors.dangerSoft : colors.accentSoft;
}

export function pillShadow(color: string) {
  return {
    shadowColor: color,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 12,
    elevation: 8,
  };
}

export const Typography = {
  xs: 11, sm: 13, base: 15, lg: 17, xl: 20,
  "2xl": 24, "3xl": 30, "4xl": 36, "5xl": 48,
  regular: "400" as const, medium: "500" as const,
  semibold: "600" as const, bold: "700" as const, black: "900" as const,
} as const;

export const Spacing = {
  xs: 4, sm: 8, md: 12, base: 16, lg: 20, xl: 24, "2xl": 32, "3xl": 48,
} as const;

export const Radius = {
  sm: 8, md: 12, lg: 16, xl: 24, full: 9999,
} as const;
