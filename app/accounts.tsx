import {
  View, Text, ScrollView, TouchableOpacity, Alert,
  StatusBar, RefreshControl, Modal, TextInput, Platform, KeyboardAvoidingView,
} from "react-native";
import { useState, useEffect, useCallback } from "react";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { supabase, supabaseConfigured } from "@/lib/supabase";
import { useAuthStore } from "@/store/authStore";
import { Colors, pillShadow, Fonts, useColors} from "@/constants/theme";
import { formatCurrency } from "@/lib/utils";
import { triggerTransactionSync } from "@/lib/plaid";
import BillPayTracker from "@/components/premium/BillPayTracker";
import Button from "@/components/ui/Button";

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

interface ManualAccount {
  id: string;
  household_id: string;
  name: string;
  institution: string | null;
  type: string;
  subtype: string | null;
  mask: string | null;
  balance: number;
  color: string | null;
  is_active: boolean;
  notes: string | null;
  created_at: string;
}

const ACCOUNT_TYPE_OPTIONS = [
  { value: "checking",   label: "Checking",   icon: "business-outline" },
  { value: "savings",    label: "Savings",     icon: "wallet-outline" },
  { value: "credit",     label: "Credit Card", icon: "card-outline" },
  { value: "loan",       label: "Loan",        icon: "cash-outline" },
  { value: "investment", label: "Investment",  icon: "trending-up-outline" },
];

const ACCOUNT_ICONS: Record<string, string> = {
  depository: "business-outline",
  checking:   "business-outline",
  savings:    "wallet-outline",
  credit:     "card-outline",
  loan:       "cash-outline",
  investment: "trending-up-outline",
};

