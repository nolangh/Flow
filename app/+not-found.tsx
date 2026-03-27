import { View, Text } from "react-native";
import { Link } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { Colors } from "@/constants/theme";

export default function NotFoundScreen() {
  return (
    <View style={{ flex: 1, backgroundColor: "#000", alignItems: "center", justifyContent: "center", padding: 32 }}>
      <View style={{ width: 72, height: 72, borderRadius: 36, backgroundColor: Colors.bg.overlay, alignItems: "center", justifyContent: "center", marginBottom: 20 }}>
        <Ionicons name="compass-outline" size={36} color={Colors.text.muted} />
      </View>
      <Text style={{ color: Colors.text.primary, fontSize: 22, fontWeight: "800", marginBottom: 8 }}>
        Page not found
      </Text>
      <Text style={{ color: Colors.text.muted, fontSize: 14, textAlign: "center", marginBottom: 32, lineHeight: 20 }}>
        The screen you're looking for doesn't exist.
      </Text>
      <Link href="/" style={{ color: Colors.accent, fontSize: 15, fontWeight: "600" }}>
        Go Home
      </Link>
    </View>
  );
}
