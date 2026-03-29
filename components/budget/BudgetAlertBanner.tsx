import { View, Text, TouchableOpacity } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { Colors, Fonts, useColors} from "@/constants/theme";
import { formatCurrency } from "@/lib/utils";

export interface BudgetAlert {
  categoryId: string;
  categoryName: string;
  emoji: string;
  pct: number;          // e.g. 75
  spent: number;
  limit: number;
  threshold: number;    // the user-set threshold
}

interface Props {
  alert: BudgetAlert;
  onDismiss: (id: string) => void;
}

export default function BudgetAlertBanner({ alert, onDismiss }: Props) {
  const Colors = useColors();
  const remaining = alert.limit - alert.spent;
  const over = remaining < 0;

  const bgColor = over ? Colors.dangerSoft : Colors.warningSoft;
  const borderColor = over ? Colors.dangerBorder : `${Colors.warning}40`;
  const iconColor = over ? Colors.danger : Colors.warning;
  const icon = over ? "warning" : "alert-circle";

  return (
    <View style={{
      backgroundColor: bgColor,
      borderRadius: 14,
      borderWidth: 1,
      borderColor,
      padding: 14,
      flexDirection: "row",
      alignItems: "flex-start",
      gap: 10,
    }}>
      <View style={{
        width: 32, height: 32, borderRadius: 10,
        backgroundColor: over ? Colors.dangerSoft : Colors.warningSoft,
        alignItems: "center", justifyContent: "center",
        flexShrink: 0,
      }}>
        <Ionicons name={icon} size={16} color={iconColor} />
      </View>

      <View style={{ flex: 1, gap: 2 }}>
        <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
          <Text style={{ fontSize: 14 }}>{alert.emoji}</Text>
          <Text style={{ color: Colors.text.primary, fontSize: 14, fontFamily: Fonts.bold }}>
            {alert.categoryName}
          </Text>
          <View style={{
            backgroundColor: over ? Colors.dangerSoft : Colors.warningSoft,
            borderRadius: 6, paddingHorizontal: 6, paddingVertical: 1,
          }}>
            <Text style={{ color: iconColor, fontSize: 11, fontFamily: Fonts.bold }}>
              {Math.round(alert.pct)}%
            </Text>
          </View>
        </View>

        <Text style={{ color: Colors.text.secondary, fontSize: 13, fontFamily: Fonts.regular, lineHeight: 18 }}>
          {over
            ? `You've gone over your ${alert.categoryName} budget by ${formatCurrency(Math.abs(remaining))}.`
            : `You've spent ${Math.round(alert.pct)}% of your ${alert.categoryName} budget.`}
          {" "}
          {over
            ? "Consider reviewing your spending."
            : `${formatCurrency(remaining)} left for the month.`}
        </Text>
      </View>

      <TouchableOpacity
        onPress={() => onDismiss(alert.categoryId)}
        hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        style={{ paddingTop: 2 }}
      >
        <Ionicons name="close" size={16} color={Colors.text.muted} />
      </TouchableOpacity>
    </View>
  );
}
