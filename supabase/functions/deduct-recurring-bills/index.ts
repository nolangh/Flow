/**
 * deduct-recurring-bills
 *
 * Called daily by Trigger.dev. Checks all fixed-bill categories to see if
 * today matches their fixed_day_of_month. If so, and no transaction for
 * this bill exists yet this month, it auto-creates the debit transaction.
 *
 * Deploy: supabase functions deploy deduct-recurring-bills
 */

import { serve } from "https://deno.land/std@0.208.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const supabase = createClient(
  Deno.env.get("SUPABASE_URL")!,
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
);

serve(async (req) => {
  const authHeader = req.headers.get("Authorization");
  if (authHeader !== `Bearer ${Deno.env.get("EDGE_FUNCTION_SECRET")}`) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401 });
  }

  const now = new Date();
  const dayOfMonth = now.getDate();
  const yearMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
  const dateStr = `${yearMonth}-${String(dayOfMonth).padStart(2, "0")}`;

  // Find all fixed bills due today
  const { data: bills, error } = await supabase
    .from("budget_categories")
    .select("id, household_id, name, emoji, monthly_limit")
    .eq("is_fixed", true)
    .eq("fixed_day_of_month", dayOfMonth);

  if (error) {
    return new Response(JSON.stringify({ error: error.message }), { status: 500 });
  }

  const results: string[] = [];

  for (const bill of bills ?? []) {
    // Check idempotency: has this bill already been recorded this month?
    const { data: existing } = await supabase
      .from("transactions")
      .select("id")
      .eq("household_id", bill.household_id)
      .eq("budget_category_id", bill.id)
      .gte("date", `${yearMonth}-01`)
      .lte("date", `${yearMonth}-31`)
      .single();

    if (existing) {
      results.push(`SKIP: ${bill.name} already recorded for ${yearMonth}`);
      continue;
    }

    const { error: txErr } = await supabase.from("transactions").insert({
      household_id: bill.household_id,
      budget_category_id: bill.id,
      name: bill.name,
      merchant_name: bill.name,
      amount: bill.monthly_limit,
      type: "debit",
      date: dateStr,
      pending: false,
      is_manual: false,
      notes: "Auto-recorded recurring bill",
    });

    if (txErr) {
      results.push(`ERROR: ${bill.name} — ${txErr.message}`);
    } else {
      results.push(`OK: ${bill.name} recorded for ${dateStr} ($${bill.monthly_limit})`);
    }
  }

  return new Response(
    JSON.stringify({ ok: true, date: dateStr, results }),
    { headers: { "Content-Type": "application/json" } }
  );
});
