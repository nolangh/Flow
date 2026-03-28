import {
  View,
  ScrollView,
  TouchableOpacity,
  Alert,
  RefreshControl,
  Platform,
} from "react-native";
import { Text } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useEffect, useMemo, useState } from "react";
import { Ionicons } from "@expo/vector-icons";
import { format, startOfWeek, endOfWeek, parseISO, isWithinInterval } from "date-fns";

import { Colors, Fonts, getBudgetColor } from "@/constants/theme";
import { useBudgetStore } from "@/store/budgetStore";
import { useTransactionStore } from "@/store/transactionStore";
import { formatCurrency, currentYearMonth } from "@/lib/utils";
import type { BudgetCategory } from "@/types";
import EditCategoryModal from "@/components/budget/EditCategoryModal";

// ─── Helpers ───────────────────────────────────────────────────────────────

function daysInMonth(yearMonth: string): number {
  const [y, m] = yearMonth.split("-").map(Number);
  return new Date(y, m, 0).getDate();
}

function daysLeftInMonth(yearMonth: string): number {
  const today = new Date();
  const [y, m] = yearMonth.split("-").map(Number);
  const last = new Date(y, m, 0).getDate();
  const current = today.getMonth() + 1 === m && today.getFullYear() === y
    ? today.getDate()
    : last;
  return last - current;
}

function daysLeftInWeek(): number {
  const today = new Date();
  const dayOfWeek = today.getDay(); // 0=Sun, 1=Mon...6=Sat
  const mondayBased = dayOfWeek === 0 ? 6 : dayOfWeek - 1; // 0=Mon...6=Sun
  return 6 - mondayBased; // days remaining after today (Mon=6, Tue=5, ... Sun=0)
}

function weekRangeLabel(): string {
  const today = new Date();
  const start = startOfWeek(today, { weekStartsOn: 1 });
  const end = endOfWeek(today, { weekStartsOn: 1 });
  const sameMonth = start.getMonth() === end.getMonth();
  if (sameMonth) {
    return `${format(start, "MMM d")}–${format(end, "d")}`;
  }
  return `${format(start, "MMM d")} – ${format(end, "MMM d")}`;
}

// ─── Sub-components ────────────────────────────────────────────────────────

function StatBar({
  label,
  spent,
  limit,
  color,
  sublabel,
}: {
  label: string;
  spent: number;
  limit: number;
  color: string;
  sublabel?: string;
}) {
  const over = spent > limit && limit > 0;
  const pct = limit > 0 ? Math.min(spent / limit, 1) : 0;
  const remaining = limit - spent;

  return (
    <View style={{ gap: 10 }}>
      <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "flex-end" }}>
        <Text style={{ color: Colors.text.muted, fontSize: 11, fontFamily: Fonts.semiBold, textTransform: "uppercase", letterSpacing: 0.7 }}>
          {label}
        </Text>
        {sublabel ? (
          <Text style={{ color: Colors.text.muted, fontSize: 11, fontFamily: Fonts.medium }}>{sublabel}</Text>
        ) : null}
      </View>

      <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "baseline" }}>
        <Text style={{ color: color, fontSize: 28, fontFamily: Fonts.extraBold, letterSpacing: -1 }}>
          {formatCurrency(spent)}
        </Text>
        <Text style={{ color: Colors.text.muted, fontSize: 14, fontFamily: Fonts.medium }}>
          of {formatCurrency(limit)}
        </Text>
      </View>

      {/* Track */}
      <View style={{ height: 8, borderRadius: 4, backgroundColor: Colors.bg.raised, overflow: "hidden" }}>
        <View
          style={{
            height: 8,
            borderRadius: 4,
            width: `${Math.round(pct * 100)}%`,
            backgroundColor: color,
          }}
        />
      </View>

      <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
        {over ? (
          <View style={{ flexDirection: "row", alignItems: "center", gap: 4 }}>
            <Ionicons name="warning" size={12} color={Colors.danger} />
            <Text style={{ color: Colors.danger, fontSize: 12, fontFamily: Fonts.semiBold }}>
              {formatCurrency(Math.abs(remaining))} over budget
            </Text>
          </View>
        ) : (
          <Text style={{ color: Colors.text.secondary, fontSize: 13, fontFamily: Fonts.medium }}>
            {formatCurrency(remaining)} remaining
          </Text>
        )}
        <Text style={{ color: Colors.text.muted, fontSize: 12, fontFamily: Fonts.medium }}>
          {limit > 0 ? `${Math.round(pct * 100)}%` : "—"}
        </Text>
      </View>
    </View>
  );
}

