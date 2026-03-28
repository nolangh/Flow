import {
  View,
  Text,
  ScrollView,
  RefreshControl,
  TouchableOpacity,
  StatusBar,
  TextInput,
  Alert,
  Modal,
  Platform,
} from "react-native";
import { useEffect, useState, useMemo } from "react";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useBudgetStore } from "@/store/budgetStore";
import { useTransactionStore } from "@/store/transactionStore";
import { useBudgetSummary } from "@/hooks/useBudgetSummary";
import { Colors, Fonts, getBudgetColor, pillShadow } from "@/constants/theme";
import { formatCurrency, currentYearMonth, formatMonth } from "@/lib/utils";
import Divider from "@/components/ui/Divider";
import ProgressBar from "@/components/ui/ProgressBar";
import CategoryCard from "@/components/budget/CategoryCard";
import AddTransactionModal from "@/components/budget/AddTransactionModal";
import AddCategoryModal from "@/components/budget/AddCategoryModal";
import EditCategoryModal from "@/components/budget/EditCategoryModal";
import TransactionItem from "@/components/dashboard/TransactionItem";
import EmptyState from "@/components/ui/EmptyState";
import AllocationChart from "@/components/budget/AllocationChart";
import AiAnalysisSheet from "@/components/premium/AiAnalysisSheet";
import BudgetAlertBanner from "@/components/budget/BudgetAlertBanner";
import type { BudgetAlert } from "@/components/budget/BudgetAlertBanner";
import BezierChart from "@/components/ui/BezierChart";
import { useWindowDimensions } from "react-native";
import { useRouter } from "expo-router";
import { buildBudgetCsv, buildTransactionCsv, exportCsvFile, pickCsvFile, parseBudgetCsv } from "@/lib/csvUtils";
import type { BudgetSuggestion } from "@/lib/openai";

type BudgetTab = "overview" | "charts" | "transactions";

