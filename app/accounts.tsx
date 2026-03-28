import {
  View, Text, ScrollView, TouchableOpacity, Alert,
  StatusBar, RefreshControl,
} from "react-native";
import { useState, useEffect, useCallback } from "react";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { supabase, supabaseConfigured } from "@/lib/supabase";
import { useAuthStore } from "@/store/authStore";
import { Colors, pillShadow, Fonts } from "@/constants/theme";
import { formatCurrency } from "@/lib/utils";
import { triggerTransactionSync } from "@/lib/plaid";
import BillPayTracker from "@/components/premium/BillPayTracker";

const PLAID_CONFIGURED =
  !!(process.env.EXPO_PUBLIC_PLAID_CLIENT_ID && process.env.EXPO_PUBLIC_PLAID_ENV);

interface PlaidItem {
  id: string;
  institution_name: string | null;
  status: string;
  created_at: string;
}

interface PlaidAccount {
  id: string;
  name: string;
  official_name: string | null;
  type: string;
  subtype: string | null;
  mask: string | null;
  current_balance: number | null;
  available_balance: number | null;
  is_active: boolean;
  plaid_item_id: string;
}

const ACCOUNT_ICONS: Record<string, string> = {
  depository: "business-outline",
  credit: "card-outline",
  loan: "cash-outline",
  investment: "trending-up-outline",
};

const ACCOUNT_COLORS: Record<string, string> = {
  depository: Colors.accent,
  credit: "#8b5cf6",
  loan: Colors.warning,
  investment: "#06b6d4",
};

function AccountCard({ account, item }: { account: PlaidAccount; item: PlaidItem }) {
  const icon = ACCOUNT_ICONS[account.type] ?? "card-outline";
  const color = ACCOUNT_COLORS[account.type] ?? Colors.text.muted;
  const balance = account.available_balance ?? account.current_balance;

  return (
    <View style={{
      backgroundColor: Colors.bg.surface, borderRadius: 16, padding: 16,
      borderWidth: 1, borderColor: Colors.border.subtle,
      flexDirection: "row", alignItems: "center", gap: 12,
    }}>
      <View style={{
        width: 44, height: 44, borderRadius: 22,
        backgroundColor: color + "22",
        alignItems: "center", justifyContent: "center",
        borderWidth: 1, borderColor: color + "44",
      }}>
        <Ionicons name={icon as any} size={20} color={color} />
      </View>
      <View style={{ flex: 1 }}>
        <Text style={{ color: Colors.text.primary, fontSize: 14, fontFamily: Fonts.bold }} numberOfLines={1}>
          {account.name}
        </Text>
        <Text style={{ color: Colors.text.muted, fontSize: 12, marginTop: 1 }}>
          {item.institution_name ?? "Unknown bank"}
          {account.mask ? ` •••• ${account.mask}` : ""}
          {account.subtype ? ` · ${account.subtype}` : ""}
        </Text>
      </View>
      <View style={{ alignItems: "flex-end" }}>
        {balance !== null ? (
          <>
            <Text style={{ color: Colors.text.primary, fontSize: 15, fontFamily: Fonts.bold }}>
              {formatCurrency(balance)}
            </Text>
            <Text style={{ color: Colors.text.muted, fontSize: 10, marginTop: 1 }}>
              {account.available_balance !== null ? "available" : "current"}
            </Text>
          </>
        ) : (
          <Text style={{ color: Colors.text.muted, fontSize: 12 }}>—</Text>
        )}
      </View>
    </View>
  );
}

