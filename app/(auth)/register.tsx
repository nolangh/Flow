import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  Alert,
  ScrollView,
  StatusBar,
} from "react-native";
import { useState } from "react";
import { Link, router } from "expo-router";
import { useAuthStore } from "@/store/authStore";
import { Colors, pillShadow } from "@/constants/theme";

export default function RegisterScreen() {
  const { signUp, isLoading } = useAuthStore();
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [focusedField, setFocusedField] = useState<string | null>(null);

  const handleRegister = async () => {
    if (!fullName || !email || !password) {
      Alert.alert("Missing fields", "Please fill in all fields.");
      return;
    }
    if (password !== confirm) {
      Alert.alert("Passwords don't match");
      return;
    }
    if (password.length < 8) {
      Alert.alert("Weak password", "Use at least 8 characters.");
      return;
    }
    try {
      await signUp(email.trim().toLowerCase(), password, fullName.trim());
      router.replace("/(auth)/household");
    } catch (err: unknown) {
      Alert.alert("Sign up failed", (err as Error).message);
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
    marginBottom: 12,
  });

  return (
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: "#000" }}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
    >
      <StatusBar barStyle="light-content" />
      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ justifyContent: "center", paddingHorizontal: 28, paddingVertical: 60 }}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
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
          <Text style={{ color: Colors.text.primary, fontSize: 30, fontWeight: "800", letterSpacing: -0.8 }}>
            Create account
          </Text>
          <Text style={{ color: Colors.text.muted, fontSize: 15, marginTop: 6 }}>
            Set up your Flow profile
          </Text>
        </View>

        <TextInput
          style={inputStyle("name")}
          placeholder="Full name"
          placeholderTextColor={Colors.text.muted}
          autoCapitalize="words"
          value={fullName}
          onChangeText={setFullName}
          onFocus={() => setFocusedField("name")}
          onBlur={() => setFocusedField(null)}
        />
        <TextInput
          style={inputStyle("email")}
          placeholder="Email address"
          placeholderTextColor={Colors.text.muted}
          keyboardType="email-address"
          autoCapitalize="none"
          autoCorrect={false}
          value={email}
          onChangeText={setEmail}
          onFocus={() => setFocusedField("email")}
          onBlur={() => setFocusedField(null)}
        />
        <TextInput
          style={inputStyle("password")}
          placeholder="Password"
          placeholderTextColor={Colors.text.muted}
          secureTextEntry
          value={password}
          onChangeText={setPassword}
          onFocus={() => setFocusedField("password")}
          onBlur={() => setFocusedField(null)}
        />
        <TextInput
          style={inputStyle("confirm")}
          placeholder="Confirm password"
          placeholderTextColor={Colors.text.muted}
          secureTextEntry
          value={confirm}
          onChangeText={setConfirm}
          onFocus={() => setFocusedField("confirm")}
          onBlur={() => setFocusedField(null)}
        />

        <TouchableOpacity
          onPress={handleRegister}
          disabled={isLoading}
          style={{
            backgroundColor: Colors.accent,
            borderRadius: 9999,
            paddingVertical: 17,
            alignItems: "center",
            marginTop: 8,
            ...pillShadow(Colors.accent),
          }}
        >
          {isLoading ? (
            <ActivityIndicator color="#000" />
          ) : (
            <Text style={{ color: "#000", fontWeight: "700", fontSize: 16 }}>Create Account</Text>
          )}
        </TouchableOpacity>

        <View style={{ flexDirection: "row", justifyContent: "center", marginTop: 24, gap: 4 }}>
          <Text style={{ color: Colors.text.muted, fontSize: 14 }}>Already have an account?</Text>
          <Link href="/(auth)/login">
            <Text style={{ color: Colors.accent, fontWeight: "600", fontSize: 14 }}>Sign in</Text>
          </Link>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
