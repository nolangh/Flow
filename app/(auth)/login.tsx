import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  Alert,
} from "react-native";
import { useState } from "react";
import { Link, router } from "expo-router";
import { useAuthStore } from "@/store/authStore";
import { Colors, pillShadow } from "@/constants/theme";

export default function LoginScreen() {
  const { signIn, isLoading } = useAuthStore();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const handleLogin = async () => {
    if (!email || !password) return;
    try {
      await signIn(email.trim().toLowerCase(), password);
      router.replace("/");
    } catch (err: unknown) {
      Alert.alert("Sign in failed", (err as Error).message);
    }
  };

  return (
    <KeyboardAvoidingView
      className="flex-1 bg-black"
      behavior={Platform.OS === "ios" ? "padding" : "height"}
    >
      <View className="flex-1 justify-center px-8">
        {/* Logo / wordmark */}
        <View className="mb-12">
          <Text
            style={{ color: Colors.neonGreen, fontSize: 42, fontWeight: "900", letterSpacing: -1 }}
          >
            Flow
          </Text>
          <Text style={{ color: Colors.text.secondary, fontSize: 15, marginTop: 4 }}>
            Your shared financial hub.
          </Text>
        </View>

        {/* Inputs */}
        <View className="gap-3 mb-6">
          <TextInput
            className="rounded-xl px-4 py-4 text-white text-base"
            style={{ backgroundColor: Colors.bg.surface, borderColor: Colors.border.subtle, borderWidth: 1 }}
            placeholder="Email"
            placeholderTextColor={Colors.text.muted}
            keyboardType="email-address"
            autoCapitalize="none"
            value={email}
            onChangeText={setEmail}
          />
          <TextInput
            className="rounded-xl px-4 py-4 text-white text-base"
            style={{ backgroundColor: Colors.bg.surface, borderColor: Colors.border.subtle, borderWidth: 1 }}
            placeholder="Password"
            placeholderTextColor={Colors.text.muted}
            secureTextEntry
            value={password}
            onChangeText={setPassword}
          />
        </View>

        {/* Sign in button */}
        <TouchableOpacity
          onPress={handleLogin}
          disabled={isLoading}
          className="rounded-full py-4 items-center justify-center mb-4"
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
            <Text style={{ color: "#000", fontWeight: "700", fontSize: 16 }}>Sign In</Text>
          )}
        </TouchableOpacity>

        {/* Register link */}
        <View className="flex-row justify-center gap-1 mt-2">
          <Text style={{ color: Colors.text.secondary }}>No account?</Text>
          <Link href="/(auth)/register">
            <Text style={{ color: Colors.neonGreen, fontWeight: "600" }}>Create one</Text>
          </Link>
        </View>
      </View>
    </KeyboardAvoidingView>
  );
}
