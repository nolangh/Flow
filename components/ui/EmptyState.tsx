import { View, Text } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { Colors } from "@/constants/theme";

interface EmptyStateProps {
  icon?: string;
  title: string;
  subtitle?: string;
}

export default function EmptyState({ icon, title, subtitle }: EmptyStateProps) {
  return (
    <View style={{ alignItems: "center", paddingVertical: 48 }}>
      <View style={{
        width: 56, height: 56, borderRadius: 28,
        backgroundColor: Colors.bg.overlay,
        alignItems: "center", justifyContent: "center",
        marginBottom: 16,
      }}>
        <Ionicons name="receipt-outline" size={24} color={Colors.text.muted} />
      </View>
      <Text style={{ color: Colors.text.secondary, fontSize: 16, fontWeight: "600", marginBottom: 4 }}>
        {title}
      </Text>
      {subtitle && (
        <Text style={{ color: Colors.text.muted, fontSize: 13, textAlign: "center", paddingHorizontal: 32, lineHeight: 18 }}>
          {subtitle}
        </Text>
      )}
    </View>
  );
}
