import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  StatusBar,
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
  const [focusedField, setFocusedField] = useState<string | null>(null);

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

  const inputStyle = (field: string) => ({
    backgroundColor: Colors.bg.surface,
    borderRadius: 14,
    paddingHorizontal: 18,
    paddingVertical: 16,
    color: Colors.text.primary,
    fontSize: 16,
    borderWidth: 1.5,
    borderColor: focusedField === field ? Colors.accent : Colors.border.subtle,
    marginBottom: 6,
  });

  return (
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: "#000" }}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
    >
      <StatusBar barStyle="light-content" />
      <View style={{ flex: 1, justifyContent: "center", paddingHorizontal: 28 }}>

        {/* Header */}
        <View style={{ marginBottom: 40 }}>
          <View style={{
            width: 56, height: 56, borderRadius: 16,
            backgroundColor: Colors.accentSoft,
            borderWidth: 1, borderColor: Colors.accentBorder,
            alignItems: "center", justifyContent: "center",
            marginBottom: 20,
          }}>
            <Text style={{ fontSize: 26, fontWeight: "900", color: Colors.accent }}>F</Text>
          </View>
          <Text style={{ color: Colors.text.primary, fontSize: 30, fontWeight: "800", letterSpacing: -0.8, marginBottom: 6 }}>
            Your Household
          </Text>
          <Text style={{ color: Colors.text.muted, fontSize: 15, lineHeight: 22 }}>
            Create a shared space or join your partner's.
          </Text>
        </View>

        {/* Mode toggle */}
        <View style={{
          flexDirection: "row",
          backgroundColor: Colors.bg.surface,
          borderRadius: 14,
          padding: 4,
          marginBottom: 24,
          borderWidth: 1,
          borderColor: Colors.border.subtle,
        }}>
          {(["create", "join"] as const).map((m) => (
            <TouchableOpacity
              key={m}
              onPress={() => setMode(m)}
              style={{
                flex: 1,
                borderRadius: 11,
                paddingVertical: 12,
                alignItems: "center",
                backgroundColor: mode === m ? Colors.accent : "transparent",
              }}
            >
              <Text style={{
                color: mode === m ? "#000" : Colors.text.secondary,
                fontWeight: "700",
                fontSize: 14,
              }}>
                {m === "create" ? "Create New" : "Join Existing"}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Input */}
        {mode === "create" ? (
          <TextInput
            style={inputStyle("name")}
            placeholder="Household name, e.g. The Smiths"
            placeholderTextColor={Colors.text.muted}
            value={householdName}
            onChangeText={setHouseholdName}
            onFocus={() => setFocusedField("name")}
            onBlur={() => setFocusedField(null)}
          />
        ) : (
          <View>
            <TextInput
              style={inputStyle("code")}
              placeholder="6-character invite code"
              placeholderTextColor={Colors.text.muted}
              autoCapitalize="characters"
              maxLength={6}
              value={inviteCode}
              onChangeText={setInviteCode}
              onFocus={() => setFocusedField("code")}
              onBlur={() => setFocusedField(null)}
            />
            <Text style={{ color: Colors.text.muted, fontSize: 12, marginBottom: 20 }}>
              Your partner can share this code from Settings.
            </Text>
          </View>
        )}

        {/* Submit button */}
        <TouchableOpacity
          onPress={handleSubmit}
          disabled={isLoading}
          style={{
            backgroundColor: Colors.accent,
            borderRadius: 9999,
            paddingVertical: 17,
            alignItems: "center",
            marginTop: 16,
            ...pillShadow(Colors.accent),
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
    </KeyboardAvoidingView>
  );
}
