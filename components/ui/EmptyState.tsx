import { View, Text } from "react-native";
import { Colors } from "@/constants/theme";

interface EmptyStateProps {
  icon?: string;
  title: string;
  subtitle?: string;
}

export default function EmptyState({ icon = "🌿", title, subtitle }: EmptyStateProps) {
  return (
    <View style={{ alignItems: "center", paddingVertical: 48 }}>
      <Text style={{ fontSize: 40, marginBottom: 12 }}>{icon}</Text>
      <Text style={{ color: Colors.text.secondary, fontSize: 16, fontWeight: "600", marginBottom: 4 }}>
        {title}
      </Text>
      {subtitle && (
        <Text style={{ color: Colors.text.muted, fontSize: 13, textAlign: "center", paddingHorizontal: 32 }}>
          {subtitle}
        </Text>
      )}
    </View>
  );
}