function AccountCard({ account, item }: { account: PlaidAccount; item: PlaidItem }) {
  const Colors = useColors();
  const accountColors: Record<string, string> = {
    depository: Colors.income,
    checking:   Colors.income,
    savings:    "#06b6d4",
    credit:     "#8b5cf6",
    loan:       Colors.warning,
    investment: "#f59e0b",
  };
  const icon = ACCOUNT_ICONS[account.type] ?? "card-outline";
  const color = accountColors[account.type] ?? Colors.text.muted;
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
  const Colors = useColors();
  const { household, user } = useAuthStore();
  const [items, setItems] = useState<PlaidItem[]>([]);
  const [accounts, setAccounts] = useState<PlaidAccount[]>([]);
  const [manualAccounts, setManualAccounts] = useState<ManualAccount[]>([]);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [activeSection, setActiveSection] = useState<"accounts" | "billpay">("accounts");

  // Add/edit account modal state
  const [showAddAccount, setShowAddAccount] = useState(false);
  const [editingAccount, setEditingAccount] = useState<ManualAccount | null>(null);
  const [accountName, setAccountName] = useState("");
  const [accountInstitution, setAccountInstitution] = useState("");
  const [accountType, setAccountType] = useState("checking");
  const [accountMask, setAccountMask] = useState("");
  const [accountBalance, setAccountBalance] = useState("");
  const [savingAccount, setSavingAccount] = useState(false);

  const fetchAccounts = useCallback(async () => {
    if (!household || !supabaseConfigured) return;
    try {
      const [itemsRes, accountsRes, manualRes] = await Promise.all([
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
        supabase
          .from("manual_accounts")
          .select("*")
          .eq("household_id", household.id)
          .eq("is_active", true)
          .order("created_at", { ascending: false }),
      ]);
      setItems((itemsRes.data ?? []) as PlaidItem[]);
      setAccounts((accountsRes.data ?? []) as PlaidAccount[]);
      setManualAccounts((manualRes.data ?? []) as ManualAccount[]);
    } finally {
      setLoading(false);
    }
  }, [household]);

  const openAddAccount = () => {
    setEditingAccount(null);
    setAccountName(""); setAccountInstitution("");
    setAccountType("checking"); setAccountMask(""); setAccountBalance("");
    setShowAddAccount(true);
  };

  const openEditAccount = (acct: ManualAccount) => {
    setEditingAccount(acct);
    setAccountName(acct.name);
    setAccountInstitution(acct.institution ?? "");
    setAccountType(acct.type);
    setAccountMask(acct.mask ?? "");
    setAccountBalance(String(acct.balance));
    setShowAddAccount(true);
  };

  const handleSaveAccount = async () => {
    const name = accountName.trim();
    if (!name) return Alert.alert("Enter an account name.");
    const balance = parseFloat(accountBalance.replace(/[^0-9.-]/g, ""));
    if (isNaN(balance)) return Alert.alert("Enter a valid balance.");
    if (!household || !user) return;
    setSavingAccount(true);
    try {
      if (editingAccount) {
        const { error } = await supabase
          .from("manual_accounts")
          .update({
            name, institution: accountInstitution.trim() || null,
            type: accountType, mask: accountMask.trim() || null,
            balance, updated_at: new Date().toISOString(),
          })
          .eq("id", editingAccount.id);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from("manual_accounts")
          .insert({
            household_id: household.id,
            created_by: user.id,
            name, institution: accountInstitution.trim() || null,
            type: accountType, mask: accountMask.trim() || null,
            balance,
          });
        if (error) throw error;
      }
      setShowAddAccount(false);
      await fetchAccounts();
    } catch (err: unknown) {
      Alert.alert("Error", (err as Error).message);
    } finally {
      setSavingAccount(false);
    }
  };

  const handleDeleteManualAccount = (id: string) => {
    Alert.alert("Remove Account", "Delete this account?", [
      { text: "Cancel", style: "cancel" },
      { text: "Delete", style: "destructive", onPress: async () => {
        await supabase.from("manual_accounts").delete().eq("id", id);
        setManualAccounts((s) => s.filter((a) => a.id !== id));
        setShowAddAccount(false);
        setEditingAccount(null);
      }},
    ]);
  };

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

  const totalBalance =
    accounts.reduce((sum, a) => sum + (a.type !== "credit" ? (a.current_balance ?? 0) : 0), 0) +
    manualAccounts.reduce((sum, a) => sum + (a.type !== "credit" && a.type !== "loan" ? a.balance : 0), 0);

  const totalCredit =
    accounts.reduce((sum, a) => sum + (a.type === "credit" ? Math.abs(a.current_balance ?? 0) : 0), 0) +
    manualAccounts.reduce((sum, a) => sum + (a.type === "credit" ? Math.abs(a.balance) : 0), 0);

  const allAccountsCount = accounts.length + manualAccounts.length;

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: Colors.bg.app }} edges={["top"]}>
      <StatusBar barStyle={Colors.statusBar} />

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
            {allAccountsCount > 0 && (
              <View style={{
                backgroundColor: Colors.bg.surface, borderRadius: 20, padding: 16,
                borderWidth: 1, borderColor: Colors.border.subtle,
                flexDirection: "row", justifyContent: "space-between",
              }}>
                <View style={{ alignItems: "center", flex: 1 }}>
                  <Text style={{ color: Colors.text.muted, fontSize: 11, marginBottom: 4 }}>Total Assets</Text>
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
                    {allAccountsCount}
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

            {/* Empty state when nothing at all */}
            {accounts.length === 0 && manualAccounts.length === 0 && (
              <View style={{
                backgroundColor: Colors.bg.surface, borderRadius: 20, padding: 32,
                borderWidth: 1, borderColor: Colors.border.subtle,
                alignItems: "center", gap: 12,
              }}>
                <View style={{ width: 64, height: 64, borderRadius: 32, backgroundColor: Colors.bg.overlay, alignItems: "center", justifyContent: "center" }}>
                  <Ionicons name="wallet-outline" size={28} color={Colors.text.muted} />
                </View>
                <Text style={{ color: Colors.text.primary, fontSize: 16, fontFamily: Fonts.bold }}>No accounts yet</Text>
                <Text style={{ color: Colors.text.muted, fontSize: 13, textAlign: "center", lineHeight: 18 }}>
                  Add your bank accounts and cards manually to track balances, or connect via Plaid for automatic sync.
                </Text>
              </View>
            )}

            {/* Plaid-linked accounts */}
            {accounts.length > 0 && (
              <>
                <Text style={{ color: Colors.text.muted, fontSize: 11, fontFamily: Fonts.semiBold, textTransform: "uppercase", letterSpacing: 0.8 }}>
                  Linked via Plaid ({accounts.length})
                </Text>
                {accounts.map((acct) => {
                  const item = items.find((i) => i.id === acct.plaid_item_id) ?? { id: "", institution_name: null, status: "", created_at: "" };
                  return <AccountCard key={acct.id} account={acct} item={item} />;
                })}
              </>
            )}

            {/* Manual accounts */}
            {manualAccounts.length > 0 && (
              <>
                <Text style={{ color: Colors.text.muted, fontSize: 11, fontFamily: Fonts.semiBold, textTransform: "uppercase", letterSpacing: 0.8, marginTop: accounts.length > 0 ? 4 : 0 }}>
                  Manual ({manualAccounts.length})
                </Text>
                {manualAccounts.map((acct) => {
                  const icon = ACCOUNT_ICONS[acct.type] ?? "card-outline";
                  const color = ACCOUNT_COLORS[acct.type] ?? Colors.text.muted;
                  return (
                    <TouchableOpacity
                      key={acct.id}
                      onPress={() => openEditAccount(acct)}
                      activeOpacity={0.75}
                      style={{
                        backgroundColor: Colors.bg.surface, borderRadius: 16, padding: 16,
                        borderWidth: 1, borderColor: Colors.border.subtle,
                        flexDirection: "row", alignItems: "center", gap: 12,
                      }}
                    >
                      <View style={{ width: 44, height: 44, borderRadius: 22, backgroundColor: color + "22", alignItems: "center", justifyContent: "center", borderWidth: 1, borderColor: color + "44" }}>
                        <Ionicons name={icon as any} size={20} color={color} />
                      </View>
                      <View style={{ flex: 1 }}>
                        <Text style={{ color: Colors.text.primary, fontSize: 14, fontFamily: Fonts.bold }} numberOfLines={1}>{acct.name}</Text>
                        <Text style={{ color: Colors.text.muted, fontSize: 12, marginTop: 1 }}>
                          {acct.institution ?? "Manual entry"}{acct.mask ? ` •••• ${acct.mask}` : ""}
                        </Text>
                      </View>
                      <View style={{ alignItems: "flex-end" }}>
                        <Text style={{ color: acct.type === "credit" || acct.type === "loan" ? Colors.danger : Colors.text.primary, fontSize: 15, fontFamily: Fonts.bold }}>
                          {formatCurrency(acct.balance)}
                        </Text>
                        <Text style={{ color: Colors.text.muted, fontSize: 10, marginTop: 1 }}>balance</Text>
                      </View>
                      <Ionicons name="chevron-forward" size={14} color={Colors.text.muted} />
                    </TouchableOpacity>
                  );
                })}
              </>
            )}

            {/* Action buttons */}
            <View style={{ flexDirection: "row", gap: 10 }}>
              <TouchableOpacity
                onPress={openAddAccount}
                style={{
                  flex: 1, backgroundColor: Colors.accent, borderRadius: 14, padding: 14,
                  flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8,
                }}
              >
                <Ionicons name="add-circle-outline" size={18} color="#000" />
                <Text style={{ color: "#000", fontSize: 14, fontFamily: Fonts.bold }}>Add Account</Text>
              </TouchableOpacity>
              {PLAID_CONFIGURED && (
                <TouchableOpacity
                  onPress={() => Alert.alert("Coming Soon", "Plaid Link UI will launch here once the SDK is installed.")}
                  style={{
                    flex: 1, backgroundColor: Colors.bg.surface, borderRadius: 14, padding: 14,
                    flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8,
                    borderWidth: 1, borderColor: Colors.border.subtle,
                  }}
                >
                  <Ionicons name="link-outline" size={18} color={Colors.text.secondary} />
                  <Text style={{ color: Colors.text.secondary, fontSize: 14, fontFamily: Fonts.bold }}>Link Bank</Text>
                </TouchableOpacity>
              )}
            </View>
          </>
        ) : (
          <BillPayTracker />
        )}
      </ScrollView>

      {/* ── ADD / EDIT ACCOUNT MODAL ── */}
      <Modal visible={showAddAccount} transparent animationType="slide" onRequestClose={() => setShowAddAccount(false)}>
        <View style={{ flex: 1, backgroundColor: "rgba(0,0,0,0.6)", justifyContent: "flex-end" }}>
        <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : "height"}>
          <View style={{
            backgroundColor: Colors.bg.raised, borderTopLeftRadius: 28, borderTopRightRadius: 28,
            borderTopWidth: 1, borderColor: Colors.border.subtle,
            padding: 24, paddingBottom: Platform.OS === "ios" ? 44 : 28, gap: 16,
          }}>
            <View style={{ alignItems: "center", marginTop: -8, marginBottom: 4 }}>
              <View style={{ width: 40, height: 4, borderRadius: 2, backgroundColor: Colors.border.subtle }} />
            </View>

            <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
              <Text style={{ color: Colors.text.primary, fontSize: 18, fontFamily: Fonts.bold }}>
                {editingAccount ? "Edit Account" : "Add Account"}
              </Text>
              {editingAccount && (
                <TouchableOpacity onPress={() => handleDeleteManualAccount(editingAccount.id)}>
                  <View style={{ flexDirection: "row", alignItems: "center", gap: 4, backgroundColor: Colors.dangerSoft, borderRadius: 12, paddingHorizontal: 10, paddingVertical: 5, borderWidth: 1, borderColor: Colors.dangerBorder }}>
                    <Ionicons name="trash-outline" size={13} color={Colors.danger} />
                    <Text style={{ color: Colors.danger, fontSize: 12, fontFamily: Fonts.semiBold }}>Delete</Text>
                  </View>
                </TouchableOpacity>
              )}
            </View>

            {/* Account type selector */}
            <View>
              <Text style={{ color: Colors.text.muted, fontSize: 11, fontFamily: Fonts.bold, textTransform: "uppercase", letterSpacing: 0.8, marginBottom: 10 }}>Account Type</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8 }}>
                {ACCOUNT_TYPE_OPTIONS.map((opt) => {
                  const selected = accountType === opt.value;
                  const color = ACCOUNT_COLORS[opt.value] ?? Colors.accent;
                  return (
                    <TouchableOpacity
                      key={opt.value}
                      onPress={() => setAccountType(opt.value)}
                      style={{
                        flexDirection: "row", alignItems: "center", gap: 6,
                        paddingHorizontal: 14, paddingVertical: 9, borderRadius: 20,
                        backgroundColor: selected ? color + "22" : Colors.bg.surface,
                        borderWidth: 1.5, borderColor: selected ? color : Colors.border.subtle,
                      }}
                    >
                      <Ionicons name={opt.icon as any} size={14} color={selected ? color : Colors.text.muted} />
                      <Text style={{ color: selected ? color : Colors.text.muted, fontSize: 13, fontFamily: Fonts.semiBold }}>
                        {opt.label}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </ScrollView>
            </View>

            {/* Account name */}
            <TextInput
              style={{ backgroundColor: Colors.bg.surface, borderRadius: 14, padding: 16, color: Colors.text.primary, borderWidth: 1.5, borderColor: Colors.border.subtle, fontSize: 15, fontFamily: Fonts.regular }}
              placeholder="Account name (e.g. Chase Checking)"
              placeholderTextColor={Colors.text.muted}
              value={accountName}
              onChangeText={setAccountName}
            />

            <View style={{ flexDirection: "row", gap: 10 }}>
              {/* Institution */}
              <TextInput
                style={{ flex: 1, backgroundColor: Colors.bg.surface, borderRadius: 14, padding: 16, color: Colors.text.primary, borderWidth: 1.5, borderColor: Colors.border.subtle, fontSize: 15, fontFamily: Fonts.regular }}
                placeholder="Bank / Institution"
                placeholderTextColor={Colors.text.muted}
                value={accountInstitution}
                onChangeText={setAccountInstitution}
              />
              {/* Last 4 */}
              <TextInput
                style={{ width: 90, backgroundColor: Colors.bg.surface, borderRadius: 14, padding: 16, color: Colors.text.primary, borderWidth: 1.5, borderColor: Colors.border.subtle, fontSize: 15, fontFamily: Fonts.regular, textAlign: "center" }}
                placeholder="••••"
                placeholderTextColor={Colors.text.muted}
                value={accountMask}
                onChangeText={(v) => setAccountMask(v.replace(/[^0-9]/g, "").slice(0, 4))}
                keyboardType="numeric"
                maxLength={4}
              />
            </View>

            {/* Balance */}
            <TextInput
              style={{ backgroundColor: Colors.bg.surface, borderRadius: 14, padding: 16, color: Colors.text.primary, borderWidth: 1.5, borderColor: Colors.accentBorder, fontSize: 28, fontFamily: Fonts.bold, letterSpacing: -0.5, textAlign: "center" }}
              placeholder="$0.00"
              placeholderTextColor={Colors.text.muted}
              value={accountBalance}
              onChangeText={setAccountBalance}
              keyboardType="decimal-pad"
            />

            <View style={{ flexDirection: "row", gap: 10 }}>
              <Button label="Cancel" variant="ghost" onPress={() => setShowAddAccount(false)} style={{ flex: 1 }} />
              <Button
                label={editingAccount ? "Save Changes" : "Add Account"}
                variant="primary"
                loading={savingAccount}
                onPress={handleSaveAccount}
                style={{ flex: 1 }}
              />
            </View>
          </View>
        </KeyboardAvoidingView>
        </View>
      </Modal>
    </SafeAreaView>
  );
}
