/**
 * Premium feature flags for Flow.
 *
 * `isPremium` is derived from the Adaptly subscription status.
 * During development or when Adaptly isn't configured, all features are unlocked
 * so you can build and test without a paid subscription.
 */

export const PREMIUM_FEATURES = {
  AI_ANALYSIS: "ai_analysis",
  CSV_IMPORT: "csv_import",
  BUDGET_HISTORY_EXPORT: "budget_history_export",
  PLAID_SYNC: "plaid_sync",
  MULTI_CARD_LINKING: "multi_card_linking",
  BILL_PAY_TRACKER: "bill_pay_tracker",
  ALLOCATION_CHARTS: "allocation_charts",
  GOALS: "goals",
} as const;

export type PremiumFeature = (typeof PREMIUM_FEATURES)[keyof typeof PREMIUM_FEATURES];

/** Set to true once Adaptly confirms an active subscription. */
let _isPremium = false;

export function setPremiumStatus(active: boolean) {
  _isPremium = active;
}

/**
 * Returns true when the user has premium access.
 * In dev mode (no Adaptly key) always returns true so you can test all features.
 */
export function isPremium(): boolean {
  const isDev = !process.env.EXPO_PUBLIC_ADAPTLY_KEY;
  return isDev || _isPremium;
}

/** Check if a specific feature is available to the current user. */
export function hasFeature(_feature: PremiumFeature): boolean {
  return isPremium();
}

export const UPGRADE_BENEFITS = [
  {
    icon: "sparkles",
    title: "AI Budget Analysis",
    description: "Get personalized suggestions and let AI adjust your budget automatically.",
  },
  {
    icon: "trending-up",
    title: "Allocation Charts",
    description: "Visual breakdowns of exactly where your money goes each month.",
  },
  {
    icon: "target",
    title: "Goals",
    description: "Set savings goals, track progress, and celebrate milestones.",
  },
  {
    icon: "link",
    title: "Plaid Bank Sync",
    description: "Automatically import transactions from any bank or card.",
  },
  {
    icon: "document",
    title: "CSV Import & Export",
    description: "Import existing budgets and export your full history.",
  },
  {
    icon: "card",
    title: "Bill Pay Tracker",
    description: "Link specific accounts to bills and never miss a payment.",
  },
] as const;
