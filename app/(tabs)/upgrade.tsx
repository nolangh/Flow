import {
  View, Text, ScrollView, TouchableOpacity,
  Alert, Platform, StatusBar,
} from "react-native";
import { useState } from "react";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { Colors, Fonts } from "@/constants/theme";
import { UPGRADE_BENEFITS } from "@/constants/features";
import { adaptlyConfigured, showPaywall, restorePurchases } from "@/lib/adaptly";
import Button from "@/components/ui/Button";

const PLANS = [
  {
    id: "monthly",
    label: "Monthly",
    price: "$4.99",
    period: "/mo",
    badge: null,
  },
  {
    id: "annual",
    label: "Annual",
    price: "$39.99",
    period: "/yr",
    badge: "Save 33%",
  },
];

export default function UpgradeScreen() {
  const [selectedPlan, setSelectedPlan] = useState<"monthly" | "annual">("annual");
  const [loading, setLoading] = useState(false);
  const [restoring, setRestoring] = useState(false);

  const handleUpgrade = async () => {
    if (!adaptlyConfigured) {
      Alert.alert(
        "Adaptly Not Configured",
        "Add your Adaptly API key as EXPO_PUBLIC_ADAPTLY_KEY in Replit Secrets, then install the Adaptly SDK to enable purchases."
      );
      return;
    }
    setLoading(true);
    try {
      const purchased = await showPaywall("upgrade_screen");
      if (purchased) {
        Alert.alert("Welcome to Flow Premium! 🎉", "All features are now unlocked.");
      }
    } catch (err: unknown) {
      Alert.alert("Purchase failed", (err as Error).message);
    } finally {
      setLoading(false);
    }
  };

  const handleRestore = async () => {
    if (!adaptlyConfigured) return;
    setRestoring(true);
    try {
      const status = await restorePurchases();
      if (status.isActive) {
        Alert.alert("Purchases Restored", "Your premium subscription has been restored.");
      } else {
        Alert.alert("No Purchases Found", "No active subscription was found for this account.");
      }
    } finally {
      setRestoring(false);
    }
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: "#000" }} edges={["top"]}>
      <StatusBar barStyle="light-content" />
      <ScrollView contentContainerStyle={{ paddingBottom: 50 }} showsVerticalScrollIndicator={false}>

        {/* Hero */}
        <LinearGradient
          colors={["#001a0a", "#000000"]}
          style={{ paddingTop: 20, paddingBottom: 40, paddingHorizontal: 24, alignItems: "center" }}
        >
          <View style={{
            width: 72, height: 72, borderRadius: 36,
            backgroundColor: Colors.accentSoft,
            alignItems: "center", justifyContent: "center",
            borderWidth: 1, borderColor: Colors.accentBorder,
            marginBottom: 20,
          }}>
            <Ionicons name="sparkles" size={32} color={Colors.accent} />
          </View>
          <Text style={{ color: Colors.text.primary, fontSize: 28, fontFamily: Fonts.extraBold, letterSpacing: -0.5, textAlign: "center", marginBottom: 10 }}>
            Flow Premium
          </Text>
          <Text style={{ color: Colors.text.muted, fontSize: 15, textAlign: "center", lineHeight: 22 }}>
            AI-powered budgeting, bank sync, goals tracking, and more — all in one app.
          </Text>
        </LinearGradient>

        {/* Plan picker */}
        <View style={{ paddingHorizontal: 20, marginBottom: 24 }}>
          <View style={{ flexDirection: "row", gap: 10 }}>
            {PLANS.map((plan) => (
              <TouchableOpacity
                key={plan.id}
                onPress={() => setSelectedPlan(plan.id as "monthly" | "annual")}
                style={{
                  flex: 1, borderRadius: 18, padding: 16,
                  backgroundColor: selectedPlan === plan.id ? Colors.accentSoft : Colors.bg.surface,
                  borderWidth: 2,
                  borderColor: selectedPlan === plan.id ? Colors.accent : Colors.border.subtle,
                  alignItems: "center", gap: 4,
                }}
              >
                {plan.badge && (
                  <View style={{
                    backgroundColor: Colors.accent, borderRadius: 8,
                    paddingHorizontal: 8, paddingVertical: 3, marginBottom: 4,
                  }}>
                    <Text style={{ color: "#000", fontSize: 10, fontFamily: Fonts.extraBold }}>{plan.badge}</Text>
                  </View>
                )}
                <Text style={{ color: selectedPlan === plan.id ? Colors.accent : Colors.text.secondary, fontSize: 13, fontFamily: Fonts.semiBold }}>
                  {plan.label}
                </Text>
                <Text style={{ color: Colors.text.primary, fontSize: 22, fontFamily: Fonts.extraBold }}>{plan.price}</Text>
                <Text style={{ color: Colors.text.muted, fontSize: 12 }}>{plan.period}</Text>
                {selectedPlan === plan.id && (
                  <View style={{ width: 20, height: 20, borderRadius: 10, backgroundColor: Colors.accent, alignItems: "center", justifyContent: "center", marginTop: 4 }}>
                    <Ionicons name="checkmark" size={12} color="#000" />
                  </View>
                )}
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Benefits */}
        <View style={{ paddingHorizontal: 20, gap: 10, marginBottom: 28 }}>
          <Text style={{ color: Colors.text.muted, fontSize: 11, fontFamily: Fonts.semiBold, textTransform: "uppercase", letterSpacing: 0.8, marginBottom: 4 }}>
            Everything included
          </Text>
          {UPGRADE_BENEFITS.map((benefit) => (
            <View
              key={benefit.title}
              style={{
                backgroundColor: Colors.bg.surface, borderRadius: 16, padding: 14,
                borderWidth: 1, borderColor: Colors.border.subtle,
                flexDirection: "row", alignItems: "center", gap: 12,
              }}
            >
              <View style={{
                width: 38, height: 38, borderRadius: 19,
                backgroundColor: Colors.bg.overlay,
                alignItems: "center", justifyContent: "center",
              }}>
                <Ionicons name={benefit.icon as any} size={18} color={Colors.accent} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={{ color: Colors.text.primary, fontSize: 14, fontFamily: Fonts.bold }}>{benefit.title}</Text>
                <Text style={{ color: Colors.text.muted, fontSize: 12, lineHeight: 16, marginTop: 1 }}>{benefit.description}</Text>
              </View>
              <Ionicons name="checkmark-circle" size={18} color={Colors.accent} />
            </View>
          ))}
        </View>

        {/* CTA */}
        <View style={{ paddingHorizontal: 20, gap: 12 }}>
          <Button
            label={loading ? "Opening…" : `Start ${selectedPlan === "annual" ? "Annual" : "Monthly"} Plan`}
            variant="primary"
            loading={loading}
            onPress={handleUpgrade}
          />
          <Text style={{ color: Colors.text.muted, fontSize: 11, textAlign: "center" }}>
            {selectedPlan === "annual" ? "$39.99/year" : "$4.99/month"} · Cancel anytime · Secure payment via App Store / Google Play
          </Text>
          <TouchableOpacity onPress={handleRestore} disabled={restoring} style={{ alignItems: "center", padding: 10 }}>
            <Text style={{ color: Colors.text.muted, fontSize: 13, textDecorationLine: "underline" }}>
              {restoring ? "Restoring…" : "Restore Purchases"}
            </Text>
          </TouchableOpacity>
        </View>

        {!adaptlyConfigured && (
          <View style={{
            marginHorizontal: 20, marginTop: 16, backgroundColor: "#1a1400",
            borderRadius: 12, padding: 12, borderWidth: 1, borderColor: "#3a2f00",
          }}>
            <Text style={{ color: "#facc15", fontSize: 12, fontFamily: Fonts.semiBold, marginBottom: 2 }}>Dev Mode — Adaptly not configured</Text>
            <Text style={{ color: "#facc15", fontSize: 11 }}>
              Add EXPO_PUBLIC_ADAPTLY_KEY to secrets and install the Adaptly SDK to enable real purchases.
            </Text>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}
