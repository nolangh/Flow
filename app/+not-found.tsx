import { View, Text } from "react-native";
import { Link } from "expo-router";
import { Colors } from "@/constants/theme";

export default function NotFoundScreen() {
  return (
    <View style={{ flex: 1, backgroundColor: "#000", alignItems: "center", justifyContent: "center", padding: 32 }}>
      <Text style={{ fontSize: 48, marginBottom: 16 }}>🌿</Text>
      <Text style={{ color: Colors.text.primary, fontSize: 24, fontWeight: "800", marginBottom: 8 }}>
        Page Not Found
      </Text>
      <Text style={{ color: Colors.text.secondary, fontSize: 14, textAlign: "center", marginBottom: 32 }}>
        The screen you're looking for doesn't exist.
      </Text>
      <Link href="/" style={{ color: Colors.neonGreen, fontSize: 15, fontWeight: "600" }}>
        Go Home
      </Link>
    </View>
  );
}
