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
import { useTasksStore } from "@/store/tasksStore";
import { useBudgetSummary } from "@/hooks/useBudgetSummary";
import { useTodaySummary } from "@/hooks/useTodaySummary";
import { Colors, Fonts, getBudgetColor, pillShadow, useColors} from "@/constants/theme";
import { formatCurrency, currentYearMonth, formatMonth } from "@/lib/utils";
import ProgressBar from "@/components/ui/ProgressBar";
import Divider from "@/components/ui/Divider";
import TransactionItem from "@/components/dashboard/TransactionItem";
import AddTransactionModal from "@/components/budget/AddTransactionModal";
import EmptyState from "@/components/ui/EmptyState";
import { format, parseISO } from "date-fns";
import type { TodaySummary } from "@/hooks/useTodaySummary";
import type { ThemeColors } from "@/constants/themes";

const TASK_PURPLE = "#8b5cf6";

function TodayCard({ summary, Colors }: { summary: TodaySummary; Colors: ThemeColors }) {
  const hasTasks = summary.todayTasks.length > 0;
  const hasEvents = summary.todayEvents.length > 0;
  const hasOverdue = summary.overdueCount > 0;
  if (!hasTasks && !hasEvents && !hasOverdue) return null;

  const pendingTasks = summary.todayTasks.filter((t) => !t.is_completed);
  const displayTasks = pendingTasks.slice(0, 3);
  const displayEvents = summary.todayEvents.slice(0, 2);

  return (
    <View style={{
      marginHorizontal: 20,
      marginBottom: 16,
      backgroundColor: Colors.bg.surface,
      borderRadius: 20,
      borderWidth: 1,
      borderColor: Colors.accentBorder,
      overflow: "hidden",
    }}>
      {/* Header strip */}
      <View style={{
        backgroundColor: Colors.accentSoft,
        paddingHorizontal: 16,
        paddingVertical: 10,
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
      }}>
        <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
          <Text style={{ fontSize: 14 }}>☀️</Text>
          <Text style={{ color: Colors.accent, fontSize: 13, fontFamily: Fonts.bold }}>
            {summary.date}
          </Text>
        </View>
        <TouchableOpacity onPress={() => router.push("/(tabs)/calendar")}>
          <Text style={{ color: Colors.accent, fontSize: 12, fontFamily: Fonts.semiBold }}>
            See all →
          </Text>
        </TouchableOpacity>
      </View>

      <View style={{ paddingHorizontal: 16, paddingVertical: 12, gap: 8 }}>
        {/* Overdue warning */}
        {hasOverdue && (
          <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
            <Ionicons name="warning-outline" size={13} color={Colors.danger} />
            <Text style={{ color: Colors.danger, fontSize: 12, fontFamily: Fonts.semiBold }}>
              {summary.overdueCount} overdue task{summary.overdueCount > 1 ? "s" : ""}
            </Text>
          </View>
        )}

        {/* Today's tasks */}
        {displayTasks.map((task) => (
          <View key={task.id} style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
            <View style={{
              width: 6, height: 6, borderRadius: 3,
              backgroundColor: task.priority === "high" ? Colors.danger : task.priority === "medium" ? Colors.warning : Colors.text.muted,
            }} />
            <Text style={{ flex: 1, color: Colors.text.primary, fontSize: 13, fontFamily: Fonts.medium }} numberOfLines={1}>
              {task.title}
            </Text>
            {task.assigneeName && (
              <View style={{
                backgroundColor: task.assignedByPartner ? TASK_PURPLE + "22" : Colors.accentSoft,
                borderRadius: 10,
                paddingHorizontal: 7,
                paddingVertical: 2,
              }}>
                <Text style={{
                  color: task.assignedByPartner ? TASK_PURPLE : Colors.accent,
                  fontSize: 10,
                  fontFamily: Fonts.bold,
                }}>
                  {task.assignedByPartner ? task.assigneeName : "You"}
                </Text>
              </View>
            )}
          </View>
        ))}

        {pendingTasks.length > 3 && (
          <Text style={{ color: Colors.text.muted, fontSize: 12, marginLeft: 14 }}>
            +{pendingTasks.length - 3} more tasks
          </Text>
        )}

        {/* Today's events */}
        {displayEvents.map((ev) => (
          <View key={ev.id} style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
            <Ionicons name="calendar-outline" size={13} color={Colors.text.muted} />
            <Text style={{ flex: 1, color: Colors.text.secondary, fontSize: 13 }} numberOfLines={1}>
              {!ev.all_day && ev.start_at
                ? `${format(parseISO(ev.start_at), "h:mm a")} — `
                : ""}
              {ev.title}
            </Text>
          </View>
        ))}

        {summary.todayEvents.length > 2 && (
          <Text style={{ color: Colors.text.muted, fontSize: 12, marginLeft: 20 }}>
            +{summary.todayEvents.length - 2} more events
          </Text>
        )}

        {pendingTasks.length === 0 && !hasOverdue && displayEvents.length === 0 && (
          <Text style={{ color: Colors.text.muted, fontSize: 13 }}>All clear today ✓</Text>
        )}
      </View>
    </View>
  );
}

