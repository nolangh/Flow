import { schedules, logger } from "@trigger.dev/sdk/v3";

/**
 * dailyRecurringBillsTask
 *
 * Runs at 06:00 UTC every day.
 * Calls the Supabase Edge Function which:
 *   1. Checks which fixed-bill categories have fixed_day_of_month = today
 *   2. Idempotently creates a debit transaction for each (skips if already exists)
 *
 * This means recurring bills like "Rent on the 1st" and "Netflix on the 15th"
 * are automatically recorded without any user action.
 */
export const dailyRecurringBillsTask = schedules.task({
  id: "daily-recurring-bills",
  cron: "0 6 * * *",

  run: async (_payload, { ctx }) => {
    logger.info("Checking recurring bills for today", { runId: ctx.run.id });

    const edgeFnUrl = process.env.SUPABASE_EDGE_FUNCTION_URL;
    const secret = process.env.EDGE_FUNCTION_SECRET;

    if (!edgeFnUrl || !secret) {
      throw new Error("Missing SUPABASE_EDGE_FUNCTION_URL or EDGE_FUNCTION_SECRET env vars");
    }

    const response = await fetch(`${edgeFnUrl}/deduct-recurring-bills`, {
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
    logger.info("Recurring bills check complete", { result });
    return result;
  },
});
