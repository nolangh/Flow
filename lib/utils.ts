import { format, parseISO, startOfMonth, endOfMonth } from "date-fns";

// ─── Formatting ────────────────────────────────────────────────────────────

export function formatCurrency(
  amount: number,
  currency = "USD",
  showSign = false
): string {
  const formatted = new Intl.NumberFormat("en-US", {
    style: "currency",
    currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(Math.abs(amount));

  if (showSign && amount > 0) return `+${formatted}`;
  if (amount < 0) return `-${formatted}`;
  return formatted;
}

export function formatMonth(date: Date | string): string {
  const d = typeof date === "string" ? parseISO(date) : date;
  return format(d, "MMMM yyyy");
}

export function formatDate(date: Date | string): string {
  const d = typeof date === "string" ? parseISO(date) : date;
  return format(d, "MMM d");
}

export function formatDateTime(date: Date | string): string {
  const d = typeof date === "string" ? parseISO(date) : date;
  return format(d, "MMM d, h:mm a");
}

export function currentYearMonth(): string {
  return format(new Date(), "yyyy-MM");
}

export function monthBounds(yearMonth: string): { start: string; end: string } {
  const date = parseISO(`${yearMonth}-01`);
  return {
    start: format(startOfMonth(date), "yyyy-MM-dd"),
    end: format(endOfMonth(date), "yyyy-MM-dd"),
  };
}

// ─── Budget calculations ───────────────────────────────────────────────────

export function calculateBudgetPercent(spent: number, limit: number): number {
  if (limit === 0) return 0;
  return Math.min((spent / limit) * 100, 150); // cap display at 150%
}

export function isOverBudget(spent: number, limit: number): boolean {
  return limit > 0 && spent > limit;
}

// ─── Chart helpers ─────────────────────────────────────────────────────────

/**
 * Build cumulative spending data points for the current month,
 * filling forward from today with the last known value.
 */
export function buildCumulativeSpendingData(
  transactions: { date: string; amount: number }[],
  daysInMonth: number
): { day: number; cumulative: number; daily: number }[] {
  const daily: Record<number, number> = {};

  for (const tx of transactions) {
    const day = parseInt(tx.date.split("-")[2], 10);
    daily[day] = (daily[day] ?? 0) + tx.amount;
  }

  const points: { day: number; cumulative: number; daily: number }[] = [];
  let cumulative = 0;

  for (let d = 1; d <= daysInMonth; d++) {
    const dailyAmount = daily[d] ?? 0;
    cumulative += dailyAmount;
    points.push({ day: d, cumulative, daily: dailyAmount });
  }

  return points;
}

// ─── Plaid category mapping ────────────────────────────────────────────────

const PLAID_CATEGORY_MAP: Record<string, string> = {
  "Food and Drink": "Groceries",
  "Food and Drink > Restaurants": "Dining Out",
  "Food and Drink > Coffee Shop": "Dining Out",
  "Shops > Groceries": "Groceries",
  "Shops": "Shopping",
  "Travel > Gas Stations": "Transport",
  "Travel > Taxi": "Transport",
  "Travel > Ride Share": "Transport",
  "Travel > Public Transportation": "Transport",
  "Healthcare > Medical": "Healthcare",
  "Healthcare > Pharmacy": "Healthcare",
  "Recreation > Gyms and Fitness Centers": "Health & Fitness",
  "Service > Streaming": "Subscriptions",
  "Service > Software": "Subscriptions",
  "Transfer > Credit": "Income",
  "Transfer > Payroll": "Income",
};

export function guessCategoryName(plaidCategories: string[]): string {
  const key = plaidCategories.join(" > ");
  return PLAID_CATEGORY_MAP[key] ?? plaidCategories[0] ?? "Uncategorized";
}

// ─── Misc ──────────────────────────────────────────────────────────────────

export function generateInviteCode(): string {
  return Math.random().toString(36).substring(2, 8).toUpperCase();
}

export function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}