export default function DashboardScreen() {
  const Colors = useColors();
  const { width } = useWindowDimensions();
  const { user, household } = useAuthStore();
  const { fetchMonthlyBudget, categories, currentMonth, setCurrentMonth } = useBudgetStore();
  const { transactions, fetchTransactions, addManualTransaction } = useTransactionStore();
  const { loadTasks } = useTasksStore();
  const summary = useBudgetSummary();
  const todaySummary = useTodaySummary();

  const [refreshing, setRefreshing] = useState(false);
  const [showAddTx, setShowAddTx] = useState(false);
  const [balanceVisible, setBalanceVisible] = useState(true);

  const activeColor = getBudgetColor(summary.totalSpent, summary.totalLimit, Colors);

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
  useEffect(() => { if (household?.id) loadTasks(household.id); }, [household?.id]);

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

  const recentTxs = transactions.slice(0, 3);
  const firstName = user?.full_name?.split(" ")[0] ?? "there";

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: Colors.bg.app }} edges={["top"]}>
      <StatusBar barStyle={Colors.statusBar} />
      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ paddingBottom: 16 }}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Colors.accent} />
        }
      >
        {/* ── Header ── */}
        <View style={{
          flexDirection: "row", justifyContent: "space-between",
          alignItems: "center", paddingHorizontal: 20, paddingTop: 14, paddingBottom: 20,
        }}>
          <View>
            <Text style={{ color: Colors.text.muted, fontSize: 13 }}>
              Good {greeting()}, {firstName}
            </Text>
            <Text style={{ color: Colors.text.primary, fontSize: 20, fontFamily: Fonts.bold, letterSpacing: -0.5, marginTop: 1 }}>
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
            <Text style={{ fontSize: 18, fontFamily: Fonts.bold, color: Colors.accent }}>
              {firstName.charAt(0).toUpperCase()}
            </Text>
          </TouchableOpacity>
        </View>

        {/* ── Today Summary ── */}
        <TodayCard summary={todaySummary} Colors={Colors} />

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
            <Text style={{ color: Colors.text.secondary, fontSize: 13, fontFamily: Fonts.semiBold }}>
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
            <View style={{ flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 6 }}>
              <Text style={{ color: Colors.text.muted, fontSize: 12, fontFamily: Fonts.semiBold, letterSpacing: 0.8, textTransform: "uppercase" }}>
                Total Spent
              </Text>
              <TouchableOpacity
                onPress={() => setBalanceVisible(!balanceVisible)}
                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              >
                <Ionicons
                  name={balanceVisible ? "eye-outline" : "eye-off-outline"}
                  size={16}
                  color={Colors.text.muted}
                />
              </TouchableOpacity>
            </View>
            <Text style={{
              color: activeColor,
              fontSize: 48,
              fontFamily: Fonts.extraBold,
              letterSpacing: -2,
              lineHeight: 54,
            }}>
              {balanceVisible ? formatCurrency(summary.totalSpent) : "••••••"}
            </Text>
            <Text style={{ color: Colors.text.muted, fontSize: 13, marginTop: 4 }}>
              {balanceVisible
                ? `${formatCurrency(Math.abs(summary.totalRemaining))} ${summary.isOverBudget ? "over budget" : "remaining"}`
                : "tap the eye to reveal"}
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
                <Text style={{ color, fontSize: 15, fontFamily: Fonts.bold, letterSpacing: -0.3 }}>
                  {formatCurrency(value)}
                </Text>
              </View>
            ))}
          </View>
        </View>

        {/* ── Category pills ── */}
        <View style={{ marginBottom: 16 }}>
          <View style={{ flexDirection: "row", justifyContent: "space-between", paddingHorizontal: 20, marginBottom: 12 }}>
            <Text style={{ color: Colors.text.muted, fontSize: 11, fontFamily: Fonts.semiBold, textTransform: "uppercase", letterSpacing: 0.8 }}>
              Categories
            </Text>
            <TouchableOpacity onPress={() => router.push("/(tabs)/budget")}>
              <Text style={{ color: Colors.accent, fontSize: 13, fontFamily: Fonts.semiBold }}>See All</Text>
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
                : getBudgetColor(spent, limit, Colors);
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
                  <Text style={{ color: Colors.text.muted, fontSize: 11, fontFamily: Fonts.medium }} numberOfLines={1}>
                    {cat.name}
                  </Text>
                  {isFixed ? (
                    <>
                      <Text style={{ color, fontSize: 15, fontFamily: Fonts.bold, marginTop: 2, letterSpacing: -0.3 }}>
                        {formatCurrency(limit)}
                      </Text>
                      <Text style={{ color: paid ? Colors.accent : Colors.text.muted, fontSize: 10, marginTop: 6 }}>
                        {paid ? "✓ Paid" : "Unpaid"}
                      </Text>
                    </>
                  ) : (
                    <>
                      <Text style={{ color, fontSize: 15, fontFamily: Fonts.bold, marginTop: 2, letterSpacing: -0.3 }}>
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
                <Text style={{ color: Colors.accent, fontSize: 11, fontFamily: Fonts.semiBold, textAlign: "center" }}>
                  Add Category
                </Text>
              </TouchableOpacity>
            )}
          </ScrollView>
        </View>

        {/* ── Recent Transactions ── */}
        <View style={{ paddingHorizontal: 20 }}>
          <View style={{ flexDirection: "row", justifyContent: "space-between", marginBottom: 12 }}>
            <Text style={{ color: Colors.text.muted, fontSize: 11, fontFamily: Fonts.semiBold, textTransform: "uppercase", letterSpacing: 0.8 }}>
              Recent Activity
            </Text>
            <TouchableOpacity onPress={() => router.push("/(tabs)/budget")}>
              <Text style={{ color: Colors.accent, fontSize: 13, fontFamily: Fonts.semiBold }}>See All</Text>
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

      </ScrollView>

      {/* ── Add Button — anchored above tab bar ── */}
      <View style={{ paddingHorizontal: 20, paddingTop: 8, paddingBottom: 16 }}>
        <TouchableOpacity
          onPress={() => setShowAddTx(true)}
          style={{
            backgroundColor: Colors.accent,
            borderRadius: 9999,
            paddingVertical: 16,
            alignItems: "center",
            ...pillShadow(Colors.accent),
          }}
        >
          <Text style={{ color: Colors.text.inverse, fontFamily: Fonts.bold, fontSize: 16 }}>+ Add Transaction</Text>
        </TouchableOpacity>
      </View>

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
