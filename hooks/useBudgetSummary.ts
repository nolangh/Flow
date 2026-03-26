/**
 * useBudgetSummary
 *
 * Derives high-level budget health metrics from the current month's
 * transactions and category limits. Returns the values needed by
 * the Dashboard hero section and the BezierChart.
 */
import { useMemo } from "react";
import { getDaysInMonth } from "date-fns";
import { parseISO } from "date-fns";
import { buildCumulativeSpendingData } from "@/lib/utils";
import { useTransactionStore } from "@/store/transactionStore";
import { useBudgetStore } from "@/store/budgetStore";
import type { SpendingDataPoint } from "@/types";

export interface BudgetSummary {
  totalIncome: number;
  totalLimit: number;
  totalSpent: number;
  totalRemaining: number;
  percentUsed: number;
  isOverBudget: boolean;
  spendingData: SpendingDataPoint[];
  daysInMonth: number;
}

export function useBudgetSummary(): BudgetSummary {
  const { transactions } = useTransactionStore();
  const { monthlyBudget, categories, currentMonth } = useBudgetStore();

  return useMemo(() => {
    const daysInMonth = getDaysInMonth(parseISO(`${currentMonth}-01`));

    const totalIncome = categories
      .filter((c) => c.is_income)
      .reduce((sum, c) => sum + c.monthly_limit, 0);

    const totalLimit = categories
      .filter((c) => !c.is_income)
      .reduce((sum, c) => sum + c.monthly_limit, 0);

    const debits = transactions.filter((tx) => tx.type === "debit");
    const totalSpent = debits.reduce((sum, tx) => sum + tx.amount, 0);
    const totalRemaining = totalLimit - totalSpent;
    const percentUsed = totalLimit > 0 ? (totalSpent / totalLimit) * 100 : 0;

    const spendingData = buildCumulativeSpendingData(
      debits.map((tx) => ({ date: tx.date, amount: tx.amount })),
      daysInMonth
    );

    return {
      totalIncome,
      totalLimit,
      totalSpent,
      totalRemaining,
      percentUsed,
      isOverBudget: totalLimit > 0 && totalSpent > totalLimit,
      spendingData,
      daysInMonth,
    };
  }, [transactions, categories, monthlyBudget, currentMonth]);
}
