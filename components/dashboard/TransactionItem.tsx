import { View, Text, TouchableOpacity } from "react-native";
import { Colors } from "@/constants/theme";
import { formatCurrency, formatDate } from "@/lib/utils";
import type { Transaction } from "@/types";

interface TransactionItemProps {
  transaction: Transaction;
  onPress?: (tx: Transaction) => void;
}

export default function TransactionItem({ transaction: tx, onPress }: TransactionItemProps) {
  const isCredit = tx.type === "credit";
  const amountColor = isCredit ? Colors.neonGreen : Colors.text.primary;
  const sign = isCredit ? "+" : "-";
  const emoji = tx.category?.emoji ?? (isCredit ? "💰" : "💳");

  return (
    <TouchableOpacity
      onPress={() => onPress?.(tx)}
      activeOpacity={0.7}
      style={{
        flexDirection: "row",
        alignItems: "center",
        paddingVertical: 12,
        gap: 12,
      }}
    >
      {/* Icon bubble */}
      <View
        style={{
          width: 42,
          height: 42,
          borderRadius: 12,
          backgroundColor: Colors.bg.overlay,
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <Text style={{ fontSize: 18 }}>{emoji}</Text>
      </View>

      {/* Name + category */}
      <View style={{ flex: 1 }}>
        <Text
          style={{ color: Colors.text.primary, fontSize: 14, fontWeight: "500" }}
          numberOfLines={1}
        >
          {tx.merchant_name ?? tx.name}
        </Text>
        <Text style={{ color: Colors.text.muted, fontSize: 12, marginTop: 2 }}>
          {tx.category?.name ?? "Uncategorized"} · {formatDate(tx.date)}
          {tx.pending ? " · Pending" : ""}
        </Text>
      </View>

      {/* Amount */}
      <Text style={{ color: amountColor, fontSize: 15, fontWeight: "600" }}>
        {sign}{formatCurrency(tx.amount)}
      </Text>
    </TouchableOpacity>
  );
}
