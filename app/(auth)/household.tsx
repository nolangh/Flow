import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
} from "react-native";
import { useState } from "react";
import { router } from "expo-router";
import { useAuthStore } from "@/store/authStore";
import { Colors, pillShadow } from "@/constants/theme";

export default function HouseholdScreen() {
  const { createHousehold, joinHousehold, isLoading } = useAuthStore();
  const [mode, setMode] = useState<"create" | "join">("create");
  const [householdName, setHouseholdName] = useState("");
  const [inviteCode, setInviteCode] = useState("");

  const handleSubmit = async () => {
    try {
      if (mode === "create") {
        if (!householdName.trim()) return Alert.alert("Enter a household name.");
        await createHousehold(householdName.trim());
      } else {
        if (!inviteCode.trim()) return Alert.alert("Enter an invite code.");
        await joinHousehold(inviteCode.trim());
      }
      router.replace("/(tabs)");
    } catch (err: unknown) {
      Alert.alert("Error", (err as Error).message);
    }
  };

  return (
    <View className="flex-1 bg-black justify-center px-8">
      <Text style={{ color: Colors.neonGreen, fontSize: 30, fontWeight: "900", letterSpacing: -1, marginBottom: 6 }}>
        Your Household
      </Text>
      <Text style={{ color: Colors.text.secondary, fontSize: 14, marginBottom: 32 }}>
        Create a shared space or join your partner's.
      </Text>

      {/* Toggle */}
      <View
        className="flex-row rounded-full p-1 mb-8"
        style={{ backgroundColor: Colors.bg.surface }}
      >
        {(["create", "join"] as const).map((m) => (
          <TouchableOpacity
            key={m}
            onPress={() => setMode(m)}
            className="flex-1 rounded-full py-3 items-center"
            style={mode === m ? { backgroundColor: Colors.neonGreen } : undefined}
          >
            <Text
              style={{
                color: mode === m ? "#000" : Colors.text.secondary,
                fontWeight: "600",
                fontSize: 14,
                textTransform: "capitalize",
              }}
            >
              {m === "create" ? "Create New" : "Join Existing"}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {mode === "create" ? (
        <TextInput
          className="rounded-xl px-4 py-4 text-white text-base mb-6"
          style={{ backgroundColor: Colors.bg.surface, borderColor: Colors.border.subtle, borderWidth: 1 }}
          placeholder="e.g. The Smiths"
          placeholderTextColor={Colors.text.muted}
          value={householdName}
          onChangeText={setHouseholdName}
        />
      ) : (
        <View className="mb-6">
          <TextInput
            className="rounded-xl px-4 py-4 text-white text-base"
            style={{ backgroundColor: Colors.bg.surface, borderColor: Colors.border.subtle, borderWidth: 1 }}
            placeholder="6-character invite code"
            placeholderTextColor={Colors.text.muted}
            autoCapitalize="characters"
            maxLength={6}
            value={inviteCode}
            onChangeText={setInviteCode}
          />
          <Text style={{ color: Colors.text.muted, fontSize: 12, marginTop: 6 }}>
            Your partner can find this code in Settings → Household.
          </Text>
        </View>
      )}

      <TouchableOpacity
        onPress={handleSubmit}
        disabled={isLoading}
        className="rounded-full py-4 items-center"
        style={{
          backgroundColor: Colors.neonGreen,
          borderBottomWidth: 3,
          borderBottomColor: Colors.neonGreenDim,
          ...pillShadow(Colors.neonGreen),
        }}
      >
        {isLoading ? (
          <ActivityIndicator color="#000" />
        ) : (
          <Text style={{ color: "#000", fontWeight: "700", fontSize: 16 }}>
            {mode === "create" ? "Create Household" : "Join Household"}
          </Text>
        )}
      </TouchableOpacity>
    </View>
  );
}
