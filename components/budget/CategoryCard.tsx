import { View, Text, TouchableOpacity } from "react-native";
import { Colors, getBudgetColor } from "@/constants/theme";
import ProgressBar from "@/components/ui/ProgressBar";
import { formatCurrency } from "@/lib/utils";
import type { BudgetCategory } from "@/types";

interface CategoryCardProps {
  category: BudgetCategory;
  onPress?: (cat: BudgetCategory) => void;
}

export default function CategoryCard({ category: cat, onPress }: CategoryCardProps) {
  const spent = cat.spent ?? 0;
  const limit = cat.monthly_limit;
  const activeColor = getBudgetColor(spent, limit);
  const remaining = limit - spent;
  const overBudget = spent > limit;
  const pct = limit > 0 ? Math.min(Math.round((spent / limit) * 100), 100) : 0;

  if (cat.is_income) {
    return (
      <TouchableOpacity
        onPress={() => onPress?.(cat)}
        activeOpacity={0.7}
        style={{
          backgroundColor: Colors.bg.surface,
          borderRadius: 16,
          padding: 14,
          borderWidth: 1,
          borderColor: Colors.accentBorder,
          gap: 2,
        }}
      >
        <Text style={{ fontSize: 22, marginBottom: 4 }}>{cat.emoji ?? "💵"}</Text>
        <Text style={{ color: Colors.text.muted, fontSize: 11, fontWeight: "500" }}>{cat.name}</Text>
        <Text style={{ color: Colors.accent, fontSize: 17, fontWeight: "700", letterSpacing: -0.3 }}>
          {formatCurrency(limit)}
        </Text>
        <Text style={{ color: Colors.text.muted, fontSize: 11 }}>per month</Text>
      </TouchableOpacity>
    );
  }

  return (
    <TouchableOpacity
      onPress={() => onPress?.(cat)}
      activeOpacity={0.7}
      style={{
        backgroundColor: Colors.bg.surface,
        borderRadius: 16,
        padding: 14,
        borderWidth: 1,
        borderColor: overBudget ? Colors.dangerBorder : Colors.border.subtle,
        gap: 8,
      }}
    >
      <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
        <Text style={{ fontSize: 22 }}>{cat.emoji ?? "📦"}</Text>
        {overBudget ? (
          <View style={{ backgroundColor: Colors.dangerSoft, paddingHorizontal: 7, paddingVertical: 2, borderRadius: 6 }}>
            <Text style={{ color: Colors.danger, fontSize: 10, fontWeight: "700" }}>OVER</Text>
          </View>
        ) : (
          <Text style={{ color: Colors.text.muted, fontSize: 11 }}>{pct}%</Text>
        )}
      </View>

      <Text style={{ color: Colors.text.secondary, fontSize: 12, fontWeight: "500" }}>{cat.name}</Text>

      <Text style={{ color: activeColor, fontSize: 17, fontWeight: "700", letterSpacing: -0.5 }}>
        {formatCurrency(spent)}
      </Text>

      <ProgressBar spent={spent} limit={limit} />

      <Text style={{ color: Colors.text.muted, fontSize: 11 }}>
        {overBudget
          ? `${formatCurrency(Math.abs(remaining))} over limit`
          : `${formatCurrency(remaining)} left`}
      </Text>
    </TouchableOpacity>
  );
}
