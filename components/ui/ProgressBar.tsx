import { View, Text } from "react-native";
import { Colors } from "@/constants/theme";

interface ProgressBarProps {
  spent: number;
  limit: number;
  showLabel?: boolean;
  height?: number;
}

export default function ProgressBar({ spent, limit, showLabel = false, height = 6 }: ProgressBarProps) {
  const pct = limit > 0 ? Math.min((spent / limit) * 100, 100) : 0;
  const overBudget = limit > 0 && spent > limit;
  const activeColor = overBudget ? Colors.dangerPink : Colors.neonGreen;
  // Overflow indicator: shows how far over (capped at 100% of the bar visually)
  const overflowPct = limit > 0 ? Math.min(((spent - limit) / limit) * 100, 100) : 0;

  return (
    <View>
      {/* Track */}
      <View
        style={{
          height,
          borderRadius: height,
          backgroundColor: Colors.bg.overlay,
          overflow: "hidden",
        }}
      >
        {/* Fill */}
        <View
          style={{
            position: "absolute",
            left: 0,
            top: 0,
            bottom: 0,
            width: `${pct}%`,
            borderRadius: height,
            backgroundColor: activeColor,
            shadowColor: activeColor,
            shadowOpacity: 0.6,
            shadowRadius: 6,
            shadowOffset: { width: 0, height: 0 },
          }}
        />
        {/* Over-budget overflow bleed (pulses from 100%) */}
        {overBudget && (
          <View
            style={{
              position: "absolute",
              right: 0,
              top: 0,
              bottom: 0,
              width: `${overflowPct}%`,
              backgroundColor: Colors.dangerPink,
              opacity: 0.35,
              borderRadius: height,
            }}
          />
        )}
      </View>

      {showLabel && (
        <View style={{ flexDirection: "row", justifyContent: "space-between", marginTop: 4 }}>
          <Text style={{ color: activeColor, fontSize: 11, fontWeight: "600" }}>
            ${spent.toFixed(0)} spent
          </Text>
          <Text style={{ color: Colors.text.muted, fontSize: 11 }}>
            ${limit.toFixed(0)} limit
          </Text>
        </View>
      )}
    </View>
  );
}
