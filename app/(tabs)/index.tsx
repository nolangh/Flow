/**
 * Dashboard Screen
 *
 * The main hub. Design rules strictly followed:
 *   - Pure black (#000000) canvas
 *   - Neon green for under-budget / positive states
 *   - Danger pink for over-budget / negative states
 *   - 3D pill-shaped buttons (filled + darker bottom border shadow)
 *   - Bezier curve chart with glowing leading-edge dot
 *   - All colors shift dynamically based on budget health
 */
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  useWindowDimensions,
  Platform,
} from "react-native";
import { useEffect, useState } from "react";
import { router } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { format } from "date-fns";
import { useAuthStore } from "@/store/authStore";
import { useBudgetStore } from "@/store/budgetStore";
import { useTransactionStore } from "@/store/transactionStore";
import { useBudgetSummary } from "@/hooks/useBudgetSummary";
import { Colors, getBudgetColor, getBudgetGlow, pillShadow } from "@/constants/theme";
import { formatCurrency, currentYearMonth, formatMonth } from "@/lib/utils";
import BezierChart from "@/components/ui/BezierChart";
import ProgressBar from "@/components/ui/ProgressBar";
import Card from "@/components/ui/Card";
import Divider from "@/components/ui/Divider";
import TransactionItem from "@/components/dashboard/TransactionItem";
import AddTransactionModal from "@/components/budget/AddTransactionModal";
import EmptyState from "@/components/ui/EmptyState";
import type { Transaction } from "@/types";

