import {
  View,
  Text,
  ScrollView,
  RefreshControl,
  TouchableOpacity,
  StatusBar,
} from "react-native";
import { useEffect, useState } from "react";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useBudgetStore } from "@/store/budgetStore";
import { useTransactionStore } from "@/store/transactionStore";
import { useBudgetSummary } from "@/hooks/useBudgetSummary";
import { Colors, getBudgetColor, pillShadow } from "@/constants/theme";
import { formatCurrency, currentYearMonth, formatMonth } from "@/lib/utils";
import Divider from "@/components/ui/Divider";
import ProgressBar from "@/components/ui/ProgressBar";
import CategoryCard from "@/components/budget/CategoryCard";
import AddTransactionModal from "@/components/budget/AddTransactionModal";
import AddCategoryModal from "@/components/budget/AddCategoryModal";
import TransactionItem from "@/components/dashboard/TransactionItem";
import EmptyState from "@/components/ui/EmptyState";

type BudgetTab = "overview" | "transactions";

export default function BudgetScreen() {
  const { categories, currentMonth, setCurrentMonth, fetchMonthlyBudget, createCategory } = useBudgetStore();
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
    <SafeAreaView style={{ flex: 1, backgroundColor: "#000" }} edges={["top"]}>
      <StatusBar barStyle="light-content" />

      {/* Header */}
      <View style={{
        flexDirection: "row", justifyContent: "space-between",
        alignItems: "center", paddingHorizontal: 20, paddingTop: 6, paddingBottom: 4,
      }}>
        <View style={{ flexDirection: "row", alignItems: "center", gap: 16 }}>
          <Text style={{ color: Colors.text.primary, fontSize: 26, fontWeight: "800", letterSpacing: -0.5 }}>
            Budget
          </Text>
          {/* Month nav inline */}
          <View style={{ flexDirection: "row", alignItems: "center", gap: 10, backgroundColor: Colors.bg.surface, borderRadius: 20, paddingHorizontal: 12, paddingVertical: 6, borderWidth: 1, borderColor: Colors.border.subtle }}>
            <TouchableOpacity onPress={handlePrevMonth}>
              <Ionicons name="chevron-back" size={14} color={Colors.text.muted} />
            </TouchableOpacity>
            <Text style={{ color: Colors.text.secondary, fontSize: 12, fontWeight: "600" }}>
              {formatMonth(`${currentMonth}-01`)}
            </Text>
            <TouchableOpacity onPress={handleNextMonth} disabled={currentMonth >= currentYearMonth()}>
              <Ionicons name="chevron-forward" size={14} color={currentMonth >= currentYearMonth() ? Colors.border.subtle : Colors.text.muted} />
            </TouchableOpacity>
          </View>
        </View>
      </View>

      {/* Summary strip */}
      <View style={{ marginHorizontal: 20, marginTop: 12, marginBottom: 14 }}>
        <View style={{
          backgroundColor: Colors.bg.surface,
          borderRadius: 20,
          padding: 16,
          borderWidth: 1,
          borderColor: summary.isOverBudget ? Colors.dangerBorder : Colors.border.subtle,
        }}>
          <View style={{ flexDirection: "row", justifyContent: "space-between", marginBottom: 12 }}>
            {[
              { label: "Income", value: summary.totalIncome, color: Colors.accent },
              { label: "Spent", value: summary.totalSpent, color: activeColor },
              { label: "Left", value: Math.abs(summary.totalRemaining), color: summary.isOverBudget ? Colors.danger : Colors.accent },
            ].map(({ label, value, color }) => (
              <View key={label} style={{ alignItems: "center" }}>
                <Text style={{ color: Colors.text.muted, fontSize: 11, marginBottom: 4 }}>{label}</Text>
                <Text style={{ color, fontSize: 17, fontWeight: "700", letterSpacing: -0.5 }}>
                  {formatCurrency(value)}
                </Text>
              </View>
            ))}
          </View>
          <ProgressBar spent={summary.totalSpent} limit={summary.totalLimit} height={5} />
          <Text style={{ color: Colors.text.muted, fontSize: 11, marginTop: 8 }}>
            {summary.percentUsed.toFixed(0)}% of {formatCurrency(summary.totalLimit)} used
          </Text>
        </View>
      </View>

      {/* Tab pills */}
      <View style={{ flexDirection: "row", paddingHorizontal: 20, marginBottom: 14, gap: 8 }}>
        {(["overview", "transactions"] as BudgetTab[]).map((t) => (
          <TouchableOpacity
            key={t}
            onPress={() => setTab(t)}
            style={{
              paddingHorizontal: 20, paddingVertical: 9, borderRadius: 9999,
              backgroundColor: tab === t ? Colors.accent : Colors.bg.surface,
              borderWidth: 1,
              borderColor: tab === t ? "transparent" : Colors.border.subtle,
            }}
          >
            <Text style={{
              color: tab === t ? "#000" : Colors.text.secondary,
              fontWeight: "700", fontSize: 13, textTransform: "capitalize",
            }}>
              {t}
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
        {tab === "overview" ? (
          <View style={{ gap: 20 }}>
            {incomeCategories.length > 0 && (
              <View>
                <Text style={{ color: Colors.text.muted, fontSize: 11, fontWeight: "600", textTransform: "uppercase", letterSpacing: 0.8, marginBottom: 10 }}>
                  Income
                </Text>
                <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 10 }}>
                  {incomeCategories.map((cat) => (
                    <View key={cat.id} style={{ width: "47.5%" }}>
                      <CategoryCard category={cat} />
                    </View>
                  ))}
                </View>
              </View>
            )}

            <View>
              <Text style={{ color: Colors.text.muted, fontSize: 11, fontWeight: "600", textTransform: "uppercase", letterSpacing: 0.8, marginBottom: 10 }}>
                Spending
              </Text>
              {spendCategories.length === 0 ? (
                <EmptyState title="No categories yet" subtitle="Add a budget category to start tracking your spending." />
              ) : (
                <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 10 }}>
                  {spendCategories.map((cat) => (
                    <View key={cat.id} style={{ width: "47.5%" }}>
                      <CategoryCard category={cat} />
                    </View>
                  ))}
                </View>
              )}
            </View>

            {/* Add category */}
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
              <Text style={{ color: Colors.accent, fontSize: 14, fontWeight: "600" }}>Add Category</Text>
            </TouchableOpacity>
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
