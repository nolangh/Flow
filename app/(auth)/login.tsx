import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  Alert,
  StatusBar,
} from "react-native";
import { useState } from "react";
import { Link, router } from "expo-router";
import { useAuthStore } from "@/store/authStore";
import { Colors, pillShadow, Fonts } from "@/constants/theme";

export default function LoginScreen() {
  const { signIn, isLoading } = useAuthStore();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [focusedField, setFocusedField] = useState<string | null>(null);

  const handleLogin = async () => {
    if (!email || !password) return;
    try {
      await signIn(email.trim().toLowerCase(), password);
      router.replace("/");
    } catch (err: unknown) {
      Alert.alert("Sign in failed", (err as Error).message);
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
      <View style={{ flex: 1, justifyContent: "center", paddingHorizontal: 28 }}>

        {/* Wordmark */}
        <View style={{ marginBottom: 48 }}>
          <View style={{
            width: 56, height: 56, borderRadius: 16,
            backgroundColor: Colors.accentSoft,
            borderWidth: 1, borderColor: Colors.accentBorder,
            alignItems: "center", justifyContent: "center",
            marginBottom: 20,
          }}>
            <Text style={{ fontSize: 26, fontWeight: "900", color: Colors.accent }}>F</Text>
          </View>
          <Text style={{ color: Colors.text.primary, fontSize: 32, fontFamily: Fonts.extraBold, letterSpacing: -1 }}>
            Welcome back
          </Text>
          <Text style={{ color: Colors.text.muted, fontSize: 15, marginTop: 6, lineHeight: 22 }}>
            Sign in to your Flow account
          </Text>
        </View>

        {/* Inputs */}
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

        {/* Sign in button */}
        <TouchableOpacity
          onPress={handleLogin}
          disabled={isLoading || !email || !password}
          style={{
            backgroundColor: Colors.accent,
            borderRadius: 9999,
            paddingVertical: 17,
            alignItems: "center",
            marginTop: 8,
            opacity: (!email || !password) ? 0.5 : 1,
            ...pillShadow(Colors.accent),
          }}
        >
          {isLoading ? (
            <ActivityIndicator color="#000" />
          ) : (
            <Text style={{ color: "#000", fontFamily: Fonts.bold, fontSize: 16, letterSpacing: 0.1 }}>
              Sign In
            </Text>
          )}
        </TouchableOpacity>

        {/* Register link */}
        <View style={{ flexDirection: "row", justifyContent: "center", marginTop: 24, gap: 4 }}>
          <Text style={{ color: Colors.text.muted, fontSize: 14 }}>Don't have an account?</Text>
          <Link href="/(auth)/register">
            <Text style={{ color: Colors.accent, fontFamily: Fonts.semiBold, fontSize: 14 }}>Sign up</Text>
          </Link>
        </View>
      </View>
    </KeyboardAvoidingView>
  );
}
