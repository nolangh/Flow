import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Alert,
  Share,
  Switch,
  StatusBar,
} from "react-native";
import { useState } from "react";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import * as Clipboard from "expo-clipboard";
import { useAuthStore } from "@/store/authStore";
import { useBudgetStore } from "@/store/budgetStore";
import { Colors, Fonts } from "@/constants/theme";
import Divider from "@/components/ui/Divider";
import { parseBudgetCsv, pickCsvFile } from "@/lib/csvUtils";
import { TIER_LABEL } from "@/constants/features";

type IoniconsName = keyof typeof Ionicons.glyphMap;

interface SettingRowProps {
  label: string;
  value?: string;
  icon?: IoniconsName;
  iconBg?: string;
  iconColor?: string;
  onPress?: () => void;
  rightElement?: React.ReactNode;
  destructive?: boolean;
  showChevron?: boolean;
  badge?: string;
}

function SettingRow({
  label, value, icon, iconBg, iconColor, onPress, rightElement,
  destructive, showChevron = true, badge,
}: SettingRowProps) {
  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={!onPress && !rightElement}
      activeOpacity={0.65}
      style={{ flexDirection: "row", alignItems: "center", paddingVertical: 14, gap: 14 }}
    >
      {icon && (
        <View style={{
          width: 36, height: 36, borderRadius: 10,
          backgroundColor: iconBg ?? Colors.bg.overlay,
          alignItems: "center", justifyContent: "center",
        }}>
          <Ionicons name={icon} size={18} color={iconColor ?? (destructive ? Colors.danger : Colors.text.secondary)} />
        </View>
      )}
      <View style={{ flex: 1 }}>
        <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
          <Text style={{ color: destructive ? Colors.danger : Colors.text.primary, fontSize: 15, fontFamily: Fonts.medium }}>
            {label}
          </Text>
          {badge && (
            <View style={{ backgroundColor: Colors.accent, borderRadius: 6, paddingHorizontal: 6, paddingVertical: 1 }}>
              <Text style={{ color: "#000", fontSize: 9, fontFamily: Fonts.extraBold }}>{badge}</Text>
            </View>
          )}
        </View>
        {value && (
          <Text style={{ color: Colors.text.muted, fontSize: 12, marginTop: 1 }}>{value}</Text>
        )}
      </View>
      {rightElement ?? (onPress && showChevron && (
        <Ionicons name="chevron-forward" size={16} color={Colors.text.muted} />
      ))}
    </TouchableOpacity>
  );
}

function SectionLabel({ children }: { children: string }) {
  return (
    <Text style={{
      color: Colors.text.muted,
      fontSize: 11, fontFamily: Fonts.semiBold,
      textTransform: "uppercase",
      letterSpacing: 0.8,
      marginBottom: 8,
      paddingHorizontal: 20,
    }}>
      {children}
    </Text>
  );
}

function SettingsCard({ children }: { children: React.ReactNode }) {
  return (
    <View style={{
      marginHorizontal: 20,
      marginBottom: 28,
      backgroundColor: Colors.bg.surface,
      borderRadius: 20,
      paddingHorizontal: 16,
      borderWidth: 1,
      borderColor: Colors.border.subtle,
      overflow: "hidden",
    }}>
      {children}
    </View>
  );
}

