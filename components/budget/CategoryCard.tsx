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

  if (cat.is_income) {
    return (
      <TouchableOpacity
        onPress={() => onPress?.(cat)}
        activeOpacity={0.75}
        style={{
          backgroundColor: Colors.bg.surface,
          borderRadius: 14,
          padding: 14,
          borderWidth: 1,
          borderColor: Colors.neonGreenBorder,
          gap: 2,
        }}
      >
        <Text style={{ fontSize: 20 }}>{cat.emoji ?? "💵"}</Text>
        <Text style={{ color: Colors.text.secondary, fontSize: 12, marginTop: 6 }}>{cat.name}</Text>
        <Text style={{ color: Colors.neonGreen, fontSize: 16, fontWeight: "700" }}>
          {formatCurrency(limit)}
        </Text>
        <Text style={{ color: Colors.text.muted, fontSize: 11 }}>/ month</Text>
      </TouchableOpacity>
    );
  }

  return (
    <TouchableOpacity
      onPress={() => onPress?.(cat)}
      activeOpacity={0.75}
      style={{
        backgroundColor: Colors.bg.surface,
        borderRadius: 14,
        padding: 14,
        borderWidth: 1,
        borderColor: overBudget ? Colors.dangerPinkBorder : Colors.border.subtle,
        gap: 6,
      }}
    >
      {/* Header */}
      <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start" }}>
        <Text style={{ fontSize: 20 }}>{cat.emoji ?? "📦"}</Text>
        {overBudget && (
          <View
            style={{
              backgroundColor: Colors.dangerPinkGlow,
              paddingHorizontal: 6,
              paddingVertical: 2,
              borderRadius: 6,
            }}
          >
            <Text style={{ color: Colors.dangerPink, fontSize: 10, fontWeight: "700" }}>OVER</Text>
          </View>
        )}
      </View>

      <Text style={{ color: Colors.text.secondary, fontSize: 12 }}>{cat.name}</Text>

      {/* Spent amount */}
      <Text style={{ color: activeColor, fontSize: 16, fontWeight: "700" }}>
        {formatCurrency(spent)}
      </Text>

      {/* Progress bar */}
      <ProgressBar spent={spent} limit={limit} />

      {/* Remaining */}
      <Text style={{ color: Colors.text.muted, fontSize: 11 }}>
        {overBudget
          ? `${formatCurrency(Math.abs(remaining))} over`
          : `${formatCurrency(remaining)} left`}
      </Text>
    </TouchableOpacity>
  );
}
