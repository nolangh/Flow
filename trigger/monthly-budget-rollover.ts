import { schedules, logger } from "@trigger.dev/sdk/v3";

/**
 * monthlyBudgetRolloverTask
 *
 * Runs at 00:05 on the 1st of every month (UTC).
 * Calls the Supabase Edge Function which:
 *   1. Reads every household's prior-month budget row
 *   2. Computes overage/surplus
 *   3. Creates the new month's budget row with rollover_amount applied
 *   4. Seeds fixed-bill calendar events for the new month
 */
export const monthlyBudgetRolloverTask = schedules.task({
  id: "monthly-budget-rollover",
  // "At 00:05 on day-of-month 1"
  cron: "5 0 1 * *",

  run: async (_payload, { ctx }) => {
    logger.info("Starting monthly budget rollover", { runId: ctx.run.id });

    const edgeFnUrl = process.env.SUPABASE_EDGE_FUNCTION_URL;
    const secret = process.env.EDGE_FUNCTION_SECRET;

    if (!edgeFnUrl || !secret) {
      throw new Error("Missing SUPABASE_EDGE_FUNCTION_URL or EDGE_FUNCTION_SECRET env vars");
    }

    const response = await fetch(`${edgeFnUrl}/trigger-budget-rollover`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${secret}`,
        "Content-Type": "application/json",
      },
    });

    if (!response.ok) {
      const body = await response.text();
      throw new Error(`Edge function failed [${response.status}]: ${body}`);
    }

    const result = await response.json();
    logger.info("Budget rollover complete", { result });
    return result;
  },
});