export default function BudgetScreen() {
  const router = useRouter();
  const { categories, currentMonth, setCurrentMonth, fetchMonthlyBudget, createCategory, updateCategory, deleteCategory, monthlyBudget, setTotalLimit } = useBudgetStore();
  const { transactions, fetchTransactions, addManualTransaction } = useTransactionStore();
  const summary = useBudgetSummary();

  const [tab, setTab] = useState<BudgetTab>("overview");
  const [refreshing, setRefreshing] = useState(false);
  const [showAddTx, setShowAddTx] = useState(false);
  const [showAddCat, setShowAddCat] = useState(false);
  const [showBudgetEdit, setShowBudgetEdit] = useState(false);
  const [showAiSheet, setShowAiSheet] = useState(false);
  const [budgetInput, setBudgetInput] = useState("");
  const [editingCategory, setEditingCategory] = useState<import("@/types").BudgetCategory | null>(null);
  const [dismissedAlerts, setDismissedAlerts] = useState<Set<string>>(new Set());

  const CHART_COLORS = ["#00D632","#3b82f6","#8b5cf6","#f59e0b","#ef4444","#06b6d4","#ec4899","#14b8a6","#f97316","#a78bfa"];

  const chartData = useMemo(() => {
    const spending = categories.filter((c) => !c.is_income);
    return spending.map((c, i) => ({
      label: c.name,
      value: c.monthly_limit,
      color: CHART_COLORS[i % CHART_COLORS.length],
    }));
  }, [categories]);

  const handleExportBudget = async () => {
    try {
      const csv = buildBudgetCsv(categories);
      await exportCsvFile(`flow-budget-${currentMonth}.csv`, csv);
    } catch (err: unknown) {
      Alert.alert("Export", (err as Error).message);
    }
  };

  const handleExportTransactions = async () => {
    try {
      const txWithCat = transactions.map((t) => ({
        ...t,
        category_name: categories.find((c) => c.id === t.category_id)?.name ?? "Uncategorized",
      }));
      const csv = buildTransactionCsv(txWithCat);
      await exportCsvFile(`flow-transactions-${currentMonth}.csv`, csv);
    } catch (err: unknown) {
      Alert.alert("Export", (err as Error).message);
    }
  };

  const handleApplySuggestion = async (categoryName: string, newLimit: number) => {
    const cat = categories.find((c) => c.name.toLowerCase() === categoryName.toLowerCase());
    if (!cat) { Alert.alert("Category not found", `Couldn't find "${categoryName}" in your budget.`); return; }
    await updateCategory(cat.id, { monthly_limit: newLimit });
    await fetchMonthlyBudget(currentMonth);
  };

  const handleApplyAll = async (suggestions: BudgetSuggestion[]) => {
    for (const s of suggestions) {
      const cat = categories.find((c) => c.name.toLowerCase() === s.category.toLowerCase());
      if (cat) await updateCategory(cat.id, { monthly_limit: s.suggestedLimit });
    }
    await fetchMonthlyBudget(currentMonth);
  };

  const load = async () => {
    await Promise.all([fetchMonthlyBudget(currentMonth), fetchTransactions(currentMonth)]);
  };

  useEffect(() => { load(); }, [currentMonth]);

  const onRefresh = async () => { setRefreshing(true); await load(); setRefreshing(false); };

  const handlePrevMonth = () => {
    const [y, m] = currentMonth.split("-").map(Number);
    setCurrentMonth(m === 1 ? `${y - 1}-12` : `${y}-${String(m - 1).padStart(2, "0")}`);
  };
  const handleNextMonth = () => {
    const [y, m] = currentMonth.split("-").map(Number);
    const next = m === 12 ? `${y + 1}-01` : `${y}-${String(m + 1).padStart(2, "0")}`;
    if (next <= currentYearMonth()) setCurrentMonth(next);
  };

  const incomeCategories = categories.filter((c) => c.is_income);
  const fixedCategories = categories.filter((c) => !c.is_income && c.is_fixed);
  const spendCategories = categories.filter((c) => !c.is_income && !c.is_fixed);
  const totalFixed = fixedCategories.reduce((sum, c) => sum + c.monthly_limit, 0);
  const activeColor = getBudgetColor(summary.totalSpent, summary.totalLimit);

  const triggeredAlerts = useMemo<BudgetAlert[]>(() => {
    return spendCategories
      .filter((c) => {
        if (!c.alert_threshold || c.monthly_limit <= 0 || dismissedAlerts.has(c.id)) return false;
        const spent = c.spent ?? 0;
        const pct = (spent / c.monthly_limit) * 100;
        return pct >= c.alert_threshold;
      })
      .map((c) => ({
        categoryId: c.id,
        categoryName: c.name,
        emoji: c.emoji ?? "📦",
        pct: ((c.spent ?? 0) / c.monthly_limit) * 100,
        spent: c.spent ?? 0,
        limit: c.monthly_limit,
        threshold: c.alert_threshold!,
      }));
  }, [spendCategories, dismissedAlerts]);
  const { width } = useWindowDimensions();

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: "#000" }} edges={["top"]}>
      <StatusBar barStyle="light-content" />

      {/* Header */}
      <View style={{
        flexDirection: "row", justifyContent: "space-between",
        alignItems: "center", paddingHorizontal: 20, paddingTop: 14, paddingBottom: 10,
      }}>
        <Text style={{ color: Colors.text.primary, fontSize: 26, fontFamily: Fonts.extraBold, letterSpacing: -0.5 }}>
          Budget
        </Text>

        {/* Right actions */}
        <View style={{ flexDirection: "row", gap: 8, alignItems: "center" }}>
          {/* AI Optimize — prominent labeled button */}
          <TouchableOpacity
            onPress={() => setShowAiSheet(true)}
            style={{
              flexDirection: "row", alignItems: "center", gap: 6,
              backgroundColor: Colors.accentSoft, borderRadius: 20,
              paddingHorizontal: 14, paddingVertical: 8,
              borderWidth: 1, borderColor: Colors.accentBorder,
            }}
          >
            <Ionicons name="sparkles" size={14} color={Colors.accent} />
            <Text style={{ color: Colors.accent, fontSize: 13, fontFamily: Fonts.bold }}>AI Optimize</Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => {
              Alert.alert("Budget Data", "Choose an action:", [
                { text: "Export Categories", onPress: handleExportBudget },
                { text: "Export Transactions", onPress: handleExportTransactions },
                { text: "Import Categories (CSV)", onPress: async () => {
                  try {
                    const csvText = await pickCsvFile();
                    const rows = parseBudgetCsv(csvText);
                    if (rows.length === 0) { Alert.alert("Nothing to import", 'CSV needs "name" and "monthly_limit" columns.'); return; }
                    Alert.alert(`Import ${rows.length} categories?`,
                      rows.slice(0, 3).map((r) => `• ${r.name} ($${r.monthly_limit})`).join("\n") + (rows.length > 3 ? `\n…+${rows.length - 3} more` : ""),
                      [
                        { text: "Cancel", style: "cancel" },
                        { text: "Import", onPress: async () => {
                          let ok = 0;
                          for (const row of rows) {
                            try { await createCategory({ name: row.name, monthly_limit: row.monthly_limit, is_fixed: row.type === "fixed", is_income: row.type === "income", fixed_day_of_month: row.fixed_day_of_month ?? null, emoji: row.emoji ?? null }); ok++; } catch { /* skip */ }
                          }
                          Alert.alert("Import complete", `${ok}/${rows.length} categories imported.`);
                        }},
                      ]
                    );
                  } catch (err: unknown) {
                    const msg = (err as Error).message;
                    if (!msg.includes("No file selected")) Alert.alert("Import failed", msg);
                  }
                }},
                { text: "Cancel", style: "cancel" },
              ]);
            }}
            style={{ width: 36, height: 36, borderRadius: 18, backgroundColor: Colors.bg.surface, alignItems: "center", justifyContent: "center", borderWidth: 1, borderColor: Colors.border.subtle }}
          >
            <Ionicons name="swap-vertical-outline" size={17} color={Colors.text.secondary} />
          </TouchableOpacity>
        </View>
      </View>

      {/* Month nav */}
      <View style={{ flexDirection: "row", alignItems: "center", paddingHorizontal: 20, paddingBottom: 12, gap: 10 }}>
        <TouchableOpacity onPress={handlePrevMonth} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
          <Ionicons name="chevron-back" size={16} color={Colors.text.muted} />
        </TouchableOpacity>
        <Text style={{ color: Colors.text.primary, fontSize: 15, fontFamily: Fonts.semiBold }}>
          {formatMonth(`${currentMonth}-01`)}
        </Text>
        <TouchableOpacity onPress={handleNextMonth} disabled={currentMonth >= currentYearMonth()} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
          <Ionicons name="chevron-forward" size={16} color={currentMonth >= currentYearMonth() ? Colors.border.subtle : Colors.text.muted} />
        </TouchableOpacity>
      </View>


      {/* Budget limit edit modal */}
      <Modal visible={showBudgetEdit} transparent animationType="fade" onRequestClose={() => setShowBudgetEdit(false)}>
        <View style={{ flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: "rgba(0,0,0,0.75)" }}>
          <View style={{
            backgroundColor: Colors.bg.raised,
            borderRadius: 20,
            padding: 24,
            width: "85%",
            borderWidth: 1,
            borderColor: Colors.border.subtle,
            gap: 16,
          }}>
            <Text style={{ color: Colors.text.primary, fontSize: 20, fontFamily: Fonts.bold }}>
              Set Monthly Budget
            </Text>
            <Text style={{ color: Colors.text.muted, fontSize: 13, lineHeight: 18 }}>
              Enter your total monthly spending limit. This is what the progress bars track against.
            </Text>
            <TextInput
              style={{
                backgroundColor: Colors.bg.surface,
                borderRadius: 12, padding: 16,
                color: Colors.text.primary,
                fontSize: 28, fontFamily: Fonts.bold, letterSpacing: -0.5,
                borderWidth: 1, borderColor: Colors.accentBorder,
                textAlign: "center",
              }}
              placeholder="0.00"
              placeholderTextColor={Colors.text.muted}
              keyboardType="decimal-pad"
              value={budgetInput}
              onChangeText={setBudgetInput}
              autoFocus
            />
            <View style={{ flexDirection: "row", gap: 10 }}>
              <TouchableOpacity
                onPress={() => setShowBudgetEdit(false)}
                style={{
                  flex: 1, borderRadius: 9999, paddingVertical: 14,
                  alignItems: "center", backgroundColor: Colors.bg.surface,
                  borderWidth: 1, borderColor: Colors.border.subtle,
                }}
              >
                <Text style={{ color: Colors.text.secondary, fontFamily: Fonts.semiBold }}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={async () => {
                  const val = parseFloat(budgetInput);
                  if (isNaN(val) || val <= 0) {
                    Alert.alert("Enter a valid amount.");
                    return;
                  }
                  try {
                    await setTotalLimit(val);
                    setShowBudgetEdit(false);
                  } catch (e: unknown) {
                    Alert.alert("Error", (e as Error).message);
                  }
                }}
                style={{
                  flex: 1, borderRadius: 9999, paddingVertical: 14,
                  alignItems: "center", backgroundColor: Colors.accent,
                  ...pillShadow(Colors.accent),
                }}
              >
                <Text style={{ color: "#000", fontFamily: Fonts.bold }}>Save</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Tab pills */}
      <View style={{ flexDirection: "row", paddingHorizontal: 20, marginBottom: 14, gap: 8 }}>
        {([
          { id: "overview", label: "Overview" },
          { id: "charts", label: "Charts" },
          { id: "transactions", label: "History" },
        ] as { id: BudgetTab; label: string }[]).map((t) => (
          <TouchableOpacity
            key={t.id}
            onPress={() => setTab(t.id)}
            style={{
              paddingHorizontal: 16, paddingVertical: 9, borderRadius: 9999,
              backgroundColor: tab === t.id ? Colors.accent : Colors.bg.surface,
              borderWidth: 1,
              borderColor: tab === t.id ? "transparent" : Colors.border.subtle,
            }}
          >
            <Text style={{
              color: tab === t.id ? "#000" : Colors.text.secondary,
              fontFamily: Fonts.bold, fontSize: 13,
            }}>
              {t.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 100 }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Colors.accent} />}
        showsVerticalScrollIndicator={false}
      >
        {/* ── Summary strip (scrolls with content) ─────────────── */}
        <View style={{
          backgroundColor: Colors.bg.surface,
          borderRadius: 20,
          padding: 16,
          borderWidth: 1,
          borderColor: summary.isOverBudget ? Colors.dangerBorder : Colors.border.subtle,
          gap: 12,
          marginBottom: 20,
        }}>
          {/* Monthly budget row — tappable to edit */}
          <TouchableOpacity
            onPress={() => {
              setBudgetInput(
                monthlyBudget?.total_limit && monthlyBudget.total_limit > 0
                  ? monthlyBudget.total_limit.toString()
                  : ""
              );
              setShowBudgetEdit(true);
            }}
            style={{
              flexDirection: "row", alignItems: "center",
              justifyContent: "space-between",
              backgroundColor: Colors.bg.overlay,
              borderRadius: 12, padding: 12,
            }}
          >
            <View>
              <Text style={{ color: Colors.text.muted, fontSize: 11, fontFamily: Fonts.semiBold, textTransform: "uppercase", letterSpacing: 0.5 }}>
                Monthly Budget
              </Text>
              <Text style={{ color: Colors.text.primary, fontSize: 20, fontFamily: Fonts.extraBold, letterSpacing: -0.5, marginTop: 2 }}>
                {summary.totalLimit > 0 ? formatCurrency(summary.totalLimit) : "Not set"}
              </Text>
            </View>
            <View style={{
              flexDirection: "row", alignItems: "center", gap: 4,
              backgroundColor: Colors.neonGreenGlow,
              borderWidth: 1, borderColor: Colors.neonGreenBorder,
              borderRadius: 8, paddingHorizontal: 10, paddingVertical: 6,
            }}>
              <Ionicons name="pencil" size={12} color={Colors.accent} />
              <Text style={{ color: Colors.accent, fontSize: 12, fontFamily: Fonts.semiBold }}>Edit</Text>
            </View>
          </TouchableOpacity>

          {/* Stats row */}
          <View style={{ flexDirection: "row", justifyContent: "space-between" }}>
            {[
              { label: "Income", value: summary.totalIncome, color: Colors.accent },
              { label: "Spent", value: summary.totalSpent, color: activeColor },
              { label: "Left", value: Math.abs(summary.totalRemaining), color: summary.isOverBudget ? Colors.danger : Colors.accent },
            ].map(({ label, value, color }) => (
              <View key={label} style={{ alignItems: "center" }}>
                <Text style={{ color: Colors.text.muted, fontSize: 11, marginBottom: 4 }}>{label}</Text>
                <Text style={{ color, fontSize: 17, fontFamily: Fonts.bold, letterSpacing: -0.5 }}>
                  {formatCurrency(value)}
                </Text>
              </View>
            ))}
          </View>

          <ProgressBar spent={summary.totalSpent} limit={summary.totalLimit} height={5} />
          <Text style={{ color: Colors.text.muted, fontSize: 11 }}>
            {summary.totalLimit > 0
              ? `${summary.percentUsed.toFixed(0)}% of ${formatCurrency(summary.totalLimit)} used`
              : "Set a monthly budget to track progress"}
          </Text>
        </View>

        {tab === "overview" ? (
          <View style={{ gap: 24 }}>

            {/* ── Spend alerts ─────────────────────────────────────── */}
            {triggeredAlerts.length > 0 && (
              <View style={{ gap: 8 }}>
                {triggeredAlerts.map((alert) => (
                  <BudgetAlertBanner
                    key={alert.categoryId}
                    alert={alert}
                    onDismiss={(id) => setDismissedAlerts((prev) => new Set([...prev, id]))}
                  />
                ))}
              </View>
            )}

            {/* ── Fixed Bills ─────────────────────────────────────── */}
            {fixedCategories.length > 0 && (
              <View>
                <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
                  <Text style={{ color: Colors.text.muted, fontSize: 11, fontFamily: Fonts.semiBold, textTransform: "uppercase", letterSpacing: 0.8 }}>
                    Fixed Bills
                  </Text>
                  <Text style={{ color: Colors.text.secondary, fontSize: 13, fontFamily: Fonts.bold }}>
                    {formatCurrency(totalFixed)}/mo
                  </Text>
                </View>
                <View style={{
                  backgroundColor: Colors.bg.surface,
                  borderRadius: 16,
                  borderWidth: 1,
                  borderColor: Colors.border.subtle,
                  overflow: "hidden",
                }}>
                  {fixedCategories.map((cat, idx) => (
                    <View key={cat.id}>
                      <CategoryCard category={cat} onPress={setEditingCategory} />
                      {idx < fixedCategories.length - 1 && (
                        <View style={{ height: 1, backgroundColor: Colors.border.subtle, marginHorizontal: 16 }} />
                      )}
                    </View>
                  ))}
                </View>
              </View>
            )}

            {/* ── Spending Budgets ─────────────────────────────────── */}
            <View>
              <Text style={{ color: Colors.text.muted, fontSize: 11, fontFamily: Fonts.semiBold, textTransform: "uppercase", letterSpacing: 0.8, marginBottom: 10 }}>
                Spending
              </Text>
              {spendCategories.length === 0 ? (
                <EmptyState title="No budget categories" subtitle='Add a spending budget like "Food" or "Gas" using the button below.' />
              ) : (
                <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 10 }}>
                  {spendCategories.map((cat) => (
                    <View key={cat.id} style={{ width: "47.5%" }}>
                      <CategoryCard
                        category={cat}
                        onPress={(c) => router.push(`/category/${c.id}` as any)}
                      />
                    </View>
                  ))}
                </View>
              )}
            </View>

            {/* ── Income ───────────────────────────────────────────── */}
            {incomeCategories.length > 0 && (
              <View>
                <Text style={{ color: Colors.text.muted, fontSize: 11, fontFamily: Fonts.semiBold, textTransform: "uppercase", letterSpacing: 0.8, marginBottom: 10 }}>
                  Income
                </Text>
                <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 10 }}>
                  {incomeCategories.map((cat) => (
                    <View key={cat.id} style={{ width: "47.5%" }}>
                      <CategoryCard category={cat} onPress={setEditingCategory} />
                    </View>
                  ))}
                </View>
              </View>
            )}

            {/* ── Add category ─────────────────────────────────────── */}
            <TouchableOpacity
              onPress={() => setShowAddCat(true)}
              style={{
                borderRadius: 16, borderWidth: 1.5,
                borderColor: Colors.accentBorder,
                borderStyle: "dashed",
                paddingVertical: 18,
                alignItems: "center",
                flexDirection: "row",
                justifyContent: "center",
                gap: 8,
              }}
            >
              <Ionicons name="add-circle-outline" size={18} color={Colors.accent} />
              <Text style={{ color: Colors.accent, fontSize: 14, fontFamily: Fonts.semiBold }}>Add Category</Text>
            </TouchableOpacity>
          </View>
        ) : tab === "charts" ? (
          <View style={{ gap: 24 }}>
            {/* Budget allocation donut */}
            <View style={{
              backgroundColor: Colors.bg.surface, borderRadius: 20, padding: 20,
              borderWidth: 1, borderColor: Colors.border.subtle, alignItems: "center",
            }}>
              <Text style={{ color: Colors.text.muted, fontSize: 11, fontFamily: Fonts.semiBold, textTransform: "uppercase", letterSpacing: 0.8, marginBottom: 16, alignSelf: "flex-start" }}>
                Budget Allocation
              </Text>
              {chartData.length > 0 ? (
                <AllocationChart
                  data={chartData}
                  centerLabel="budgeted"
                  centerValue={summary.totalLimit}
                  size={200}
                />
              ) : (
                <EmptyState title="No categories yet" subtitle="Add budget categories to see your allocation." />
              )}
            </View>

            {/* Spending breakdown bars */}
            {chartData.length > 0 && (
              <View style={{ backgroundColor: Colors.bg.surface, borderRadius: 20, padding: 20, borderWidth: 1, borderColor: Colors.border.subtle, gap: 14 }}>
                <Text style={{ color: Colors.text.muted, fontSize: 11, fontFamily: Fonts.semiBold, textTransform: "uppercase", letterSpacing: 0.8 }}>
                  Spending by Category
                </Text>
                {categories.filter((c) => !c.is_income).map((c, i) => {
                  const spent = c.spent ?? 0;
                  const pct = c.monthly_limit > 0 ? Math.min((spent / c.monthly_limit) * 100, 100) : 0;
                  const barColor = CHART_COLORS[i % CHART_COLORS.length];
                  return (
                    <View key={c.id} style={{ gap: 6 }}>
                      <View style={{ flexDirection: "row", justifyContent: "space-between" }}>
                        <Text style={{ color: Colors.text.primary, fontSize: 13, fontFamily: Fonts.semiBold }}>{c.name}</Text>
                        <Text style={{ color: Colors.text.muted, fontSize: 12 }}>
                          {formatCurrency(spent)} / {formatCurrency(c.monthly_limit)}
                        </Text>
                      </View>
                      <ProgressBar spent={spent} limit={c.monthly_limit} height={6} color={barColor} />
                      <Text style={{ color: Colors.text.muted, fontSize: 11 }}>{pct.toFixed(0)}% used</Text>
                    </View>
                  );
                })}
              </View>
            )}

            {/* Spending trend line chart */}
            {summary.spendingData.length > 1 && (
              <View style={{ backgroundColor: Colors.bg.surface, borderRadius: 20, padding: 20, borderWidth: 1, borderColor: Colors.border.subtle }}>
                <Text style={{ color: Colors.text.muted, fontSize: 11, fontFamily: Fonts.semiBold, textTransform: "uppercase", letterSpacing: 0.8, marginBottom: 14 }}>
                  Spending Trend
                </Text>
                <BezierChart
                  data={summary.spendingData}
                  limit={summary.totalLimit}
                  width={width - 80}
                  height={120}
                />
              </View>
            )}

            {/* Income vs expense summary */}
            {summary.totalIncome > 0 && (
              <View style={{ backgroundColor: Colors.bg.surface, borderRadius: 20, padding: 20, borderWidth: 1, borderColor: Colors.border.subtle, gap: 12 }}>
                <Text style={{ color: Colors.text.muted, fontSize: 11, fontFamily: Fonts.semiBold, textTransform: "uppercase", letterSpacing: 0.8 }}>
                  Income vs Expenses
                </Text>
                <AllocationChart
                  data={[
                    { label: "Expenses", value: summary.totalLimit, color: Colors.danger },
                    { label: "Income", value: summary.totalIncome, color: Colors.accent },
                  ]}
                  centerLabel="income"
                  centerValue={summary.totalIncome}
                  size={160}
                />
              </View>
            )}
          </View>
        ) : (
          <View>
            {transactions.length === 0 ? (
              <EmptyState title="No transactions" subtitle="Add one using the button below." />
            ) : (
              <View style={{
                backgroundColor: Colors.bg.surface,
                borderRadius: 20,
                borderWidth: 1,
                borderColor: Colors.border.subtle,
                overflow: "hidden",
              }}>
                <View style={{ paddingHorizontal: 16 }}>
                  {transactions.map((tx, idx) => (
                    <View key={tx.id}>
                      <TransactionItem transaction={tx} />
                      {idx < transactions.length - 1 && <Divider />}
                    </View>
                  ))}
                </View>
              </View>
            )}
          </View>
        )}
      </ScrollView>

      {/* Bottom CTA */}
      <View style={{
        paddingHorizontal: 20, paddingBottom: 16, paddingTop: 10,
        backgroundColor: "#000",
        borderTopWidth: 0.5, borderTopColor: Colors.border.subtle,
      }}>
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
          <Text style={{ color: "#000", fontFamily: Fonts.bold, fontSize: 15 }}>+ Add Transaction</Text>
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
      <AddCategoryModal
        visible={showAddCat}
        onClose={() => setShowAddCat(false)}
        onAdd={async (data) => { await createCategory(data); }}
      />

      <EditCategoryModal
        visible={editingCategory !== null}
        category={editingCategory}
        onClose={() => setEditingCategory(null)}
        onSave={async (id, data) => {
          await updateCategory(id, data);
          await fetchMonthlyBudget(currentMonth);
          setEditingCategory(null);
        }}
        onDelete={async (id) => {
          await deleteCategory(id);
          setEditingCategory(null);
        }}
      />

      {/* AI Analysis bottom sheet */}
      <Modal
        visible={showAiSheet}
        transparent
        animationType="slide"
        onRequestClose={() => setShowAiSheet(false)}
      >
        <View style={{ flex: 1, justifyContent: "flex-end", backgroundColor: "rgba(0,0,0,0.6)" }}>
          <View style={{
            backgroundColor: Colors.bg.raised,
            borderTopLeftRadius: 28, borderTopRightRadius: 28,
            borderTopWidth: 1, borderColor: Colors.border.subtle,
            padding: 24, paddingBottom: Platform.OS === "ios" ? 44 : 28,
            maxHeight: "90%",
          }}>
            <View style={{ alignItems: "center", marginBottom: 12 }}>
              <View style={{ width: 40, height: 4, borderRadius: 2, backgroundColor: Colors.border.subtle }} />
            </View>
            <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
              <View />
              <TouchableOpacity onPress={() => setShowAiSheet(false)}>
                <View style={{ width: 28, height: 28, borderRadius: 14, backgroundColor: Colors.bg.overlay, alignItems: "center", justifyContent: "center" }}>
                  <Ionicons name="close" size={14} color={Colors.text.muted} />
                </View>
              </TouchableOpacity>
            </View>
            <AiAnalysisSheet
              onApplySuggestion={handleApplySuggestion}
              onApplyAll={handleApplyAll}
            />
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}
