import { View, Text, TouchableOpacity } from "react-native";
import { Colors, getBudgetColor, Fonts } from "@/constants/theme";
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
        <Text style={{ color: Colors.text.muted, fontSize: 11, fontFamily: Fonts.medium }}>{cat.name}</Text>
        <Text style={{ color: Colors.accent, fontSize: 17, fontFamily: Fonts.bold, letterSpacing: -0.3 }}>
          {formatCurrency(limit)}
        </Text>
        <Text style={{ color: Colors.text.muted, fontSize: 11 }}>per month</Text>
      </TouchableOpacity>
    );
  }

  if (cat.is_fixed) {
    return (
      <TouchableOpacity
        onPress={() => onPress?.(cat)}
        activeOpacity={0.75}
        style={{
          flexDirection: "row",
          alignItems: "center",
          paddingVertical: 14,
          paddingHorizontal: 16,
          gap: 12,
        }}
      >
        <View style={{
          width: 40, height: 40, borderRadius: 12,
          backgroundColor: Colors.bg.surface,
          alignItems: "center", justifyContent: "center",
          borderWidth: 1, borderColor: Colors.border.subtle,
        }}>
          <Text style={{ fontSize: 20 }}>{cat.emoji ?? "📋"}</Text>
        </View>

        <View style={{ flex: 1 }}>
          <Text style={{ color: Colors.text.primary, fontSize: 14, fontFamily: Fonts.semiBold }}>
            {cat.name}
          </Text>
          {cat.fixed_day_of_month ? (
            <Text style={{ color: Colors.text.muted, fontSize: 12, marginTop: 1 }}>
              Due the {cat.fixed_day_of_month}{ordinal(cat.fixed_day_of_month)} each month
            </Text>
          ) : (
            <Text style={{ color: Colors.text.muted, fontSize: 12, marginTop: 1 }}>
              Monthly bill
            </Text>
          )}
        </View>

        <Text style={{ color: Colors.text.primary, fontSize: 16, fontFamily: Fonts.bold, letterSpacing: -0.3 }}>
          {formatCurrency(limit)}
        </Text>
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
            <Text style={{ color: Colors.danger, fontSize: 10, fontFamily: Fonts.bold }}>OVER</Text>
          </View>
        ) : (
          <Text style={{ color: Colors.text.muted, fontSize: 11 }}>{pct}%</Text>
        )}
      </View>

      <Text style={{ color: Colors.text.secondary, fontSize: 12, fontFamily: Fonts.medium }}>{cat.name}</Text>

      <Text style={{ color: activeColor, fontSize: 17, fontFamily: Fonts.bold, letterSpacing: -0.5 }}>
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

function ordinal(n: number): string {
  if (n >= 11 && n <= 13) return "th";
  switch (n % 10) {
    case 1: return "st";
    case 2: return "nd";
    case 3: return "rd";
    default: return "th";
  }
}
