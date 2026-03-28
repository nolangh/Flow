import { View, Text } from "react-native";
import { Colors, Fonts, useColors} from "@/constants/theme";

interface ProgressBarProps {
  spent: number;
  limit: number;
  showLabel?: boolean;
  height?: number;
  color?: string;
}

export default function ProgressBar({ spent, limit, showLabel = false, height = 5, color }: ProgressBarProps) {
  const Colors = useColors();
  const pct = limit > 0 ? Math.min((spent / limit) * 100, 100) : 0;
  const overBudget = limit > 0 && spent > limit;
  const nearBudget = limit > 0 && spent / limit >= 0.8 && !overBudget;

  const fillColor = color ?? (overBudget ? Colors.danger : nearBudget ? Colors.warning : Colors.accent);

  return (
    <View>
      <View
        style={{
          height,
          borderRadius: height,
          backgroundColor: Colors.bg.overlay,
          overflow: "hidden",
        }}
      >
        <View
          style={{
            position: "absolute",
            left: 0,
            top: 0,
            bottom: 0,
            width: `${pct}%`,
            borderRadius: height,
            backgroundColor: fillColor,
          }}
        />
      </View>

      {showLabel && (
        <View style={{ flexDirection: "row", justifyContent: "space-between", marginTop: 5 }}>
          <Text style={{ color: fillColor, fontSize: 11, fontFamily: Fonts.semiBold }}>
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
