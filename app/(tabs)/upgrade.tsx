import {
  View, Text, ScrollView, TouchableOpacity,
  Alert, StatusBar,
} from "react-native";
import { useState } from "react";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { Colors, Fonts } from "@/constants/theme";
import { UPGRADE_BENEFITS, TIER_DEFINITIONS, type TierDefinition } from "@/constants/features";
import { adaptlyConfigured, showPaywall, restorePurchases } from "@/lib/adaptly";
import Button from "@/components/ui/Button";

type Billing = "monthly" | "annual";

function TierCard({
  tier,
  billing,
  selected,
  onSelect,
}: {
  tier: TierDefinition;
  billing: Billing;
  selected: boolean;
  onSelect: () => void;
}) {
  const price = billing === "annual" ? tier.annualMonthly : tier.monthlyPrice + "/mo";
  const billed = billing === "annual"
    ? `${tier.annualPrice} billed annually`
    : "billed monthly";

  return (
    <TouchableOpacity
      onPress={onSelect}
      activeOpacity={0.75}
      style={{
        borderRadius: 20,
        borderWidth: 2,
        borderColor: selected ? Colors.accent : Colors.border.subtle,
        backgroundColor: selected ? Colors.accentSoft : Colors.bg.surface,
        padding: 18,
        marginBottom: 12,
        overflow: "hidden",
      }}
    >
      {tier.mostPopular && (
        <View style={{
          position: "absolute", top: 0, right: 0,
          backgroundColor: Colors.accent,
          paddingHorizontal: 12, paddingVertical: 5,
          borderBottomLeftRadius: 14,
        }}>
          <Text style={{ color: "#000", fontSize: 10, fontFamily: Fonts.extraBold }}>
            MOST POPULAR
          </Text>
        </View>
      )}

      <View style={{ flexDirection: "row", alignItems: "center", gap: 12, marginBottom: 12 }}>
        <View style={{
          width: 42, height: 42, borderRadius: 21,
          backgroundColor: selected ? Colors.accent : Colors.bg.overlay,
          alignItems: "center", justifyContent: "center",
        }}>
          <Ionicons name={tier.icon as any} size={20} color={selected ? "#000" : Colors.text.secondary} />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={{ color: Colors.text.primary, fontSize: 17, fontFamily: Fonts.extraBold }}>
            {tier.name}
          </Text>
          <Text style={{ color: Colors.text.muted, fontSize: 12, marginTop: 1 }}>
            {tier.tagline}
          </Text>
        </View>
        <View style={{ alignItems: "flex-end" }}>
          <Text style={{ color: selected ? Colors.accent : Colors.text.primary, fontSize: 22, fontFamily: Fonts.extraBold }}>
            {price}
          </Text>
          {billing === "annual" && (
            <View style={{
              backgroundColor: selected ? Colors.accent : Colors.bg.overlay,
              borderRadius: 8, paddingHorizontal: 6, paddingVertical: 2, marginTop: 2,
            }}>
              <Text style={{ color: selected ? "#000" : Colors.text.muted, fontSize: 10, fontFamily: Fonts.bold }}>
                {tier.savingsBadge}
              </Text>
            </View>
          )}
        </View>
      </View>

      <View style={{
        flexDirection: "row", gap: 16, paddingTop: 12,
        borderTopWidth: 1,
        borderTopColor: selected ? Colors.accentBorder : Colors.border.subtle,
      }}>
        <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
          <Ionicons name="home-outline" size={13} color={selected ? Colors.accent : Colors.text.muted} />
          <Text style={{ color: selected ? Colors.accent : Colors.text.muted, fontSize: 12, fontFamily: Fonts.medium }}>
            {tier.maxHouseholds === null ? "Unlimited" : tier.maxHouseholds === 1 ? "1 household" : `${tier.maxHouseholds} households`}
          </Text>
        </View>
        <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
          <Ionicons name="people-outline" size={13} color={selected ? Colors.accent : Colors.text.muted} />
          <Text style={{ color: selected ? Colors.accent : Colors.text.muted, fontSize: 12, fontFamily: Fonts.medium }}>
            {tier.maxMembers} members each
          </Text>
        </View>
      </View>

      <Text style={{ color: Colors.text.muted, fontSize: 11, marginTop: 8 }}>
        {billed}
      </Text>

      {selected && (
        <View style={{
          position: "absolute", bottom: 18, right: 18,
          width: 22, height: 22, borderRadius: 11,
          backgroundColor: Colors.accent,
          alignItems: "center", justifyContent: "center",
        }}>
          <Ionicons name="checkmark" size={13} color="#000" />
        </View>
      )}
    </TouchableOpacity>
  );
}

