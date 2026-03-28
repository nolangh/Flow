import { View, Text, TouchableOpacity } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { Colors, Fonts } from "@/constants/theme";
import { formatCurrency, formatDate } from "@/lib/utils";
import type { Transaction } from "@/types";

interface TransactionItemProps {
  transaction: Transaction;
  onPress?: (tx: Transaction) => void;
}

function getIconName(tx: Transaction): keyof typeof Ionicons.glyphMap {
  if (tx.type === "credit") return "arrow-down-circle";
  const cat = tx.category?.name?.toLowerCase() ?? "";
  if (cat.includes("food") || cat.includes("grocery") || cat.includes("dining")) return "fast-food-outline";
  if (cat.includes("transport") || cat.includes("gas") || cat.includes("car")) return "car-outline";
  if (cat.includes("shop") || cat.includes("cloth")) return "bag-outline";
  if (cat.includes("util") || cat.includes("bill") || cat.includes("electric")) return "flash-outline";
  if (cat.includes("health") || cat.includes("medical")) return "medical-outline";
  if (cat.includes("entertain") || cat.includes("stream")) return "tv-outline";
  return "card-outline";
}

export default function TransactionItem({ transaction: tx, onPress }: TransactionItemProps) {
  const isCredit = tx.type === "credit";
  const amountColor = isCredit ? Colors.accent : Colors.text.primary;
  const sign = isCredit ? "+" : "-";
  const iconName = getIconName(tx);

  return (
    <TouchableOpacity
      onPress={() => onPress?.(tx)}
      activeOpacity={0.65}
      style={{
        flexDirection: "row",
        alignItems: "center",
        paddingVertical: 13,
        gap: 14,
      }}
    >
      <View
        style={{
          width: 44,
          height: 44,
          borderRadius: 22,
          backgroundColor: isCredit ? Colors.accentSoft : Colors.bg.overlay,
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <Ionicons
          name={iconName}
          size={20}
          color={isCredit ? Colors.accent : Colors.text.secondary}
        />
      </View>

      <View style={{ flex: 1 }}>
        <Text
          style={{ color: Colors.text.primary, fontSize: 14, fontFamily: Fonts.semiBold }}
          numberOfLines={1}
        >
          {tx.merchant_name ?? tx.name}
        </Text>
        <Text style={{ color: Colors.text.muted, fontSize: 12, marginTop: 2 }}>
          {tx.category?.name ?? "Uncategorized"}
          {" · "}
          {formatDate(tx.date)}
          {tx.pending ? " · Pending" : ""}
        </Text>
      </View>

      <Text style={{ color: amountColor, fontSize: 15, fontFamily: Fonts.bold, letterSpacing: -0.3 }}>
        {sign}{formatCurrency(tx.amount)}
      </Text>
    </TouchableOpacity>
  );
}