function AllowanceChip({
  icon,
  label,
  amount,
}: {
  icon: string;
  label: string;
  amount: number;
}) {
  return (
    <View style={{
      flex: 1,
      backgroundColor: Colors.bg.raised,
      borderRadius: 14,
      padding: 14,
      alignItems: "center",
      gap: 4,
      borderWidth: 1,
      borderColor: Colors.border.subtle,
    }}>
      <Text style={{ fontSize: 20 }}>{icon}</Text>
      <Text style={{ color: Colors.accent, fontSize: 17, fontFamily: Fonts.extraBold, letterSpacing: -0.5 }}>
        {formatCurrency(amount)}
      </Text>
      <Text style={{ color: Colors.text.muted, fontSize: 11, fontFamily: Fonts.medium }}>{label}</Text>
    </View>
  );
}

// ─── Main Screen ───────────────────────────────────────────────────────────

export default function CategoryDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const month = useBudgetStore((s) => s.currentMonth);
  const categories = useBudgetStore((s) => s.categories);
  const monthlyBudget = useBudgetStore((s) => s.monthlyBudget);
  const { fetchCategories, updateCategory, deleteCategory, fetchMonthlyBudget } = useBudgetStore();
  const { transactions, fetchTransactions } = useTransactionStore();

  const [showEdit, setShowEdit] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const category = useMemo(
    () => categories.find((c) => c.id === id) ?? null,
    [categories, id]
  );

  const spentMonthly = useMemo(() => {
    if (!monthlyBudget?.categories) return category?.spent ?? 0;
    const found = monthlyBudget.categories.find((c) => c.id === id);
    return found?.spent ?? category?.spent ?? 0;
  }, [monthlyBudget, category, id]);

  // ── Time-based filters ────────────────────────────────────────────────────
  const catTransactions = useMemo(
    () => transactions.filter(
      (tx) => tx.budget_category_id === id && tx.type === "debit"
    ),
    [transactions, id]
  );

  const today = new Date();
  const todayStr = format(today, "yyyy-MM-dd");
  const weekStart = startOfWeek(today, { weekStartsOn: 1 });
  const weekEnd = endOfWeek(today, { weekStartsOn: 1 });

  const spentToday = useMemo(
    () => catTransactions
      .filter((tx) => tx.date === todayStr)
      .reduce((sum, tx) => sum + tx.amount, 0),
    [catTransactions, todayStr]
  );

  const spentThisWeek = useMemo(
    () => catTransactions
      .filter((tx) => {
        const d = parseISO(tx.date);
        return isWithinInterval(d, { start: weekStart, end: weekEnd });
      })
      .reduce((sum, tx) => sum + tx.amount, 0),
    [catTransactions, weekStart, weekEnd]
  );

  // ── Budget math ───────────────────────────────────────────────────────────
  const limit = category?.monthly_limit ?? 0;
  const totalDays = daysInMonth(month);
  const dailyAllowance = limit > 0 ? limit / totalDays : 0;
  const weeklyAllowance = dailyAllowance * 7;

  const remainingMonthDays = daysLeftInMonth(month);
  const remainingWeekDays = daysLeftInWeek();

  // ── Color computation ─────────────────────────────────────────────────────
  const monthColor = getBudgetColor(spentMonthly, limit);
  const weekColor = getBudgetColor(spentThisWeek, weeklyAllowance);
  const dayColor = getBudgetColor(spentToday, dailyAllowance);

  // ── Grouped transactions ──────────────────────────────────────────────────
  const grouped = useMemo(() => {
    const groups: Record<string, typeof catTransactions> = {};
    for (const tx of catTransactions) {
      const key = tx.date;
      if (!groups[key]) groups[key] = [];
      groups[key].push(tx);
    }
    return Object.entries(groups).sort(([a], [b]) => b.localeCompare(a));
  }, [catTransactions]);

  const onRefresh = async () => {
    setRefreshing(true);
    await Promise.all([fetchCategories(), fetchTransactions(month), fetchMonthlyBudget(month)]);
    setRefreshing(false);
  };

  useEffect(() => {
    if (!categories.length) fetchCategories();
    fetchTransactions(month);
    if (!monthlyBudget) fetchMonthlyBudget(month);
  }, []);

  if (!category) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: Colors.bg.default, alignItems: "center", justifyContent: "center" }}>
        <Text style={{ color: Colors.text.muted, fontFamily: Fonts.medium }}>Category not found</Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: Colors.bg.default }} edges={["top", "left", "right"]}>
      {/* ── Header ─────────────────────────────────────────────────────── */}
      <View style={{
        flexDirection: "row", alignItems: "center",
        paddingHorizontal: 20, paddingTop: 8, paddingBottom: 16, gap: 12,
      }}>
        <TouchableOpacity
          onPress={() => router.back()}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          style={{
            width: 36, height: 36, borderRadius: 10,
            backgroundColor: Colors.bg.surface,
            alignItems: "center", justifyContent: "center",
            borderWidth: 1, borderColor: Colors.border.subtle,
          }}
        >
          <Ionicons name="chevron-back" size={20} color={Colors.text.primary} />
        </TouchableOpacity>

        <Text style={{ fontSize: 26, lineHeight: 32 }}>{category.emoji ?? "📦"}</Text>

        <Text style={{ flex: 1, color: Colors.text.primary, fontSize: 20, fontFamily: Fonts.bold }}>
          {category.name}
        </Text>

        <TouchableOpacity
          onPress={() => setShowEdit(true)}
          style={{
            width: 36, height: 36, borderRadius: 10,
            backgroundColor: Colors.bg.surface,
            alignItems: "center", justifyContent: "center",
            borderWidth: 1, borderColor: Colors.border.subtle,
          }}
        >
          <Ionicons name="pencil-outline" size={17} color={Colors.text.secondary} />
        </TouchableOpacity>
      </View>

      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 100, gap: 16 }}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Colors.accent} />
        }
      >
        {/* ── Allowance chips ─────────────────────────────────────────── */}
        <View style={{ flexDirection: "row", gap: 10, marginBottom: 4 }}>
          <AllowanceChip icon="📅" label="per day" amount={dailyAllowance} />
          <AllowanceChip icon="📆" label="per week" amount={weeklyAllowance} />
          <AllowanceChip icon="🗓️" label="per month" amount={limit} />
        </View>

        {/* ── Monthly breakdown ───────────────────────────────────────── */}
        <View style={{
          backgroundColor: Colors.bg.surface,
          borderRadius: 20,
          padding: 20,
          borderWidth: 1,
          borderColor: Colors.border.subtle,
        }}>
          <StatBar
            label="This Month"
            spent={spentMonthly}
            limit={limit}
            color={monthColor}
            sublabel={`${remainingMonthDays} days left`}
          />
        </View>

        {/* ── Weekly breakdown ────────────────────────────────────────── */}
        <View style={{
          backgroundColor: Colors.bg.surface,
          borderRadius: 20,
          padding: 20,
          borderWidth: 1,
          borderColor: Colors.border.subtle,
        }}>
          <StatBar
            label={`This Week · ${weekRangeLabel()}`}
            spent={spentThisWeek}
            limit={weeklyAllowance}
            color={weekColor}
            sublabel={`${remainingWeekDays} day${remainingWeekDays !== 1 ? "s" : ""} left`}
          />
        </View>

        {/* ── Daily breakdown ─────────────────────────────────────────── */}
        <View style={{
          backgroundColor: Colors.bg.surface,
          borderRadius: 20,
          padding: 20,
          borderWidth: 1,
          borderColor: Colors.border.subtle,
        }}>
          <StatBar
            label={`Today · ${format(today, "EEEE, MMM d")}`}
            spent={spentToday}
            limit={dailyAllowance}
            color={dayColor}
          />
        </View>

        {/* ── Transactions this month ─────────────────────────────────── */}
        <View style={{ marginTop: 8 }}>
          <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
            <Text style={{ color: Colors.text.muted, fontSize: 11, fontFamily: Fonts.semiBold, textTransform: "uppercase", letterSpacing: 0.8 }}>
              Transactions This Month
            </Text>
            <View style={{
              backgroundColor: Colors.bg.surface, borderRadius: 8,
              paddingHorizontal: 8, paddingVertical: 3,
              borderWidth: 1, borderColor: Colors.border.subtle,
            }}>
              <Text style={{ color: Colors.text.secondary, fontSize: 11, fontFamily: Fonts.semiBold }}>
                {catTransactions.length}
              </Text>
            </View>
          </View>

          {grouped.length === 0 ? (
            <View style={{
              backgroundColor: Colors.bg.surface, borderRadius: 16, padding: 32,
              alignItems: "center", borderWidth: 1, borderColor: Colors.border.subtle,
            }}>
              <Text style={{ fontSize: 32, marginBottom: 8 }}>🧾</Text>
              <Text style={{ color: Colors.text.secondary, fontFamily: Fonts.semiBold, fontSize: 15 }}>No transactions yet</Text>
              <Text style={{ color: Colors.text.muted, fontFamily: Fonts.regular, fontSize: 13, marginTop: 4 }}>
                Transactions in this category will appear here.
              </Text>
            </View>
          ) : (
            <View style={{
              backgroundColor: Colors.bg.surface, borderRadius: 16,
              borderWidth: 1, borderColor: Colors.border.subtle, overflow: "hidden",
            }}>
              {grouped.map(([date, txs], gi) => {
                const d = parseISO(date);
                const isToday = date === todayStr;
                const isThisWeek = isWithinInterval(d, { start: weekStart, end: weekEnd });

                return (
                  <View key={date}>
                    {/* Date group header */}
                    <View style={{
                      flexDirection: "row", justifyContent: "space-between", alignItems: "center",
                      paddingHorizontal: 16, paddingVertical: 8,
                      backgroundColor: Colors.bg.raised,
                      borderTopWidth: gi > 0 ? 1 : 0,
                      borderTopColor: Colors.border.subtle,
                    }}>
                      <Text style={{ color: Colors.text.muted, fontSize: 12, fontFamily: Fonts.semiBold }}>
                        {isToday ? "Today" : format(d, "EEEE, MMM d")}
                      </Text>
                      <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
                        {isToday && (
                          <View style={{ backgroundColor: Colors.accentBorder, borderRadius: 4, paddingHorizontal: 6, paddingVertical: 1 }}>
                            <Text style={{ color: Colors.accent, fontSize: 10, fontFamily: Fonts.bold }}>TODAY</Text>
                          </View>
                        )}
                        {!isToday && isThisWeek && (
                          <View style={{ backgroundColor: Colors.bg.surface, borderRadius: 4, paddingHorizontal: 6, paddingVertical: 1, borderWidth: 1, borderColor: Colors.border.subtle }}>
                            <Text style={{ color: Colors.text.muted, fontSize: 10, fontFamily: Fonts.bold }}>THIS WEEK</Text>
                          </View>
                        )}
                        <Text style={{ color: Colors.text.secondary, fontSize: 12, fontFamily: Fonts.semiBold }}>
                          {formatCurrency(txs.reduce((s, t) => s + t.amount, 0))}
                        </Text>
                      </View>
                    </View>

                    {/* Transactions in this date group */}
                    {txs.map((tx, ti) => (
                      <View
                        key={tx.id}
                        style={{
                          flexDirection: "row", alignItems: "center",
                          paddingHorizontal: 16, paddingVertical: 12, gap: 12,
                          borderTopWidth: 1, borderTopColor: Colors.border.subtle,
                        }}
                      >
                        <View style={{
                          width: 36, height: 36, borderRadius: 10,
                          backgroundColor: Colors.bg.raised,
                          alignItems: "center", justifyContent: "center",
                          borderWidth: 1, borderColor: Colors.border.subtle,
                        }}>
                          <Text style={{ fontSize: 16 }}>{category.emoji ?? "📦"}</Text>
                        </View>

                        <View style={{ flex: 1 }}>
                          <Text style={{ color: Colors.text.primary, fontSize: 14, fontFamily: Fonts.semiBold }} numberOfLines={1}>
                            {tx.merchant_name ?? tx.name}
                          </Text>
                          {tx.notes ? (
                            <Text style={{ color: Colors.text.muted, fontSize: 12, fontFamily: Fonts.regular, marginTop: 1 }} numberOfLines={1}>
                              {tx.notes}
                            </Text>
                          ) : null}
                        </View>

                        <Text style={{ color: Colors.text.primary, fontSize: 15, fontFamily: Fonts.bold, letterSpacing: -0.3 }}>
                          {formatCurrency(tx.amount)}
                        </Text>
                      </View>
                    ))}
                  </View>
                );
              })}
            </View>
          )}
        </View>
      </ScrollView>

      {/* ── Edit Modal ──────────────────────────────────────────────────── */}
      <EditCategoryModal
        visible={showEdit}
        category={category}
        onClose={() => setShowEdit(false)}
        onSave={async (catId, data) => {
          await updateCategory(catId, data);
          setShowEdit(false);
        }}
        onDelete={async (catId) => {
          await deleteCategory(catId);
          setShowEdit(false);
          router.back();
        }}
      />
    </SafeAreaView>
  );
}
