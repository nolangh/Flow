/**
 * Trigger.dev entry point.
 *
 * Register all tasks here. Deploy with:
 *   npx trigger.dev@latest deploy
 *
 * Required env vars (set in Trigger.dev dashboard):
 *   SUPABASE_EDGE_FUNCTION_URL — base URL of your Supabase project functions
 *   EDGE_FUNCTION_SECRET       — shared secret for edge function auth
 */

export { monthlyBudgetRolloverTask } from "./monthly-budget-rollover";
export { dailyRecurringBillsTask } from "./daily-recurring-bills";
