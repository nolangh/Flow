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

  const handleRegister = async () => {
    if (!fullName || !email || !password) {
      Alert.alert("Missing fields", "Please fill in all fields.");
      return;
    }
    if (password !== confirm) {
      Alert.alert("Passwords do not match");
      return;
    }
    if (password.length < 8) {
      Alert.alert("Weak password", "Password must be at least 8 characters.");
      return;
    }
    try {
      await signUp(email.trim().toLowerCase(), password, fullName.trim());
      router.replace("/(auth)/household");
    } catch (err: unknown) {
      Alert.alert("Sign up failed", (err as Error).message);
    }
  };

  return (
    <KeyboardAvoidingView
      className="flex-1 bg-black"
      behavior={Platform.OS === "ios" ? "padding" : "height"}
    >
      <ScrollView
        className="flex-1"
        contentContainerStyle={{ justifyContent: "center", paddingHorizontal: 32, paddingVertical: 60 }}
        keyboardShouldPersistTaps="handled"
      >
        <View className="mb-10">
          <Text style={{ color: Colors.neonGreen, fontSize: 32, fontWeight: "900", letterSpacing: -1 }}>
            Create account
          </Text>
          <Text style={{ color: Colors.text.secondary, fontSize: 15, marginTop: 4 }}>
            Set up your Flow profile.
          </Text>
        </View>

        <View className="gap-3 mb-6">
          {[
            { label: "Full Name", value: fullName, setter: setFullName, keyboard: "default" as const },
            { label: "Email", value: email, setter: setEmail, keyboard: "email-address" as const },
            { label: "Password", value: password, setter: setPassword, secure: true },
            { label: "Confirm Password", value: confirm, setter: setConfirm, secure: true },
          ].map(({ label, value, setter, keyboard, secure }) => (
            <TextInput
              key={label}
              className="rounded-xl px-4 py-4 text-white text-base"
              style={{ backgroundColor: Colors.bg.surface, borderColor: Colors.border.subtle, borderWidth: 1 }}
              placeholder={label}
              placeholderTextColor={Colors.text.muted}
              keyboardType={keyboard}
              autoCapitalize={secure || keyboard === "email-address" ? "none" : "words"}
              secureTextEntry={secure}
              value={value}
              onChangeText={setter}
            />
          ))}
        </View>

        <TouchableOpacity
          onPress={handleRegister}
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
            <Text style={{ color: "#000", fontWeight: "700", fontSize: 16 }}>Create Account</Text>
          )}
        </TouchableOpacity>

        <View className="flex-row justify-center gap-1">
          <Text style={{ color: Colors.text.secondary }}>Already have an account?</Text>
          <Link href="/(auth)/login">
            <Text style={{ color: Colors.neonGreen, fontWeight: "600" }}>Sign in</Text>
          </Link>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