export default function SettingsScreen() {
  const { user, household, signOut } = useAuthStore();
  const { categories, createCategory, deleteCategory } = useBudgetStore();
  const [notifications, setNotifications] = useState(true);
  const [signingOut, setSigningOut] = useState(false);
  const [importing, setImporting] = useState(false);

  const handleShareInvite = async () => {
    if (!household?.invite_code) return;
    await Share.share({ message: `Join my household on Flow! Invite code: ${household.invite_code}` });
  };

  const handleCopyHouseholdId = async () => {
    if (!household?.id) return;
    await Clipboard.setStringAsync(household.id);
    Alert.alert("Copied", "Household support ID copied to clipboard.");
  };

  const handleSignOut = () => {
    Alert.alert("Sign Out", "Are you sure?", [
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

  const handleImportCsv = async () => {
    setImporting(true);
    try {
      const csvText = await pickCsvFile();
      const rows = parseBudgetCsv(csvText);

      if (rows.length === 0) {
        Alert.alert("Nothing to import", 'CSV must have "name" and "monthly_limit" columns.');
        return;
      }

      Alert.alert(
        `Import ${rows.length} categories?`,
        rows.slice(0, 3).map((r) => `• ${r.name} ($${r.monthly_limit})`).join("\n") +
          (rows.length > 3 ? `\n…and ${rows.length - 3} more` : ""),
        [
          { text: "Cancel", style: "cancel" },
          {
            text: "Import",
            onPress: async () => {
              let success = 0;
              for (const row of rows) {
                try {
                  await createCategory({
                    name: row.name,
                    monthly_limit: row.monthly_limit,
                    is_fixed: row.type === "fixed",
                    is_income: row.type === "income",
                    fixed_day_of_month: row.fixed_day_of_month ?? null,
                    emoji: row.emoji ?? null,
                  });
                  success++;
                } catch {
                  // skip duplicates / invalid
                }
              }
              Alert.alert("Import complete", `${success} of ${rows.length} categories imported.`);
            },
          },
        ]
      );
    } catch (err: unknown) {
      const msg = (err as Error).message;
      if (!msg.includes("No file selected")) Alert.alert("Import failed", msg);
    } finally {
      setImporting(false);
    }
  };

  const handleDeleteCategory = (catId: string, catName: string) => {
    Alert.alert(`Delete "${catName}"?`, "This will also remove it from all transactions.", [
      { text: "Cancel", style: "cancel" },
      { text: "Delete", style: "destructive", onPress: () => deleteCategory(catId) },
    ]);
  };

  const fixedBills = categories.filter((c) => c.is_fixed);
  const firstName = user?.full_name?.split(" ")[0] ?? "?";

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: "#000" }} edges={["top"]}>
      <StatusBar barStyle="light-content" />
      <ScrollView contentContainerStyle={{ paddingBottom: 60 }} showsVerticalScrollIndicator={false}>

        {/* Header */}
        <View style={{ paddingHorizontal: 20, paddingTop: 14, paddingBottom: 24 }}>
          <Text style={{ color: Colors.text.primary, fontSize: 26, fontFamily: Fonts.extraBold, letterSpacing: -0.5 }}>
            Profile
          </Text>
        </View>

        {/* Profile hero card */}
        <View style={{ marginHorizontal: 20, marginBottom: 28 }}>
          <View style={{
            backgroundColor: Colors.bg.surface,
            borderRadius: 20, padding: 20,
            borderWidth: 1, borderColor: Colors.border.subtle,
            alignItems: "center",
          }}>
            <View style={{
              width: 72, height: 72, borderRadius: 36,
              backgroundColor: Colors.accentSoft,
              borderWidth: 2, borderColor: Colors.accentBorder,
              alignItems: "center", justifyContent: "center",
              marginBottom: 12,
            }}>
              <Text style={{ fontSize: 30, fontFamily: Fonts.extraBold, color: Colors.accent }}>
                {firstName.charAt(0).toUpperCase()}
              </Text>
            </View>
            <Text style={{ color: Colors.text.primary, fontSize: 18, fontFamily: Fonts.bold, marginBottom: 2 }}>
              {user?.full_name ?? "—"}
            </Text>
            <Text style={{ color: Colors.text.muted, fontSize: 13 }}>{user?.email}</Text>
          </View>
        </View>

        {/* Premium banner */}
        <View style={{ marginHorizontal: 20, marginBottom: 28 }}>
          <TouchableOpacity
            onPress={() => router.push("/upgrade" as any)}
            style={{
              backgroundColor: Colors.accentSoft,
              borderRadius: 20, padding: 18,
              borderWidth: 1, borderColor: Colors.accentBorder,
              flexDirection: "row", alignItems: "center", gap: 14,
            }}
          >
            <View style={{
              width: 44, height: 44, borderRadius: 22,
              backgroundColor: Colors.accent,
              alignItems: "center", justifyContent: "center",
            }}>
              <Ionicons name={household?.is_premium ? "checkmark-circle" : "sparkles"} size={22} color="#000" />
            </View>
            <View style={{ flex: 1 }}>
              {household?.is_premium && household.premium_tier ? (
                <>
                  <Text style={{ color: Colors.accent, fontSize: 15, fontFamily: Fonts.extraBold }}>
                    {TIER_LABEL[household.premium_tier]}
                  </Text>
                  <Text style={{ color: Colors.accent, fontSize: 12, opacity: 0.75, marginTop: 2 }}>
                    All features unlocked · {(household.members?.length ?? 1)} of 6 members
                  </Text>
                </>
              ) : (
                <>
                  <Text style={{ color: Colors.accent, fontSize: 15, fontFamily: Fonts.extraBold }}>Upgrade to Premium</Text>
                  <Text style={{ color: Colors.accent, fontSize: 12, opacity: 0.75, marginTop: 2 }}>
                    AI analysis · Bank sync · Goals · Charts
                  </Text>
                </>
              )}
            </View>
            <Ionicons name="chevron-forward" size={18} color={Colors.accent} />
          </TouchableOpacity>
        </View>

        {/* Household */}
        <SectionLabel>Household</SectionLabel>
        <SettingsCard>
          <SettingRow
            icon="home-outline"
            label={household?.name ?? "No household"}
            value="Your shared space"
          />
          <Divider />
          <SettingRow
            icon="key-outline"
            label="Invite Code"
            value={household?.invite_code ?? "—"}
            onPress={handleShareInvite}
            showChevron={false}
            rightElement={
              <TouchableOpacity
                onPress={handleShareInvite}
                style={{
                  backgroundColor: Colors.accentSoft,
                  borderRadius: 20, paddingHorizontal: 14, paddingVertical: 6,
                  borderWidth: 1, borderColor: Colors.accentBorder,
                }}
              >
                <Text style={{ color: Colors.accent, fontSize: 12, fontFamily: Fonts.bold }}>Share</Text>
              </TouchableOpacity>
            }
          />
          <Divider />
          <SettingRow
            icon="people-outline"
            label="Members"
            value={`${(household?.members?.length ?? 1)} of 6 members`}
          />
          <Divider />
          <SettingRow
            icon="help-circle-outline"
            label="Support ID"
            value={household?.id ? `${household.id.slice(0, 8)}…` : "—"}
            showChevron={false}
            onPress={handleCopyHouseholdId}
            rightElement={
              <TouchableOpacity
                onPress={handleCopyHouseholdId}
                style={{
                  backgroundColor: Colors.bg.overlay,
                  borderRadius: 20, paddingHorizontal: 12, paddingVertical: 6,
                  borderWidth: 1, borderColor: Colors.border.subtle,
                }}
              >
                <Text style={{ color: Colors.text.muted, fontSize: 12, fontFamily: Fonts.bold }}>Copy</Text>
              </TouchableOpacity>
            }
          />
        </SettingsCard>

        {/* Bank accounts & bill pay */}
        <SectionLabel>Banking</SectionLabel>
        <SettingsCard>
          <SettingRow
            icon="link-outline"
            iconBg={Colors.accentSoft}
            iconColor={Colors.accent}
            label="Accounts & Bill Pay"
            value="Linked banks, cards, and bill payment tracking"
            onPress={() => router.push("/accounts" as any)}
            badge="NEW"
          />
          <Divider />
          <SettingRow
            icon="sync-outline"
            label="Auto Sync Transactions"
            value="Requires Plaid credentials"
            showChevron={false}
            rightElement={
              <Switch
                value={false}
                disabled
                trackColor={{ false: Colors.bg.overlay, true: Colors.accentDim }}
                thumbColor={Colors.text.muted}
              />
            }
          />
        </SettingsCard>

        {/* Data */}
        <SectionLabel>Data</SectionLabel>
        <SettingsCard>
          <SettingRow
            icon="document-outline"
            iconBg={Colors.accentSoft}
            iconColor={Colors.accent}
            label="Import Budget CSV"
            value={importing ? "Picking file…" : "Import categories from a CSV file"}
            onPress={importing ? undefined : handleImportCsv}
          />
          <Divider />
          <SettingRow
            icon="download-outline"
            label="Export Budget"
            value="Go to Budget → download icon"
            showChevron={false}
          />
        </SettingsCard>

        {/* Fixed Bills */}
        {fixedBills.length > 0 && (
          <>
            <SectionLabel>Recurring Bills</SectionLabel>
            <SettingsCard>
              {fixedBills.map((bill, idx) => (
                <View key={bill.id}>
                  <SettingRow
                    icon="repeat-outline"
                    label={bill.name}
                    value={`${formatCurrencySimple(bill.monthly_limit)} · Day ${bill.fixed_day_of_month ?? "—"}`}
                    onPress={() => handleDeleteCategory(bill.id, bill.name)}
                  />
                  {idx < fixedBills.length - 1 && <Divider />}
                </View>
              ))}
            </SettingsCard>
          </>
        )}

        {/* Preferences */}
        <SectionLabel>Preferences</SectionLabel>
        <SettingsCard>
          <SettingRow
            icon="notifications-outline"
            label="Budget Alerts"
            value="Notify when near spending limit"
            showChevron={false}
            rightElement={
              <Switch
                value={notifications}
                onValueChange={setNotifications}
                trackColor={{ false: Colors.bg.overlay, true: Colors.accentDim }}
                thumbColor={notifications ? Colors.accent : Colors.text.muted}
              />
            }
          />
        </SettingsCard>

        {/* About */}
        <SectionLabel>About</SectionLabel>
        <SettingsCard>
          <SettingRow icon="document-text-outline" label="Terms of Service" onPress={() => {}} />
          <Divider />
          <SettingRow icon="lock-closed-outline" label="Privacy Policy" onPress={() => {}} />
          <Divider />
          <SettingRow icon="information-circle-outline" label="Version" value="1.0.0" showChevron={false} />
        </SettingsCard>

        {/* Sign out */}
        <View style={{ paddingHorizontal: 20 }}>
          <TouchableOpacity
            onPress={handleSignOut}
            disabled={signingOut}
            style={{
              backgroundColor: Colors.dangerSoft,
              borderRadius: 9999,
              paddingVertical: 16,
              alignItems: "center",
              borderWidth: 1,
              borderColor: Colors.dangerBorder,
            }}
          >
            <Text style={{ color: Colors.danger, fontFamily: Fonts.bold, fontSize: 15 }}>
              {signingOut ? "Signing out…" : "Sign Out"}
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

function formatCurrencySimple(amount: number): string {
  return "$" + amount.toFixed(2);
}
