/**
 * ai-budget-analysis
 *
 * Receives budget category data from the client, calls the Mistral AI
 * API server-side (key never exposed to the client bundle), and returns
 * structured budget suggestions.
 *
 * Deploy: supabase functions deploy ai-budget-analysis
 *
 * Required Supabase secret (set with `supabase secrets set`):
 *   MISTRAL_KEY=<your Mistral API key>
 */

import { serve } from "https://deno.land/std@0.208.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const MISTRAL_KEY = Deno.env.get("MISTRAL_KEY") ?? "";
const MISTRAL_URL = "https://api.mistral.ai/v1/chat/completions";
const MODEL = "open-mistral-nemo";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    // ── Authenticate the caller ──────────────────────────────────────────────
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: req.headers.get("Authorization") ?? "" } } }
    );

    const { data: { user }, error: authErr } = await supabase.auth.getUser();
    if (authErr || !user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // ── Validate Mistral key ─────────────────────────────────────────────────
    if (!MISTRAL_KEY || MISTRAL_KEY.length < 10) {
      return new Response(
        JSON.stringify({ error: "Mistral API key not configured on server. Set the MISTRAL_KEY secret." }),
        { status: 503, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // ── Parse request body ───────────────────────────────────────────────────
    const { categories, priorityGoal } = await req.json() as {
      categories: Array<{
        name: string;
        monthly_limit: number;
        spent: number;
        is_fixed: boolean;
        is_income: boolean;
      }>;
      priorityGoal?: string;
    };

    if (!Array.isArray(categories) || categories.length === 0) {
      return new Response(
        JSON.stringify({ error: "categories array is required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // ── Build prompts ────────────────────────────────────────────────────────
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
      ? `\n\nUser priority goal: "${priorityGoal}". Align suggestions with this goal.`
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

    // ── Call Mistral (server-side, key never leaves this function) ───────────
    const mistralRes = await fetch(MISTRAL_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${MISTRAL_KEY}`,
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

    if (!mistralRes.ok) {
      const errText = await mistralRes.text();
      console.error("Mistral API error:", mistralRes.status, errText);
      return new Response(
        JSON.stringify({ error: `AI service error: ${mistralRes.status}` }),
        { status: 502, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const mistralJson = await mistralRes.json();
    const content = mistralJson.choices?.[0]?.message?.content;
    if (!content) {
      return new Response(
        JSON.stringify({ error: "Empty response from AI service" }),
        { status: 502, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const analysis = JSON.parse(content);
    return new Response(JSON.stringify(analysis), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("ai-budget-analysis error:", err instanceof Error ? err.message : String(err));
    return new Response(
      JSON.stringify({ error: "Internal server error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
