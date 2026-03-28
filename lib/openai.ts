/**
 * OpenAI client for AI budget analysis.
 *
 * TO ACTIVATE:
 *  1. Get your OpenAI API key from https://platform.openai.com/api-keys
 *  2. Add it to Replit Secrets as: EXPO_PUBLIC_OPENAI_API_KEY
 *  3. The functions below will automatically become active.
 */

const OPENAI_KEY = process.env.EXPO_PUBLIC_OPENAI_API_KEY ?? "";
export const openaiConfigured = OPENAI_KEY.length > 10;

const OPENAI_URL = "https://api.openai.com/v1/chat/completions";
const MODEL = "gpt-4o-mini";

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
 * Run AI budget analysis.
 * @param categories     Current budget categories with spend data.
 * @param priorityGoal   Optional user priority, e.g. "increase food budget" or "save more".
 */
export async function analyzeBudget(
  categories: CategoryData[],
  priorityGoal?: string
): Promise<AnalysisResult> {
  if (!openaiConfigured) {
    throw new Error(
      "OpenAI API key not configured. Add EXPO_PUBLIC_OPENAI_API_KEY to your secrets."
    );
  }

  const income = categories.filter((c) => c.is_income);
  const expenses = categories.filter((c) => !c.is_income);
  const totalIncome = income.reduce((s, c) => s + c.monthly_limit, 0);
  const totalExpenses = expenses.reduce((s, c) => s + c.monthly_limit, 0);
  const totalSpent = expenses.reduce((s, c) => s + c.spent, 0);

  const categoryJson = JSON.stringify(
    expenses.map((c) => ({
      name: c.name,
      budget: c.monthly_limit,
      spent: c.spent,
      utilization: c.monthly_limit > 0 ? Math.round((c.spent / c.monthly_limit) * 100) : 0,
      type: c.is_fixed ? "fixed" : "variable",
    })),
    null,
    2
  );

  const priorityLine = priorityGoal
    ? `\n\nUser priority goal: "${priorityGoal}". Align suggestions with this goal — if the user wants more budget in a category, suggest increasing it and cutting elsewhere.`
    : "";

  const systemPrompt = `You are a personal finance advisor. Analyze the user's budget and provide clear, actionable suggestions.
Return ONLY valid JSON with this exact shape:
{
  "summary": "2-3 sentence overall assessment",
  "topInsight": "single most important insight",
  "monthlyPotentialSavings": <number>,
  "suggestions": [
    {
      "category": "<name>",
      "currentLimit": <number>,
      "suggestedLimit": <number>,
      "reasoning": "<brief reason>",
      "priority": "high|medium|low",
      "savingsImpact": <number, positive=savings, negative=increase>
    }
  ]
}`;

  const userPrompt = `Monthly income: $${totalIncome}
Total budgeted expenses: $${totalExpenses}
Total spent this month: $${totalSpent}

Category breakdown:
${categoryJson}${priorityLine}

Provide 3-5 specific budget suggestions that will help the user improve their finances.`;

  const response = await fetch(OPENAI_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${OPENAI_KEY}`,
    },
    body: JSON.stringify({
      model: MODEL,
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt },
      ],
      temperature: 0.4,
      response_format: { type: "json_object" },
    }),
  });

  if (!response.ok) {
    const err = await response.text();
    throw new Error(`OpenAI error ${response.status}: ${err}`);
  }

  const json = await response.json();
  const content = json.choices?.[0]?.message?.content;
  if (!content) throw new Error("Empty response from OpenAI");

  return JSON.parse(content) as AnalysisResult;
}