export default function DashboardScreen() {
  const { width } = useWindowDimensions();
  const { user, household } = useAuthStore();
  const { fetchMonthlyBudget, categories, currentMonth, setCurrentMonth } = useBudgetStore();
  const { transactions, fetchTransactions, addManualTransaction } = useTransactionStore();
  const summary = useBudgetSummary();

  const [refreshing, setRefreshing] = useState(false);
  const [showAddTx, setShowAddTx] = useState(false);

  const activeColor = getBudgetColor(summary.totalSpent, summary.totalLimit);
  const activeGlow = getBudgetGlow(summary.totalSpent, summary.totalLimit);
  const cardGlow = summary.isOverBudget ? "pink" : "green";

  const greeting = () => {
    const h = new Date().getHours();
    if (h < 12) return "Good morning";
    if (h < 17) return "Good afternoon";
    return "Good evening";
  };

  const load = async () => {
    await Promise.all([fetchMonthlyBudget(currentMonth), fetchTransactions(currentMonth)]);
  };

  useEffect(() => {
    load();
  }, [currentMonth]);

  const onRefresh = async () => {
    setRefreshing(true);
    await load();
    setRefreshing(false);
  };

  const handlePrevMonth = () => {
    const [y, m] = currentMonth.split("-").map(Number);
    const prev = m === 1 ? `${y - 1}-12` : `${y}-${String(m - 1).padStart(2, "0")}`;
    setCurrentMonth(prev);
  };

  const handleNextMonth = () => {
    const [y, m] = currentMonth.split("-").map(Number);
    const next = m === 12 ? `${y + 1}-01` : `${y}-${String(m + 1).padStart(2, "0")}`;
    if (next <= currentYearMonth()) setCurrentMonth(next);
  };

  const recentTxs = transactions.slice(0, 6);

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: "#000000" }} edges={["top"]}>
      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ paddingBottom: 32 }}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Colors.neonGreen} />
        }
      >
        {/* ── Header ─────────────────────────────────────────────── */}
        <View style={{ paddingHorizontal: 20, paddingTop: 8, paddingBottom: 4 }}>
          <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start" }}>
            <View>
              <Text style={{ color: Colors.text.muted, fontSize: 13 }}>
                {greeting()}, {user?.full_name?.split(" ")[0] ?? "there"}
              </Text>
              <Text style={{ color: Colors.text.primary, fontSize: 22, fontWeight: "800", letterSpacing: -0.5, marginTop: 2 }}>
                {household?.name ?? "My Household"}
              </Text>
            </View>
            <View
              style={{
                width: 40,
                height: 40,
                borderRadius: 20,
                backgroundColor: Colors.neonGreenGlow,
                borderWidth: 1,
                borderColor: Colors.neonGreenBorder,
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <Text style={{ fontSize: 18 }}>🌿</Text>
            </View>
          </View>
        </View>

        {/* ── Month Selector ──────────────────────────────────────── */}
        <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "center", paddingVertical: 14, gap: 20 }}>
          <TouchableOpacity onPress={handlePrevMonth} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
            <Text style={{ color: Colors.text.secondary, fontSize: 20 }}>‹</Text>
          </TouchableOpacity>
          <Text style={{ color: Colors.text.primary, fontSize: 15, fontWeight: "600" }}>
            {formatMonth(`${currentMonth}-01`)}
          </Text>
          <TouchableOpacity
            onPress={handleNextMonth}
            disabled={currentMonth >= currentYearMonth()}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            <Text style={{
              color: currentMonth >= currentYearMonth() ? Colors.text.muted : Colors.text.secondary,
              fontSize: 20,
            }}>›</Text>
          </TouchableOpacity>
        </View>

        {/* ── Hero — Dynamic spending total ───────────────────────── */}
        <View style={{ paddingHorizontal: 20, marginBottom: 6 }}>
          <Card glow={cardGlow} padding={20}>
            {/* Spent / Remaining labels */}
            <View style={{ flexDirection: "row", justifyContent: "space-between", marginBottom: 6 }}>
              <Text style={{ color: Colors.text.muted, fontSize: 12, textTransform: "uppercase", letterSpacing: 0.8 }}>
                Spent
              </Text>
              <Text style={{ color: Colors.text.muted, fontSize: 12, textTransform: "uppercase", letterSpacing: 0.8 }}>
                {summary.isOverBudget ? "Over Budget" : "Remaining"}
              </Text>
            </View>

            <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "flex-end", marginBottom: 16 }}>
              {/* Big spent number */}
              <Text
                style={{
                  color: activeColor,
                  fontSize: 42,
                  fontWeight: "900",
                  letterSpacing: -2,
                  lineHeight: 46,
                  textShadowColor: activeColor,
                  textShadowOffset: { width: 0, height: 0 },
                  textShadowRadius: 12,
                }}
              >
                {formatCurrency(summary.totalSpent)}
              </Text>

              {/* Remaining */}
              <View style={{ alignItems: "flex-end" }}>
                <Text
                  style={{
                    color: summary.isOverBudget ? Colors.dangerPink : Colors.neonGreen,
                    fontSize: 22,
                    fontWeight: "700",
                    letterSpacing: -0.5,
                  }}
                >
                  {summary.isOverBudget ? "-" : ""}{formatCurrency(Math.abs(summary.totalRemaining))}
                </Text>
                <Text style={{ color: Colors.text.muted, fontSize: 11 }}>
                  of {formatCurrency(summary.totalLimit)} budget
                </Text>
              </View>
            </View>

            {/* Overall progress bar */}
            <ProgressBar spent={summary.totalSpent} limit={summary.totalLimit} height={8} />

            <View style={{ flexDirection: "row", justifyContent: "space-between", marginTop: 8 }}>
              <Text style={{ color: Colors.text.muted, fontSize: 11 }}>
                {summary.percentUsed.toFixed(0)}% used
              </Text>
              <Text style={{ color: Colors.neonGreen, fontSize: 11 }}>
                Income: {formatCurrency(summary.totalIncome)}
              </Text>
            </View>
          </Card>
        </View>

        {/* ── Bezier Spending Chart ───────────────────────────────── */}
        <View style={{ paddingHorizontal: 20, marginBottom: 8 }}>
          <Card padding={12}>
            <Text style={{ color: Colors.text.secondary, fontSize: 11, textTransform: "uppercase", letterSpacing: 0.8, marginBottom: 4, paddingLeft: 4 }}>
              Spending This Month
            </Text>
            {summary.spendingData.length > 1 ? (
              <BezierChart
                data={summary.spendingData}
                limit={summary.totalLimit}
                width={width - 64}
                height={120}
              />
            ) : (
              <View style={{ height: 120, alignItems: "center", justifyContent: "center" }}>
                <Text style={{ color: Colors.text.muted, fontSize: 13 }}>No spending data yet</Text>
              </View>
            )}
          </Card>
        </View>

        {/* ── Category pills ──────────────────────────────────────── */}
        <View style={{ marginBottom: 8 }}>
          <View style={{ flexDirection: "row", justifyContent: "space-between", paddingHorizontal: 20, marginBottom: 10 }}>
            <Text style={{ color: Colors.text.secondary, fontSize: 11, textTransform: "uppercase", letterSpacing: 0.8 }}>
              Categories
            </Text>
            <TouchableOpacity onPress={() => router.push("/(tabs)/budget")}>
              <Text style={{ color: Colors.neonGreen, fontSize: 12, fontWeight: "600" }}>See All</Text>
            </TouchableOpacity>
          </View>

          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 20, gap: 10 }}>
            {categories.filter((c) => !c.is_income).slice(0, 8).map((cat) => {
              const spent = cat.spent ?? 0;
              const color = getBudgetColor(spent, cat.monthly_limit);
              const pct = cat.monthly_limit > 0 ? Math.min((spent / cat.monthly_limit) * 100, 100) : 0;
              return (
                <TouchableOpacity
                  key={cat.id}
                  onPress={() => router.push("/(tabs)/budget")}
                  style={{
                    backgroundColor: Colors.bg.surface,
                    borderRadius: 14,
                    padding: 12,
                    width: 110,
                    borderWidth: 1,
                    borderColor: pct >= 100 ? Colors.dangerPinkBorder : Colors.border.subtle,
                  }}
                >
                  <Text style={{ fontSize: 20, marginBottom: 6 }}>{cat.emoji ?? "📦"}</Text>
                  <Text style={{ color: Colors.text.secondary, fontSize: 11 }} numberOfLines={1}>{cat.name}</Text>
                  <Text style={{ color, fontSize: 14, fontWeight: "700", marginTop: 2 }}>
                    {formatCurrency(spent)}
                  </Text>
                  <ProgressBar spent={spent} limit={cat.monthly_limit} height={3} />
                </TouchableOpacity>
              );
            })}

            {categories.filter((c) => !c.is_income).length === 0 && (
              <TouchableOpacity
                onPress={() => router.push("/(tabs)/budget")}
                style={{
                  backgroundColor: Colors.bg.surface,
                  borderRadius: 14,
                  padding: 14,
                  borderWidth: 1,
                  borderColor: Colors.neonGreenBorder,
                  borderStyle: "dashed",
                  alignItems: "center",
                  justifyContent: "center",
                  width: 110,
                  gap: 4,
                }}
              >
                <Text style={{ fontSize: 22 }}>+</Text>
                <Text style={{ color: Colors.neonGreen, fontSize: 11, fontWeight: "600" }}>Add Category</Text>
              </TouchableOpacity>
            )}
          </ScrollView>
        </View>

        {/* ── Recent Transactions ─────────────────────────────────── */}
        <View style={{ paddingHorizontal: 20 }}>
          <View style={{ flexDirection: "row", justifyContent: "space-between", marginBottom: 4 }}>
            <Text style={{ color: Colors.text.secondary, fontSize: 11, textTransform: "uppercase", letterSpacing: 0.8 }}>
              Recent
            </Text>
            <TouchableOpacity onPress={() => router.push("/(tabs)/budget")}>
              <Text style={{ color: Colors.neonGreen, fontSize: 12, fontWeight: "600" }}>See All</Text>
            </TouchableOpacity>
          </View>

          <Card padding={0}>
            {recentTxs.length === 0 ? (
              <EmptyState icon="💸" title="No transactions yet" subtitle="Add your first transaction below." />
            ) : (
              <View style={{ paddingHorizontal: 14 }}>
                {recentTxs.map((tx, idx) => (
                  <View key={tx.id}>
                    <TransactionItem transaction={tx} />
                    {idx < recentTxs.length - 1 && <Divider />}
                  </View>
                ))}
              </View>
            )}
          </Card>
        </View>

        {/* ── Add Transaction CTA ─────────────────────────────────── */}
        <View style={{ paddingHorizontal: 20, marginTop: 20 }}>
          <TouchableOpacity
            onPress={() => setShowAddTx(true)}
            style={{
              backgroundColor: activeColor,
              borderRadius: 9999,
              paddingVertical: 16,
              alignItems: "center",
              borderBottomWidth: 3,
              borderBottomColor: summary.isOverBudget ? Colors.dangerPinkDim : Colors.neonGreenDim,
              ...pillShadow(activeColor),
            }}
          >
            <Text style={{ color: "#000", fontWeight: "700", fontSize: 16 }}>+ Add Transaction</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>

      <AddTransactionModal
        visible={showAddTx}
        categories={categories}
        onClose={() => setShowAddTx(false)}
        onAdd={async (data) => {
          await addManualTransaction({ ...data, pending: false, is_manual: true });
        }}
      />
    </SafeAreaView>
  );
}