export default function AccountsScreen() {
  const { household } = useAuthStore();
  const [items, setItems] = useState<PlaidItem[]>([]);
  const [accounts, setAccounts] = useState<PlaidAccount[]>([]);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [activeSection, setActiveSection] = useState<"accounts" | "billpay">("accounts");

  const fetchAccounts = useCallback(async () => {
    if (!household || !supabaseConfigured) return;
    try {
      const [itemsRes, accountsRes] = await Promise.all([
        supabase
          .from("plaid_items")
          .select("id, institution_name, status, created_at")
          .eq("household_id", household.id)
          .eq("status", "active"),
        supabase
          .from("plaid_accounts")
          .select("*")
          .eq("household_id", household.id)
          .eq("is_active", true)
          .order("type"),
      ]);
      setItems((itemsRes.data ?? []) as PlaidItem[]);
      setAccounts((accountsRes.data ?? []) as PlaidAccount[]);
    } finally {
      setLoading(false);
    }
  }, [household]);

  useEffect(() => { fetchAccounts(); }, [fetchAccounts]);

  const onRefresh = async () => { setRefreshing(true); await fetchAccounts(); setRefreshing(false); };

  const handleSync = async () => {
    if (!household) return;
    if (!PLAID_CONFIGURED) {
      Alert.alert(
        "Plaid Not Configured",
        "To enable automatic bank sync:\n\n1. Get Plaid credentials at dashboard.plaid.com\n2. Add EXPO_PUBLIC_PLAID_CLIENT_ID and EXPO_PUBLIC_PLAID_ENV to Replit Secrets\n3. Deploy the Supabase Edge Functions (plaid-link-token, plaid-exchange-token, trigger-plaid-sync)\n\nOnce configured, tap here to sync your transactions automatically."
      );
      return;
    }
    setSyncing(true);
    try {
      await triggerTransactionSync(household.id);
      Alert.alert("Sync started", "Your transactions will update in a moment.");
      await fetchAccounts();
    } catch (err: unknown) {
      Alert.alert("Sync failed", (err as Error).message);
    } finally {
      setSyncing(false);
    }
  };

  const handleConnectBank = () => {
    if (!PLAID_CONFIGURED) {
      Alert.alert(
        "Plaid Not Configured",
        "To link your bank account:\n\n1. Sign up at dashboard.plaid.com\n2. Create an app and get your Client ID + Secret\n3. Add these to Replit Secrets:\n   • EXPO_PUBLIC_PLAID_CLIENT_ID\n   • EXPO_PUBLIC_PLAID_ENV (sandbox/development/production)\n4. Deploy the edge functions\n\nPlaid supports 12,000+ financial institutions."
      );
      return;
    }
    // TODO: launch PlaidLink once SDK is installed
    // The lib/plaid.ts createLinkToken() + exchange flow is already wired up
    Alert.alert("Coming Soon", "Plaid Link UI will launch here once the SDK is installed.");
  };

  const totalBalance = accounts.reduce(
    (sum, a) => sum + (a.type !== "credit" ? (a.current_balance ?? 0) : 0),
    0
  );
  const totalCredit = accounts.reduce(
    (sum, a) => sum + (a.type === "credit" ? Math.abs(a.current_balance ?? 0) : 0),
    0
  );

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: "#000" }} edges={["top"]}>
      <StatusBar barStyle="light-content" />

      {/* Header */}
      <View style={{ flexDirection: "row", alignItems: "center", paddingHorizontal: 20, paddingTop: 6, paddingBottom: 16, gap: 12 }}>
        <TouchableOpacity onPress={() => router.back()} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
          <Ionicons name="chevron-back" size={24} color={Colors.text.primary} />
        </TouchableOpacity>
        <Text style={{ color: Colors.text.primary, fontSize: 22, fontFamily: Fonts.extraBold, flex: 1 }}>
          Accounts & Bill Pay
        </Text>
        <TouchableOpacity
          onPress={handleSync}
          disabled={syncing}
          style={{
            flexDirection: "row", alignItems: "center", gap: 4,
            backgroundColor: Colors.bg.surface, borderRadius: 16,
            paddingHorizontal: 12, paddingVertical: 7,
            borderWidth: 1, borderColor: Colors.border.subtle,
          }}
        >
          <Ionicons name="sync-outline" size={14} color={syncing ? Colors.text.muted : Colors.accent} />
          <Text style={{ color: syncing ? Colors.text.muted : Colors.accent, fontSize: 12, fontFamily: Fonts.semiBold }}>
            {syncing ? "Syncing…" : "Sync"}
          </Text>
        </TouchableOpacity>
      </View>

      {/* Section toggle */}
      <View style={{ flexDirection: "row", paddingHorizontal: 20, marginBottom: 16, gap: 8 }}>
        {[
          { id: "accounts", label: "Linked Accounts" },
          { id: "billpay", label: "Bill Pay" },
        ].map((s) => (
          <TouchableOpacity
            key={s.id}
            onPress={() => setActiveSection(s.id as typeof activeSection)}
            style={{
              paddingHorizontal: 16, paddingVertical: 9, borderRadius: 9999,
              backgroundColor: activeSection === s.id ? Colors.accent : Colors.bg.surface,
              borderWidth: 1, borderColor: activeSection === s.id ? "transparent" : Colors.border.subtle,
            }}
          >
            <Text style={{ color: activeSection === s.id ? "#000" : Colors.text.secondary, fontFamily: Fonts.bold, fontSize: 13 }}>
              {s.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <ScrollView
        contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 60, gap: 14 }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Colors.accent} />}
        showsVerticalScrollIndicator={false}
      >
        {activeSection === "accounts" ? (
          <>
            {/* Balance summary */}
            {accounts.length > 0 && (
              <View style={{
                backgroundColor: Colors.bg.surface, borderRadius: 20, padding: 16,
                borderWidth: 1, borderColor: Colors.border.subtle,
                flexDirection: "row", justifyContent: "space-between",
              }}>
                <View style={{ alignItems: "center", flex: 1 }}>
                  <Text style={{ color: Colors.text.muted, fontSize: 11, marginBottom: 4 }}>Total Deposits</Text>
                  <Text style={{ color: Colors.accent, fontSize: 18, fontFamily: Fonts.extraBold }}>
                    {formatCurrency(totalBalance)}
                  </Text>
                </View>
                <View style={{ width: 1, backgroundColor: Colors.border.subtle }} />
                <View style={{ alignItems: "center", flex: 1 }}>
                  <Text style={{ color: Colors.text.muted, fontSize: 11, marginBottom: 4 }}>Credit Used</Text>
                  <Text style={{ color: "#8b5cf6", fontSize: 18, fontFamily: Fonts.extraBold }}>
                    {formatCurrency(totalCredit)}
                  </Text>
                </View>
                <View style={{ width: 1, backgroundColor: Colors.border.subtle }} />
                <View style={{ alignItems: "center", flex: 1 }}>
                  <Text style={{ color: Colors.text.muted, fontSize: 11, marginBottom: 4 }}>Accounts</Text>
                  <Text style={{ color: Colors.text.primary, fontSize: 18, fontFamily: Fonts.extraBold }}>
                    {accounts.length}
                  </Text>
                </View>
              </View>
            )}

            {/* Plaid config notice */}
            {!PLAID_CONFIGURED && (
              <TouchableOpacity
                onPress={handleConnectBank}
                style={{
                  backgroundColor: "#1a1400", borderRadius: 16, padding: 14,
                  borderWidth: 1, borderColor: "#3a2f00",
                  flexDirection: "row", alignItems: "center", gap: 10,
                }}
              >
                <Ionicons name="information-circle-outline" size={20} color="#facc15" />
                <View style={{ flex: 1 }}>
                  <Text style={{ color: "#facc15", fontSize: 13, fontFamily: Fonts.bold }}>Plaid not configured</Text>
                  <Text style={{ color: "#facc15", fontSize: 11, opacity: 0.8, marginTop: 2 }}>
                    Tap to see setup instructions. Connect up to 12,000+ banks.
                  </Text>
                </View>
                <Ionicons name="chevron-forward" size={14} color="#facc15" />
              </TouchableOpacity>
            )}

            {/* Connected accounts */}
            {accounts.length > 0 ? (
              <>
                <Text style={{ color: Colors.text.muted, fontSize: 11, fontFamily: Fonts.semiBold, textTransform: "uppercase", letterSpacing: 0.8 }}>
                  Connected ({accounts.length})
                </Text>
                {accounts.map((acct) => {
                  const item = items.find((i) => i.id === acct.plaid_item_id) ?? {
                    id: "", institution_name: null, status: "", created_at: "",
                  };
                  return <AccountCard key={acct.id} account={acct} item={item} />;
                })}
              </>
            ) : (
              <View style={{
                backgroundColor: Colors.bg.surface, borderRadius: 20, padding: 32,
                borderWidth: 1, borderColor: Colors.border.subtle,
                alignItems: "center", gap: 12,
              }}>
                <View style={{
                  width: 64, height: 64, borderRadius: 32,
                  backgroundColor: Colors.bg.overlay,
                  alignItems: "center", justifyContent: "center",
                }}>
                  <Ionicons name="link-outline" size={28} color={Colors.text.muted} />
                </View>
                <Text style={{ color: Colors.text.primary, fontSize: 16, fontFamily: Fonts.bold }}>No accounts linked</Text>
                <Text style={{ color: Colors.text.muted, fontSize: 13, textAlign: "center", lineHeight: 18 }}>
                  Connect your bank via Plaid to automatically track transactions from all your accounts and cards.
                </Text>
              </View>
            )}

            {/* Connect button */}
            <TouchableOpacity
              onPress={handleConnectBank}
              style={{
                backgroundColor: Colors.bg.surface, borderRadius: 16, padding: 16,
                borderWidth: 1.5, borderColor: Colors.border.subtle, borderStyle: "dashed",
                flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8,
              }}
            >
              <View style={{
                width: 28, height: 28, borderRadius: 14,
                backgroundColor: Colors.accentSoft, alignItems: "center", justifyContent: "center",
              }}>
                <Ionicons name="add" size={16} color={Colors.accent} />
              </View>
              <Text style={{ color: Colors.accent, fontSize: 14, fontFamily: Fonts.bold }}>
                Connect Bank Account
              </Text>
            </TouchableOpacity>

            {/* Plaid setup guide */}
            {!PLAID_CONFIGURED && (
              <View style={{
                backgroundColor: Colors.bg.surface, borderRadius: 16, padding: 16,
                borderWidth: 1, borderColor: Colors.border.subtle, gap: 10,
              }}>
                <Text style={{ color: Colors.text.primary, fontSize: 14, fontFamily: Fonts.bold }}>
                  How to enable Plaid
                </Text>
                {[
                  { num: "1", text: "Sign up at dashboard.plaid.com" },
                  { num: "2", text: "Create an application and copy your Client ID" },
                  { num: "3", text: "Add EXPO_PUBLIC_PLAID_CLIENT_ID to Replit Secrets" },
                  { num: "4", text: "Add EXPO_PUBLIC_PLAID_ENV (use 'sandbox' to test)" },
                  { num: "5", text: "Deploy the 3 Supabase Edge Functions from supabase/functions/" },
                  { num: "6", text: "Add SUPABASE_SERVICE_ROLE_KEY to your Edge Function secrets" },
                ].map((step) => (
                  <View key={step.num} style={{ flexDirection: "row", gap: 10, alignItems: "flex-start" }}>
                    <View style={{
                      width: 22, height: 22, borderRadius: 11,
                      backgroundColor: Colors.accentSoft, alignItems: "center", justifyContent: "center",
                    }}>
                      <Text style={{ color: Colors.accent, fontSize: 11, fontFamily: Fonts.bold }}>{step.num}</Text>
                    </View>
                    <Text style={{ color: Colors.text.secondary, fontSize: 13, flex: 1, lineHeight: 18 }}>{step.text}</Text>
                  </View>
                ))}
              </View>
            )}
          </>
        ) : (
          <BillPayTracker />
        )}
      </ScrollView>
    </SafeAreaView>
  );
}
