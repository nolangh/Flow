/**
 * AI budget analysis — proxied through a Supabase Edge Function.
 *
 * The Mistral API key lives only in the Edge Function environment
 * (set via `supabase secrets set MISTRAL_KEY=<key>`). It is never
 * bundled into the client app.
 *
 * TO ACTIVATE:
 *  1. Get your Mistral API key from https://console.mistral.ai/api-keys
 *  2. Set it as a Supabase secret (NOT an EXPO_PUBLIC_ env var):
 *       supabase secrets set MISTRAL_KEY=<your-key>
 *  3. Deploy the edge function:
 *       supabase functions deploy ai-budget-analysis
 */

import { supabase } from "@/lib/supabase";

export const openaiConfigured = true; // Always show the feature; the function reports its own error if unconfigured

export interface BudgetSuggestion {
  category: string;
  currentLimit: number;
  suggestedLimit: number;
  reasoning: string;
  priority: "high" | "medium" | "low";
  savingsImpact: number;
}

export interface AnalysisResult {
  summary: string;
  suggestions: BudgetSuggestion[];
  topInsight: string;
  monthlyPotentialSavings: number;
}

interface CategoryData {
  name: string;
  monthly_limit: number;
  spent: number;
  is_fixed: boolean;
  is_income: boolean;
}

/**
 * Run AI budget analysis via the `ai-budget-analysis` Edge Function.
 * The Mistral API key is never sent to or from the client.
 */
export async function analyzeBudget(
  categories: CategoryData[],
  priorityGoal?: string
): Promise<AnalysisResult> {
  const { data, error } = await supabase.functions.invoke("ai-budget-analysis", {
    body: { categories, priorityGoal },
  });

  if (error) {
    throw new Error(error.message ?? "AI budget analysis failed");
  }

  if (data?.error) {
    throw new Error(data.error as string);
  }

  return data as AnalysisResult;
}
