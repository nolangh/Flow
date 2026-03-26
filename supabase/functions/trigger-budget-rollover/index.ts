/**
 * trigger-budget-rollover
 *
 * Called by Trigger.dev on the 1st of each month (or manually).
 * For every household that has a monthly_budgets row for the prior month,
 * it computes the overage or surplus and creates the new month's row
 * with rollover_amount set accordingly.
 *
 * Deploy: supabase functions deploy trigger-budget-rollover
 */

import { serve } from "https://deno.land/std@0.208.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const supabase = createClient(
  Deno.env.get("SUPABASE_URL")!,
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
);

serve(async (req) => {
  // Simple bearer-token auth to prevent unauthenticated calls
  const authHeader = req.headers.get("Authorization");
  if (authHeader !== `Bearer ${Deno.env.get("EDGE_FUNCTION_SECRET")}`) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401 });
  }

  const now = new Date();
  const prevYear = now.getMonth() === 0 ? now.getFullYear() - 1 : now.getFullYear();
  const prevMonth = now.getMonth() === 0 ? 12 : now.getMonth(); // 1-indexed
  const prevMonthStr = `${prevYear}-${String(prevMonth).padStart(2, "0")}`;

  const currMonthStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;

  // Fetch all prior-month budget rows
  const { data: priorBudgets, error } = await supabase
    .from("monthly_budgets")
    .select("*")
    .eq("month", prevMonthStr);

  if (error) {
    return new Response(JSON.stringify({ error: error.message }), { status: 500 });
  }

  const results: string[] = [];

  for (const prior of priorBudgets ?? []) {
    const overage = prior.total_spent - prior.total_limit; // positive = over budget
    const rollover = overage > 0 ? -overage : 0; // negative rollover reduces next month's effective budget

    // Check if current month row already exists
    const { data: existing } = await supabase
      .from("monthly_budgets")
      .select("id")
      .eq("household_id", prior.household_id)
      .eq("month", currMonthStr)
      .single();

    if (!existing) {
      // Fetch category limits to set total_limit for new month
      const { data: categories } = await supabase
        .from("budget_categories")
        .select("monthly_limit, is_income")
        .eq("household_id", prior.household_id);

      const totalIncome = (categories ?? [])
        .filter((c: { is_income: boolean }) => c.is_income)
        .reduce((s: number, c: { monthly_limit: number }) => s + Number(c.monthly_limit), 0);

      const totalLimit = (categories ?? [])
        .filter((c: { is_income: boolean }) => !c.is_income)
        .reduce((s: number, c: { monthly_limit: number }) => s + Number(c.monthly_limit), 0);

      await supabase.from("monthly_budgets").insert({
        household_id: prior.household_id,
        month: currMonthStr,
        total_income: totalIncome,
        total_limit: totalLimit + rollover, // subtract overage from next month's budget
        total_spent: 0,
        rollover_amount: rollover,
      });

      results.push(`Created ${currMonthStr} budget for household ${prior.household_id} (rollover: ${rollover})`);
    }

    // Inject fixed bills as calendar events for the new month
    const { data: fixedBills } = await supabase
      .from("budget_categories")
      .select("id, name, monthly_limit, fixed_day_of_month")
      .eq("household_id", prior.household_id)
      .eq("is_fixed", true)
      .not("fixed_day_of_month", "is", null);

    for (const bill of fixedBills ?? []) {
      const billDate = `${currMonthStr}-${String(bill.fixed_day_of_month).padStart(2, "0")}T00:00:00+00:00`;
      await supabase.from("calendar_events").upsert(
        {
          household_id: prior.household_id,
          title: bill.name,
          description: `Recurring bill: $${bill.monthly_limit}`,
          start_at: billDate,
          all_day: true,
          source: "budget_bill",
          budget_category_id: bill.id,
          amount: bill.monthly_limit,
        },
        { onConflict: "household_id,budget_category_id,start_at" }
      );
    }
  }

  return new Response(
    JSON.stringify({ ok: true, processed: results }),
    { headers: { "Content-Type": "application/json" } }
  );
});
