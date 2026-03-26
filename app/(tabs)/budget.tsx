import {
  View,
  Text,
  ScrollView,
  RefreshControl,
  TouchableOpacity,
  FlatList,
} from "react-native";
import { useEffect, useState } from "react";
import { SafeAreaView } from "react-native-safe-area-context";
import { useBudgetStore } from "@/store/budgetStore";
import { useTransactionStore } from "@/store/transactionStore";
import { useBudgetSummary } from "@/hooks/useBudgetSummary";
import { Colors, getBudgetColor, pillShadow } from "@/constants/theme";
import { formatCurrency, currentYearMonth, formatMonth } from "@/lib/utils";
import Card from "@/components/ui/Card";
import Divider from "@/components/ui/Divider";
import ProgressBar from "@/components/ui/ProgressBar";
import CategoryCard from "@/components/budget/CategoryCard";
import AddTransactionModal from "@/components/budget/AddTransactionModal";
import AddCategoryModal from "@/components/budget/AddCategoryModal";
import TransactionItem from "@/components/dashboard/TransactionItem";
import EmptyState from "@/components/ui/EmptyState";
import type { BudgetCategory, Transaction } from "@/types";

type BudgetTab = "overview" | "transactions";

export default function BudgetScreen() {
  const { categories, currentMonth, setCurrentMonth, fetchMonthlyBudget, createCategory, monthlyBudget } = useBudgetStore();
  const { transactions, fetchTransactions, addManualTransaction } = useTransactionStore();
  const summary = useBudgetSummary();

  const [tab, setTab] = useState<BudgetTab>("overview");
  const [refreshing, setRefreshing] = useState(false);
  const [showAddTx, setShowAddTx] = useState(false);
  const [showAddCat, setShowAddCat] = useState(false);

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
  const spendCategories = categories.filter((c) => !c.is_income);
  const activeColor = getBudgetColor(summary.totalSpent, summary.totalLimit);

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: "#000000" }} edges={["top"]}>
      {/* Header */}
      <View style={{ paddingHorizontal: 20, paddingTop: 8, paddingBottom: 4 }}>
        <Text style={{ color: Colors.text.primary, fontSize: 26, fontWeight: "800", letterSpacing: -0.5 }}>
          Budget
        </Text>
      </View>

      {/* Month selector */}
      <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "center", paddingVertical: 10, gap: 20 }}>
        <TouchableOpacity onPress={handlePrevMonth} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
          <Text style={{ color: Colors.text.secondary, fontSize: 20 }}>‹</Text>
        </TouchableOpacity>
        <Text style={{ color: Colors.text.primary, fontSize: 15, fontWeight: "600" }}>
          {formatMonth(`${currentMonth}-01`)}
        </Text>
        <TouchableOpacity onPress={handleNextMonth} disabled={currentMonth >= currentYearMonth()} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
          <Text style={{ color: currentMonth >= currentYearMonth() ? Colors.text.muted : Colors.text.secondary, fontSize: 20 }}>›</Text>
        </TouchableOpacity>
      </View>

      {/* Summary bar */}
      <View style={{ paddingHorizontal: 20, marginBottom: 12 }}>
        <Card glow={summary.isOverBudget ? "pink" : "green"} padding={16}>
          <View style={{ flexDirection: "row", justifyContent: "space-between", marginBottom: 10 }}>
            {[
              { label: "Income", value: summary.totalIncome, color: Colors.neonGreen },
              { label: "Spent", value: summary.totalSpent, color: activeColor },
              { label: "Left", value: Math.abs(summary.totalRemaining), color: summary.isOverBudget ? Colors.dangerPink : Colors.neonGreen },
            ].map(({ label, value, color }) => (
              <View key={label} style={{ alignItems: "center" }}>
                <Text style={{ color: Colors.text.muted, fontSize: 11, marginBottom: 2 }}>{label}</Text>
                <Text style={{ color, fontSize: 16, fontWeight: "700" }}>{formatCurrency(value)}</Text>
              </View>
            ))}
          </View>
          <ProgressBar spent={summary.totalSpent} limit={summary.totalLimit} height={6} showLabel={false} />
          <Text style={{ color: Colors.text.muted, fontSize: 11, marginTop: 6 }}>
            {summary.percentUsed.toFixed(0)}% of {formatCurrency(summary.totalLimit)} budget used
          </Text>
        </Card>
      </View>

      {/* Tab bar */}
      <View style={{ flexDirection: "row", paddingHorizontal: 20, marginBottom: 12, gap: 8 }}>
        {(["overview", "transactions"] as BudgetTab[]).map((t) => (
          <TouchableOpacity
            key={t}
            onPress={() => setTab(t)}
            style={{
              paddingHorizontal: 18, paddingVertical: 8, borderRadius: 9999,
              backgroundColor: tab === t ? activeColor : Colors.bg.surface,
              borderWidth: 1,
              borderColor: tab === t ? "transparent" : Colors.border.subtle,
            }}
          >
            <Text style={{ color: tab === t ? "#000" : Colors.text.secondary, fontWeight: "600", fontSize: 13, textTransform: "capitalize" }}>
              {t}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 40 }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Colors.neonGreen} />}
        showsVerticalScrollIndicator={false}
      >
        {tab === "overview" ? (
          <View style={{ gap: 16 }}>
            {/* Income categories */}
            {incomeCategories.length > 0 && (
              <View>
                <Text style={{ color: Colors.text.muted, fontSize: 11, textTransform: "uppercase", letterSpacing: 0.8, marginBottom: 10 }}>
                  Income
                </Text>
                <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 10 }}>
                  {incomeCategories.map((cat) => (
                    <View key={cat.id} style={{ width: "47%" }}>
                      <CategoryCard category={cat} />
                    </View>
                  ))}
                </View>
              </View>
            )}

            {/* Expense categories */}
            <View>
              <Text style={{ color: Colors.text.muted, fontSize: 11, textTransform: "uppercase", letterSpacing: 0.8, marginBottom: 10 }}>
                Spending
              </Text>
              {spendCategories.length === 0 ? (
                <EmptyState icon="📊" title="No categories yet" subtitle="Add a budget category to start tracking." />
              ) : (
                <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 10 }}>
                  {spendCategories.map((cat) => (
                    <View key={cat.id} style={{ width: "47%" }}>
                      <CategoryCard category={cat} />
                    </View>
                  ))}
                </View>
              )}
            </View>

            {/* Add category button */}
            <TouchableOpacity
              onPress={() => setShowAddCat(true)}
              style={{
                borderRadius: 14, borderWidth: 1,
                borderColor: Colors.neonGreenBorder,
                borderStyle: "dashed",
                paddingVertical: 18,
                alignItems: "center",
              }}
            >
              <Text style={{ color: Colors.neonGreen, fontSize: 14, fontWeight: "600" }}>+ Add Category</Text>
            </TouchableOpacity>
          </View>
        ) : (
          /* Transactions tab */
          <View>
            {transactions.length === 0 ? (
              <EmptyState icon="💸" title="No transactions" subtitle="Add one using the button below." />
            ) : (
              <Card padding={0}>
                <View style={{ paddingHorizontal: 14 }}>
                  {transactions.map((tx, idx) => (
                    <View key={tx.id}>
                      <TransactionItem transaction={tx} />
                      {idx < transactions.length - 1 && <Divider />}
                    </View>
                  ))}
                </View>
              </Card>
            )}
          </View>
        )}
      </ScrollView>

      {/* FAB */}
      <View style={{ paddingHorizontal: 20, paddingBottom: 16, paddingTop: 8, backgroundColor: "#000" }}>
        <TouchableOpacity
          onPress={() => setShowAddTx(true)}
          style={{
            backgroundColor: activeColor,
            borderRadius: 9999,
            paddingVertical: 15,
            alignItems: "center",
            borderBottomWidth: 3,
            borderBottomColor: summary.isOverBudget ? Colors.dangerPinkDim : Colors.neonGreenDim,
            ...pillShadow(activeColor),
          }}
        >
          <Text style={{ color: "#000", fontWeight: "700", fontSize: 15 }}>+ Add Transaction</Text>
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
    </SafeAreaView>
  );
}
