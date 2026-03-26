import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Alert,
  Share,
  Switch,
} from "react-native";
import { useState } from "react";
import { SafeAreaView } from "react-native-safe-area-context";
import { router } from "expo-router";
import { useAuthStore } from "@/store/authStore";
import { useBudgetStore } from "@/store/budgetStore";
import { Colors, pillShadow } from "@/constants/theme";
import Card from "@/components/ui/Card";
import Divider from "@/components/ui/Divider";

interface SettingRowProps {
  label: string;
  value?: string;
  icon?: string;
  onPress?: () => void;
  rightElement?: React.ReactNode;
  destructive?: boolean;
}

function SettingRow({ label, value, icon, onPress, rightElement, destructive }: SettingRowProps) {
  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={!onPress && !rightElement}
      activeOpacity={0.7}
      style={{ flexDirection: "row", alignItems: "center", paddingVertical: 13, gap: 12 }}
    >
      {icon && (
        <View style={{ width: 32, height: 32, borderRadius: 8, backgroundColor: Colors.bg.overlay, alignItems: "center", justifyContent: "center" }}>
          <Text style={{ fontSize: 16 }}>{icon}</Text>
        </View>
      )}
      <View style={{ flex: 1 }}>
        <Text style={{ color: destructive ? Colors.dangerPink : Colors.text.primary, fontSize: 15 }}>{label}</Text>
        {value && <Text style={{ color: Colors.text.muted, fontSize: 12, marginTop: 1 }}>{value}</Text>}
      </View>
      {rightElement ?? (onPress && <Text style={{ color: Colors.text.muted, fontSize: 18 }}>›</Text>)}
    </TouchableOpacity>
  );
}

