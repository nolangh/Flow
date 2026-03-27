import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  useWindowDimensions,
  StatusBar,
} from "react-native";
import { useEffect, useState } from "react";
import { router } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useAuthStore } from "@/store/authStore";
import { useBudgetStore } from "@/store/budgetStore";
import { useTransactionStore } from "@/store/transactionStore";
import { useBudgetSummary } from "@/hooks/useBudgetSummary";
import { Colors, getBudgetColor, pillShadow } from "@/constants/theme";
import { formatCurrency, currentYearMonth, formatMonth } from "@/lib/utils";
import BezierChart from "@/components/ui/BezierChart";
import ProgressBar from "@/components/ui/ProgressBar";
import Divider from "@/components/ui/Divider";
import TransactionItem from "@/components/dashboard/TransactionItem";
import AddTransactionModal from "@/components/budget/AddTransactionModal";
import EmptyState from "@/components/ui/EmptyState";

export default function DashboardScreen() {
  const { width } = useWindowDimensions();
  const { user, household } = useAuthStore();
  const { fetchMonthlyBudget, categories, currentMonth, setCurrentMonth } = useBudgetStore();
  const { transactions, fetchTransactions, addManualTransaction } = useTransactionStore();
  const summary = useBudgetSummary();

  const [refreshing, setRefreshing] = useState(false);
  const [showAddTx, setShowAddTx] = useState(false);
  const [balanceVisible, setBalanceVisible] = useState(true);

  const activeColor = getBudgetColor(summary.totalSpent, summary.totalLimit);

  const greeting = () => {
    const h = new Date().getHours();
    if (h < 12) return "Morning";
    if (h < 17) return "Afternoon";
    return "Evening";
  };

  const load = async () => {
    await Promise.all([fetchMonthlyBudget(currentMonth), fetchTransactions(currentMonth)]);
  };

  useEffect(() => { load(); }, [currentMonth]);

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
  const firstName = user?.full_name?.split(" ")[0] ?? "there";

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: "#000" }} edges={["top"]}>
      <StatusBar barStyle="light-content" />
      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ paddingBottom: 32 }}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Colors.accent} />
        }
      >
        {/* ── Header ── */}
        <View style={{
          flexDirection: "row", justifyContent: "space-between",
          alignItems: "center", paddingHorizontal: 20, paddingTop: 6, paddingBottom: 20,
        }}>
          <View>
            <Text style={{ color: Colors.text.muted, fontSize: 13 }}>
              Good {greeting()}, {firstName}
            </Text>
            <Text style={{ color: Colors.text.primary, fontSize: 20, fontWeight: "700", letterSpacing: -0.5, marginTop: 1 }}>
              {household?.name ?? "My Household"}
            </Text>
          </View>
          <TouchableOpacity
            style={{
              width: 40, height: 40, borderRadius: 20,
              backgroundColor: Colors.bg.surface,
              borderWidth: 1, borderColor: Colors.border.subtle,
              alignItems: "center", justifyContent: "center",
            }}
            onPress={() => router.push("/(tabs)/settings")}
          >
            <Text style={{ fontSize: 18, fontWeight: "700", color: Colors.accent }}>
              {firstName.charAt(0).toUpperCase()}
            </Text>
          </TouchableOpacity>
        </View>

        {/* ── Balance Hero ── */}
        <View style={{
          marginHorizontal: 20, marginBottom: 16,
          backgroundColor: Colors.bg.surface,
          borderRadius: 24,
          padding: 22,
          borderWidth: 1,
          borderColor: Colors.border.subtle,
        }}>
          {/* Month nav */}
          <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 18 }}>
            <TouchableOpacity onPress={handlePrevMonth} style={{ padding: 4 }}>
              <Ionicons name="chevron-back" size={18} color={Colors.text.muted} />
            </TouchableOpacity>
            <Text style={{ color: Colors.text.secondary, fontSize: 13, fontWeight: "600" }}>
              {formatMonth(`${currentMonth}-01`)}
            </Text>
            <TouchableOpacity
              onPress={handleNextMonth}
              disabled={currentMonth >= currentYearMonth()}
              style={{ padding: 4 }}
            >
              <Ionicons
                name="chevron-forward"
                size={18}
                color={currentMonth >= currentYearMonth() ? Colors.text.muted : Colors.text.secondary}
              />
            </TouchableOpacity>
          </View>

          {/* Big balance */}
          <View style={{ alignItems: "center", marginBottom: 20 }}>
            <Text style={{ color: Colors.text.muted, fontSize: 12, fontWeight: "600", letterSpacing: 0.8, textTransform: "uppercase", marginBottom: 6 }}>
              Total Spent
            </Text>
            <TouchableOpacity onPress={() => setBalanceVisible(!balanceVisible)}>
              <Text style={{
                color: activeColor,
                fontSize: 48,
                fontWeight: "800",
                letterSpacing: -2,
                lineHeight: 54,
              }}>
                {balanceVisible ? formatCurrency(summary.totalSpent) : "••••••"}
              </Text>
            </TouchableOpacity>
            <Text style={{ color: Colors.text.muted, fontSize: 13, marginTop: 4 }}>
              {balanceVisible
                ? `${formatCurrency(Math.abs(summary.totalRemaining))} ${summary.isOverBudget ? "over budget" : "remaining"}`
                : "tap to reveal"}
            </Text>
          </View>

          {/* Progress bar */}
          <ProgressBar spent={summary.totalSpent} limit={summary.totalLimit} height={6} />

          {/* Stats row */}
          <View style={{ flexDirection: "row", justifyContent: "space-between", marginTop: 16, paddingTop: 16, borderTopWidth: 1, borderTopColor: Colors.border.dim }}>
            {[
              { label: "Income", value: summary.totalIncome, color: Colors.accent },
              { label: "Spent", value: summary.totalSpent, color: activeColor },
              { label: "Budget", value: summary.totalLimit, color: Colors.text.secondary },
            ].map(({ label, value, color }) => (
              <View key={label} style={{ alignItems: "center" }}>
                <Text style={{ color: Colors.text.muted, fontSize: 11, marginBottom: 4 }}>{label}</Text>
                <Text style={{ color, fontSize: 15, fontWeight: "700", letterSpacing: -0.3 }}>
                  {formatCurrency(value)}
                </Text>
              </View>
            ))}
          </View>
        </View>

        {/* ── Spending Chart ── */}
        <View style={{ marginHorizontal: 20, marginBottom: 16 }}>
          <View style={{
            backgroundColor: Colors.bg.surface,
            borderRadius: 20,
            padding: 16,
            borderWidth: 1,
            borderColor: Colors.border.subtle,
          }}>
            <Text style={{ color: Colors.text.muted, fontSize: 11, fontWeight: "600", textTransform: "uppercase", letterSpacing: 0.8, marginBottom: 8 }}>
              Spending Trend
            </Text>
            {summary.spendingData.length > 1 ? (
              <BezierChart
                data={summary.spendingData}
                limit={summary.totalLimit}
                width={width - 72}
                height={110}
              />
            ) : (
              <View style={{ height: 110, alignItems: "center", justifyContent: "center" }}>
                <Text style={{ color: Colors.text.muted, fontSize: 13 }}>No spending data yet</Text>
              </View>
            )}
          </View>
        </View>

        {/* ── Category pills ── */}
        <View style={{ marginBottom: 16 }}>
          <View style={{ flexDirection: "row", justifyContent: "space-between", paddingHorizontal: 20, marginBottom: 12 }}>
            <Text style={{ color: Colors.text.muted, fontSize: 11, fontWeight: "600", textTransform: "uppercase", letterSpacing: 0.8 }}>
              Categories
            </Text>
            <TouchableOpacity onPress={() => router.push("/(tabs)/budget")}>
              <Text style={{ color: Colors.accent, fontSize: 13, fontWeight: "600" }}>See All</Text>
            </TouchableOpacity>
          </View>

          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={{ paddingHorizontal: 20, gap: 10 }}
          >
            {categories.filter((c) => !c.is_income).slice(0, 8).map((cat) => {
              const spent = cat.spent ?? 0;
              const limit = cat.monthly_limit;

              // Fixed bills: green when paid, neutral when not yet paid — never red
              const isFixed = cat.is_fixed;
              const paid = isFixed && spent >= limit && limit > 0;
              const color = isFixed
                ? paid ? Colors.accent : Colors.text.secondary
                : getBudgetColor(spent, limit);
              const borderColor = isFixed
                ? paid ? Colors.accentBorder : Colors.border.subtle
                : spent > limit ? Colors.dangerBorder : Colors.border.subtle;

              const pct = limit > 0 ? Math.min((spent / limit) * 100, 100) : 0;

              return (
                <TouchableOpacity
                  key={cat.id}
                  onPress={() => router.push("/(tabs)/budget")}
                  style={{
                    backgroundColor: Colors.bg.surface,
                    borderRadius: 16,
                    padding: 14,
                    width: 116,
                    borderWidth: 1,
                    borderColor,
                  }}
                >
                  <Text style={{ fontSize: 22, marginBottom: 8 }}>{cat.emoji ?? "📦"}</Text>
                  <Text style={{ color: Colors.text.muted, fontSize: 11, fontWeight: "500" }} numberOfLines={1}>
                    {cat.name}
                  </Text>
                  {isFixed ? (
                    <>
                      <Text style={{ color, fontSize: 15, fontWeight: "700", marginTop: 2, letterSpacing: -0.3 }}>
                        {formatCurrency(limit)}
                      </Text>
                      <Text style={{ color: paid ? Colors.accent : Colors.text.muted, fontSize: 10, marginTop: 6 }}>
                        {paid ? "✓ Paid" : "Unpaid"}
                      </Text>
                    </>
                  ) : (
                    <>
                      <Text style={{ color, fontSize: 15, fontWeight: "700", marginTop: 2, letterSpacing: -0.3 }}>
                        {formatCurrency(spent)}
                      </Text>
                      <View style={{ marginTop: 8 }}>
                        <ProgressBar spent={spent} limit={limit} height={3} />
                      </View>
                      <Text style={{ color: Colors.text.muted, fontSize: 10, marginTop: 4 }}>
                        {Math.round(pct)}%
                      </Text>
                    </>
                  )}
                </TouchableOpacity>
              );
            })}

            {categories.filter((c) => !c.is_income).length === 0 && (
              <TouchableOpacity
                onPress={() => router.push("/(tabs)/budget")}
                style={{
                  backgroundColor: Colors.bg.surface,
                  borderRadius: 16,
                  padding: 14,
                  borderWidth: 1,
                  borderColor: Colors.accentBorder,
                  borderStyle: "dashed",
                  alignItems: "center",
                  justifyContent: "center",
                  width: 116,
                  height: 116,
                  gap: 6,
                }}
              >
                <Ionicons name="add-circle-outline" size={24} color={Colors.accent} />
                <Text style={{ color: Colors.accent, fontSize: 11, fontWeight: "600", textAlign: "center" }}>
                  Add Category
                </Text>
              </TouchableOpacity>
            )}
          </ScrollView>
        </View>

        {/* ── Recent Transactions ── */}
        <View style={{ paddingHorizontal: 20 }}>
          <View style={{ flexDirection: "row", justifyContent: "space-between", marginBottom: 12 }}>
            <Text style={{ color: Colors.text.muted, fontSize: 11, fontWeight: "600", textTransform: "uppercase", letterSpacing: 0.8 }}>
              Recent Activity
            </Text>
            <TouchableOpacity onPress={() => router.push("/(tabs)/budget")}>
              <Text style={{ color: Colors.accent, fontSize: 13, fontWeight: "600" }}>See All</Text>
            </TouchableOpacity>
          </View>

          <View style={{
            backgroundColor: Colors.bg.surface,
            borderRadius: 20,
            borderWidth: 1,
            borderColor: Colors.border.subtle,
            overflow: "hidden",
          }}>
            {recentTxs.length === 0 ? (
              <EmptyState title="No transactions yet" subtitle="Add your first transaction below." />
            ) : (
              <View style={{ paddingHorizontal: 16 }}>
                {recentTxs.map((tx, idx) => (
                  <View key={tx.id}>
                    <TransactionItem transaction={tx} />
                    {idx < recentTxs.length - 1 && <Divider />}
                  </View>
                ))}
              </View>
            )}
          </View>
        </View>

        {/* ── Add Transaction ── */}
        <View style={{ paddingHorizontal: 20, marginTop: 20 }}>
          <TouchableOpacity
            onPress={() => setShowAddTx(true)}
            style={{
              backgroundColor: Colors.accent,
              borderRadius: 9999,
              paddingVertical: 17,
              alignItems: "center",
              ...pillShadow(Colors.accent),
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
