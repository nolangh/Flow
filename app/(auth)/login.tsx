import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  ScrollView,
  Platform,
  ActivityIndicator,
  Alert,
  StatusBar,
} from "react-native";
import { useState, useEffect } from "react";
import { Link, router } from "expo-router";
import { useAuthStore } from "@/store/authStore";
import { Colors, pillShadow, Fonts } from "@/constants/theme";
import {
  biometricAvailable,
  biometricTypes,
  saveCredentials,
  loadCredentials,
} from "@/lib/biometrics";
import * as LocalAuthentication from "expo-local-authentication";

export default function LoginScreen() {
  const { signIn, signInWithGoogle, signInWithApple, signInWithBiometric, isLoading } = useAuthStore();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [focusedField, setFocusedField] = useState<string | null>(null);
  const [socialLoading, setSocialLoading] = useState<"google" | "apple" | "biometric" | null>(null);
  const [showBiometric, setShowBiometric] = useState(false);
  const [biometricIcon, setBiometricIcon] = useState<"fingerprint" | "face">("fingerprint");

  useEffect(() => {
    (async () => {
      const available = await biometricAvailable();
      const creds = await loadCredentials();
      if (available && creds) {
        setShowBiometric(true);
        const types = await biometricTypes();
        if (types.includes(LocalAuthentication.AuthenticationType.FACIAL_RECOGNITION)) {
          setBiometricIcon("face");
        }
      }
    })();
  }, []);

  const handleLogin = async () => {
    if (!email || !password) return;
    try {
      await signIn(email.trim().toLowerCase(), password);
      await saveCredentials(email.trim().toLowerCase(), password);
      router.replace("/");
    } catch (err: unknown) {
      Alert.alert("Sign in failed", (err as Error).message);
    }
  };

  const handleGoogle = async () => {
    setSocialLoading("google");
    try {
      await signInWithGoogle();
      router.replace("/");
    } catch (err: unknown) {
      Alert.alert("Google sign-in failed", (err as Error).message);
    } finally {
      setSocialLoading(null);
    }
  };

  const handleApple = async () => {
    setSocialLoading("apple");
    try {
      await signInWithApple();
      router.replace("/");
    } catch (err: unknown) {
      Alert.alert("Apple sign-in failed", (err as Error).message);
    } finally {
      setSocialLoading(null);
    }
  };

  const handleBiometric = async () => {
    setSocialLoading("biometric");
    try {
      await signInWithBiometric();
      router.replace("/");
    } catch (err: unknown) {
      Alert.alert("Sign in failed", (err as Error).message);
    } finally {
      setSocialLoading(null);
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

  const anyLoading = isLoading || socialLoading !== null;

  return (
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: "#000" }}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
    >
      <StatusBar barStyle="light-content" />
      <ScrollView
        contentContainerStyle={{ flexGrow: 1, justifyContent: "center", paddingHorizontal: 28, paddingVertical: 40 }}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >

        {/* Wordmark */}
        <View style={{ marginBottom: 44 }}>
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

        {/* Email / password inputs */}
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
          editable={!anyLoading}
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
          editable={!anyLoading}
        />

        {/* Sign in button */}
        <TouchableOpacity
          onPress={handleLogin}
          disabled={anyLoading || !email || !password}
          style={{
            backgroundColor: Colors.accent,
            borderRadius: 9999,
            paddingVertical: 17,
            alignItems: "center",
            marginTop: 8,
            opacity: (!email || !password || anyLoading) ? 0.5 : 1,
            ...pillShadow(Colors.accent),
          }}
        >
          {isLoading && socialLoading === null ? (
            <ActivityIndicator color="#000" />
          ) : (
            <Text style={{ color: "#000", fontFamily: Fonts.bold, fontSize: 16, letterSpacing: 0.1 }}>
              Sign In
            </Text>
          )}
        </TouchableOpacity>

        {/* Divider */}
        <View style={{ flexDirection: "row", alignItems: "center", marginVertical: 24, gap: 12 }}>
          <View style={{ flex: 1, height: 1, backgroundColor: Colors.border.subtle }} />
          <Text style={{ color: Colors.text.muted, fontSize: 13, fontFamily: Fonts.medium }}>
            or continue with
          </Text>
          <View style={{ flex: 1, height: 1, backgroundColor: Colors.border.subtle }} />
        </View>

        {/* Social buttons row */}
        <View style={{ flexDirection: "row", gap: 12 }}>

          {/* Google */}
          <TouchableOpacity
            onPress={handleGoogle}
            disabled={anyLoading}
            style={{
              flex: 1,
              flexDirection: "row",
              alignItems: "center",
              justifyContent: "center",
              gap: 8,
              backgroundColor: Colors.bg.surface,
              borderRadius: 14,
              paddingVertical: 15,
              borderWidth: 1.5,
              borderColor: Colors.border.subtle,
              opacity: anyLoading ? 0.5 : 1,
            }}
          >
            {socialLoading === "google" ? (
              <ActivityIndicator color={Colors.text.primary} size="small" />
            ) : (
              <>
                <Text style={{ fontSize: 18 }}>G</Text>
                <Text style={{ color: Colors.text.primary, fontFamily: Fonts.semiBold, fontSize: 14 }}>Google</Text>
              </>
            )}
          </TouchableOpacity>

          {/* Apple — iOS only */}
          {Platform.OS === "ios" && (
            <TouchableOpacity
              onPress={handleApple}
              disabled={anyLoading}
              style={{
                flex: 1,
                flexDirection: "row",
                alignItems: "center",
                justifyContent: "center",
                gap: 8,
                backgroundColor: "#fff",
                borderRadius: 14,
                paddingVertical: 15,
                borderWidth: 1.5,
                borderColor: "#fff",
                opacity: anyLoading ? 0.5 : 1,
              }}
            >
              {socialLoading === "apple" ? (
                <ActivityIndicator color="#000" size="small" />
              ) : (
                <>
                  <Text style={{ fontSize: 17, color: "#000", fontFamily: "System" }}></Text>
                  <Text style={{ color: "#000", fontFamily: Fonts.semiBold, fontSize: 14 }}>Apple</Text>
                </>
              )}
            </TouchableOpacity>
          )}

          {/* Biometric */}
          {showBiometric && (
            <TouchableOpacity
              onPress={handleBiometric}
              disabled={anyLoading}
              style={{
                width: 56,
                alignItems: "center",
                justifyContent: "center",
                backgroundColor: Colors.accentSoft,
                borderRadius: 14,
                paddingVertical: 15,
                borderWidth: 1.5,
                borderColor: Colors.accentBorder,
                opacity: anyLoading ? 0.5 : 1,
              }}
            >
              {socialLoading === "biometric" ? (
                <ActivityIndicator color={Colors.accent} size="small" />
              ) : (
                <Text style={{ fontSize: 22 }}>
                  {biometricIcon === "face" ? "🪪" : "🫆"}
                </Text>
              )}
            </TouchableOpacity>
          )}
        </View>

        {/* Register link */}
        <View style={{ flexDirection: "row", justifyContent: "center", marginTop: 32, gap: 4 }}>
          <Text style={{ color: Colors.text.muted, fontSize: 14 }}>Don't have an account?</Text>
          <Link href="/(auth)/register">
            <Text style={{ color: Colors.accent, fontFamily: Fonts.semiBold, fontSize: 14 }}>Sign up</Text>
          </Link>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