export default function SettingsScreen() {
  const { user, household, signOut } = useAuthStore();
  const { categories, deleteCategory } = useBudgetStore();
  const [notifications, setNotifications] = useState(true);
  const [signingOut, setSigningOut] = useState(false);

  const handleShareInvite = async () => {
    if (!household?.invite_code) return;
    await Share.share({
      message: `Join my household on Flow! Use invite code: ${household.invite_code}`,
    });
  };

  const handleSignOut = () => {
    Alert.alert("Sign Out", "Are you sure you want to sign out?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Sign Out",
        style: "destructive",
        onPress: async () => {
          setSigningOut(true);
          await signOut();
          router.replace("/(auth)/login");
        },
      },
    ]);
  };

  const handleDeleteCategory = (catId: string, catName: string) => {
    Alert.alert(`Delete "${catName}"?`, "This will also remove it from all transactions.", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete",
        style: "destructive",
        onPress: () => deleteCategory(catId),
      },
    ]);
  };

  const fixedBills = categories.filter((c) => c.is_fixed);

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: "#000000" }} edges={["top"]}>
      <ScrollView contentContainerStyle={{ paddingBottom: 60 }} showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={{ paddingHorizontal: 20, paddingTop: 8, paddingBottom: 20 }}>
          <Text style={{ color: Colors.text.primary, fontSize: 26, fontWeight: "800", letterSpacing: -0.5 }}>
            Settings
          </Text>
        </View>

        {/* Profile card */}
        <View style={{ paddingHorizontal: 20, marginBottom: 24 }}>
          <Card padding={16}>
            <View style={{ flexDirection: "row", alignItems: "center", gap: 14 }}>
              <View style={{ width: 52, height: 52, borderRadius: 26, backgroundColor: Colors.neonGreenGlow, borderWidth: 1, borderColor: Colors.neonGreenBorder, alignItems: "center", justifyContent: "center" }}>
                <Text style={{ fontSize: 22 }}>
                  {user?.full_name?.charAt(0).toUpperCase() ?? "?"}
                </Text>
              </View>
              <View>
                <Text style={{ color: Colors.text.primary, fontSize: 17, fontWeight: "700" }}>
                  {user?.full_name ?? "—"}
                </Text>
                <Text style={{ color: Colors.text.muted, fontSize: 13, marginTop: 2 }}>{user?.email}</Text>
              </View>
            </View>
          </Card>
        </View>

        {/* Household section */}
        <View style={{ paddingHorizontal: 20, marginBottom: 24 }}>
          <Text style={{ color: Colors.text.muted, fontSize: 11, textTransform: "uppercase", letterSpacing: 0.8, marginBottom: 8 }}>
            Household
          </Text>
          <Card padding={0} style={{ paddingHorizontal: 14 }}>
            <SettingRow
              icon="🏠"
              label={household?.name ?? "No household"}
              value="Your shared space"
            />
            <Divider />
            <SettingRow
              icon="🔑"
              label="Invite Code"
              value={household?.invite_code ?? "—"}
              onPress={handleShareInvite}
              rightElement={
                <TouchableOpacity
                  onPress={handleShareInvite}
                  style={{ backgroundColor: Colors.neonGreenGlow, borderRadius: 8, paddingHorizontal: 10, paddingVertical: 4, borderWidth: 1, borderColor: Colors.neonGreenBorder }}
                >
                  <Text style={{ color: Colors.neonGreen, fontSize: 12, fontWeight: "600" }}>Share</Text>
                </TouchableOpacity>
              }
            />
            <Divider />
            <SettingRow
              icon="👥"
              label="Members"
              value={`${(household?.members?.length ?? 1)} member${(household?.members?.length ?? 1) === 1 ? "" : "s"}`}
            />
          </Card>
        </View>

        {/* Fixed Bills section */}
        {fixedBills.length > 0 && (
          <View style={{ paddingHorizontal: 20, marginBottom: 24 }}>
            <Text style={{ color: Colors.text.muted, fontSize: 11, textTransform: "uppercase", letterSpacing: 0.8, marginBottom: 8 }}>
              Recurring Bills
            </Text>
            <Card padding={0} style={{ paddingHorizontal: 14 }}>
              {fixedBills.map((bill, idx) => (
                <View key={bill.id}>
                  <SettingRow
                    icon={bill.emoji ?? "💳"}
                    label={bill.name}
                    value={`$${bill.monthly_limit.toFixed(2)} · Day ${bill.fixed_day_of_month ?? "—"}`}
                    onPress={() => handleDeleteCategory(bill.id, bill.name)}
                    destructive={false}
                  />
                  {idx < fixedBills.length - 1 && <Divider />}
                </View>
              ))}
            </Card>
          </View>
        )}

        {/* Preferences */}
        <View style={{ paddingHorizontal: 20, marginBottom: 24 }}>
          <Text style={{ color: Colors.text.muted, fontSize: 11, textTransform: "uppercase", letterSpacing: 0.8, marginBottom: 8 }}>
            Preferences
          </Text>
          <Card padding={0} style={{ paddingHorizontal: 14 }}>
            <SettingRow
              icon="🔔"
              label="Budget Alerts"
              value="Get notified when you're near a limit"
              rightElement={
                <Switch
                  value={notifications}
                  onValueChange={setNotifications}
                  trackColor={{ false: Colors.bg.overlay, true: Colors.neonGreenDim }}
                  thumbColor={notifications ? Colors.neonGreen : Colors.text.muted}
                />
              }
            />
            <Divider />
            <SettingRow
              icon="🔗"
              label="Connect Bank Account"
              value="Plaid integration — coming soon"
            />
          </Card>
        </View>

        {/* About */}
        <View style={{ paddingHorizontal: 20, marginBottom: 24 }}>
          <Text style={{ color: Colors.text.muted, fontSize: 11, textTransform: "uppercase", letterSpacing: 0.8, marginBottom: 8 }}>
            About
          </Text>
          <Card padding={0} style={{ paddingHorizontal: 14 }}>
            <SettingRow icon="📄" label="Terms of Service" onPress={() => {}} />
            <Divider />
            <SettingRow icon="🔒" label="Privacy Policy" onPress={() => {}} />
            <Divider />
            <SettingRow icon="ℹ️" label="Version" value="1.0.0" />
          </Card>
        </View>

        {/* Sign out */}
        <View style={{ paddingHorizontal: 20 }}>
          <TouchableOpacity
            onPress={handleSignOut}
            disabled={signingOut}
            style={{
              backgroundColor: Colors.dangerPinkGlow,
              borderRadius: 9999,
              paddingVertical: 15,
              alignItems: "center",
              borderWidth: 1,
              borderColor: Colors.dangerPinkBorder,
              borderBottomWidth: 3,
              borderBottomColor: Colors.dangerPinkDim,
              ...pillShadow(Colors.dangerPink),
            }}
          >
            <Text style={{ color: Colors.dangerPink, fontWeight: "700", fontSize: 15 }}>
              {signingOut ? "Signing out…" : "Sign Out"}
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