export default function UpgradeScreen() {
  const [selectedTier, setSelectedTier] = useState<"personal" | "family" | "power">("family");
  const [billing, setBilling] = useState<Billing>("annual");
  const [loading, setLoading] = useState(false);
  const [restoring, setRestoring] = useState(false);

  const activeTier = TIER_DEFINITIONS.find((t) => t.id === selectedTier)!;

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
      const productId = billing === "annual"
        ? activeTier.annualProductId
        : activeTier.monthlyProductId;
      const purchased = await showPaywall("upgrade_screen", productId);
      if (purchased) {
        Alert.alert("Welcome to Flow Premium!", `Your ${activeTier.name} plan is now active.`);
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
          style={{ paddingTop: 20, paddingBottom: 32, paddingHorizontal: 24, alignItems: "center" }}
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
            Every plan includes all features. Pay once per household — every member is covered.
          </Text>
        </LinearGradient>

        {/* Billing toggle */}
        <View style={{ paddingHorizontal: 20, marginBottom: 20 }}>
          <View style={{
            flexDirection: "row",
            backgroundColor: Colors.bg.surface,
            borderRadius: 14,
            borderWidth: 1,
            borderColor: Colors.border.subtle,
            padding: 4,
          }}>
            {(["monthly", "annual"] as Billing[]).map((b) => (
              <TouchableOpacity
                key={b}
                onPress={() => setBilling(b)}
                style={{
                  flex: 1, paddingVertical: 10, borderRadius: 11, alignItems: "center",
                  backgroundColor: billing === b ? Colors.accent : "transparent",
                }}
              >
                <Text style={{
                  color: billing === b ? "#000" : Colors.text.muted,
                  fontSize: 13, fontFamily: Fonts.bold,
                  textTransform: "capitalize",
                }}>
                  {b}{b === "annual" ? " · Best value" : ""}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Tier cards */}
        <View style={{ paddingHorizontal: 20, marginBottom: 24 }}>
          {TIER_DEFINITIONS.map((tier) => (
            <TierCard
              key={tier.id}
              tier={tier}
              billing={billing}
              selected={selectedTier === tier.id}
              onSelect={() => setSelectedTier(tier.id)}
            />
          ))}
        </View>

        {/* What's included */}
        <View style={{ paddingHorizontal: 20, gap: 10, marginBottom: 28 }}>
          <Text style={{ color: Colors.text.muted, fontSize: 11, fontFamily: Fonts.semiBold, textTransform: "uppercase", letterSpacing: 0.8, marginBottom: 4 }}>
            Everything included in all plans
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
            label={loading ? "Opening…" : `Start ${activeTier.name} ${billing === "annual" ? "Annual" : "Monthly"}`}
            variant="primary"
            loading={loading}
            onPress={handleUpgrade}
          />
          <Text style={{ color: Colors.text.muted, fontSize: 11, textAlign: "center" }}>
            {billing === "annual" ? activeTier.annualPrice + "/year" : activeTier.monthlyPrice + "/month"} · Cancel anytime · Secure payment via App Store / Google Play
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
