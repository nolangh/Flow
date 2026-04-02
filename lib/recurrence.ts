// ─── Task Recurrence ──────────────────────────────────────────────────────────

export type RecurrenceRule = "daily" | "weekly" | "biweekly" | "monthly" | null;

export const RECURRENCE_LABELS: Record<"none" | NonNullable<RecurrenceRule>, string> = {
  none:      "Never",
  daily:     "Daily",
  weekly:    "Weekly",
  biweekly:  "Every 2 weeks",
  monthly:   "Monthly",
};

/**
 * Given the current due date and a rule, return the next due date string (YYYY-MM-DD).
 */
export function nextDueDate(currentDueDate: string, rule: NonNullable<RecurrenceRule>): string {
  const [y, m, d] = currentDueDate.split("-").map(Number);
  const date = new Date(y, m - 1, d);
  switch (rule) {
    case "daily":     date.setDate(date.getDate() + 1);       break;
    case "weekly":    date.setDate(date.getDate() + 7);       break;
    case "biweekly":  date.setDate(date.getDate() + 14);      break;
    case "monthly":   date.setMonth(date.getMonth() + 1);     break;
  }
  return [
    date.getFullYear(),
    String(date.getMonth() + 1).padStart(2, "0"),
    String(date.getDate()).padStart(2, "0"),
  ].join("-");
}

// ─── List Reset Schedule ──────────────────────────────────────────────────────

export type ListResetRule = "daily" | "weekly" | "monthly" | null;

export const LIST_RESET_LABELS: Record<"none" | NonNullable<ListResetRule>, string> = {
  none:    "Never",
  daily:   "Every day",
  weekly:  "Every week",
  monthly: "Every month",
};

export const DAY_NAMES = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"] as const;

/**
 * Returns true if a list is due for a reset based on its schedule and when it was last reset.
 */
export function isListDueForReset(
  rule: ListResetRule,
  resetDayOfWeek: number | null,
  resetDayOfMonth: number | null,
  lastReset: string | null,
): boolean {
  if (!rule) return false;

  const today = new Date();
  const todayStr = today.toISOString().slice(0, 10);
  if (!lastReset) return true;     // never been reset
  if (lastReset >= todayStr) return false; // already reset today

  switch (rule) {
    case "daily":
      return lastReset < todayStr;

    case "weekly": {
      // Find most recent past occurrence of resetDayOfWeek (default Sunday=0)
      const targetDay = resetDayOfWeek ?? 0;
      const dayDiff = (today.getDay() - targetDay + 7) % 7;
      const lastOccurrence = new Date(today);
      lastOccurrence.setDate(today.getDate() - dayDiff);
      const occurrenceStr = lastOccurrence.toISOString().slice(0, 10);
      return lastReset < occurrenceStr;
    }

    case "monthly": {
      // Find most recent past occurrence of resetDayOfMonth (default 1st)
      const targetDay = resetDayOfMonth ?? 1;
      let resetDate = new Date(today.getFullYear(), today.getMonth(), targetDay);
      if (resetDate > today) {
        resetDate = new Date(today.getFullYear(), today.getMonth() - 1, targetDay);
      }
      const resetStr = resetDate.toISOString().slice(0, 10);
      return lastReset < resetStr;
    }

    default:
      return false;
  }
}
