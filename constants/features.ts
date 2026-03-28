import type { PremiumTier } from "@/types";

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

let _isPremium = false;
let _premiumTier: PremiumTier | null = null;

export function setPremiumStatus(active: boolean, tier?: PremiumTier | null) {
  _isPremium = active;
  _premiumTier = tier ?? null;
}

export function isPremium(): boolean {
  const isDev = !process.env.EXPO_PUBLIC_ADAPTLY_KEY;
  return isDev || _isPremium;
}

export function getPremiumTier(): PremiumTier | null {
  return _premiumTier;
}

export function hasFeature(_feature: PremiumFeature): boolean {
  return isPremium();
}

export interface TierDefinition {
  id: PremiumTier;
  name: string;
  icon: string;
  monthlyPrice: string;
  annualPrice: string;
  annualMonthly: string;
  savingsBadge: string;
  maxHouseholds: number | null;
  maxMembers: number;
  tagline: string;
  mostPopular: boolean;
  monthlyProductId: string;
  annualProductId: string;
}

export const TIER_DEFINITIONS: TierDefinition[] = [
  {
    id: "personal",
    name: "Personal",
    icon: "person",
    monthlyPrice: "$4.99",
    annualPrice: "$39.99",
    annualMonthly: "$3.33/mo",
    savingsBadge: "Save 33%",
    maxHouseholds: 1,
    maxMembers: 6,
    tagline: "Solo budgeters & couples",
    mostPopular: false,
    monthlyProductId: "flow_personal_monthly",
    annualProductId: "flow_personal_annual",
  },
  {
    id: "family",
    name: "Family",
    icon: "people",
    monthlyPrice: "$8.99",
    annualPrice: "$69.99",
    annualMonthly: "$5.83/mo",
    savingsBadge: "Save 35%",
    maxHouseholds: 3,
    maxMembers: 6,
    tagline: "Up to 3 households",
    mostPopular: true,
    monthlyProductId: "flow_family_monthly",
    annualProductId: "flow_family_annual",
  },
  {
    id: "power",
    name: "Power",
    icon: "flash",
    monthlyPrice: "$14.99",
    annualPrice: "$119.99",
    annualMonthly: "$10.00/mo",
    savingsBadge: "Save 33%",
    maxHouseholds: null,
    maxMembers: 6,
    tagline: "Unlimited households",
    mostPopular: false,
    monthlyProductId: "flow_power_monthly",
    annualProductId: "flow_power_annual",
  },
];

export const TIER_LABEL: Record<PremiumTier, string> = {
  personal: "Personal Plan",
  family: "Family Plan",
  power: "Power Plan",
};

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
