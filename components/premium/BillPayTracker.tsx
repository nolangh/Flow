import {
  View, Text, TouchableOpacity, Modal, TextInput, Alert, Platform, ScrollView,
} from "react-native";
import { useState } from "react";
import { Ionicons } from "@expo/vector-icons";
import { Colors } from "@/constants/theme";
import { useBudgetStore } from "@/store/budgetStore";
import { formatCurrency } from "@/lib/utils";
import Button from "@/components/ui/Button";

interface LinkedAccount {
  id: string;
  name: string;
  last4?: string;
  type: "checking" | "savings" | "credit";
  institution?: string;
}

interface BillLink {
  categoryId: string;
  accountId: string;
  reminderDaysBefore: number;
  autoPayEnabled: boolean;
  confirmationNote?: string;
}

// In a real app these would live in Supabase.
// For now they're local state — wire to DB when Plaid is live.
export default function BillPayTracker() {
  const { categories } = useBudgetStore();
  const fixedBills = categories.filter((c) => c.is_fixed && !c.is_income);

  const [accounts, setAccounts] = useState<LinkedAccount[]>([]);
  const [links, setLinks] = useState<BillLink[]>([]);
  const [showAddAccount, setShowAddAccount] = useState(false);
  const [selectedBill, setSelectedBill] = useState<string | null>(null);
  const [acctName, setAcctName] = useState("");
  const [acctLast4, setAcctLast4] = useState("");
  const [acctType, setAcctType] = useState<LinkedAccount["type"]>("checking");
  const [acctInstitution, setAcctInstitution] = useState("");
  const [reminderDays, setReminderDays] = useState("3");

  const getLinkForBill = (catId: string) => links.find((l) => l.categoryId === catId);
  const getAccountById = (id: string) => accounts.find((a) => a.id === id);

  const handleAddAccount = () => {
    if (!acctName.trim()) return Alert.alert("Enter an account name.");
    const newAccount: LinkedAccount = {
      id: Date.now().toString(),
      name: acctName.trim(),
      last4: acctLast4.trim() || undefined,
      type: acctType,
      institution: acctInstitution.trim() || undefined,
    };
    setAccounts((prev) => [...prev, newAccount]);
    setAcctName(""); setAcctLast4(""); setAcctInstitution(""); setAcctType("checking");
    setShowAddAccount(false);
  };

  const handleLinkAccount = (catId: string, accountId: string) => {
    setLinks((prev) => {
      const existing = prev.findIndex((l) => l.categoryId === catId);
      const newLink: BillLink = {
        categoryId: catId,
        accountId,
        reminderDaysBefore: parseInt(reminderDays) || 3,
        autoPayEnabled: false,
      };
      if (existing >= 0) {
        return prev.map((l, i) => (i === existing ? newLink : l));
      }
      return [...prev, newLink];
    });
    setSelectedBill(null);
  };

  const handleUnlink = (catId: string) => {
    setLinks((prev) => prev.filter((l) => l.categoryId !== catId));
  };

  const ACCOUNT_ICONS: Record<LinkedAccount["type"], string> = {
    checking: "business-outline",
    savings: "wallet-outline",
    credit: "card-outline",
  };

  if (fixedBills.length === 0) {
    return (
      <View style={{ alignItems: "center", paddingVertical: 24, gap: 6 }}>
        <Ionicons name="card-outline" size={32} color={Colors.text.muted} />
        <Text style={{ color: Colors.text.muted, fontSize: 14 }}>No fixed bills yet.</Text>
        <Text style={{ color: Colors.text.muted, fontSize: 12 }}>Add fixed bills in the Budget tab.</Text>
      </View>
    );
  }

  return (
    <View style={{ gap: 12 }}>
      {/* Linked accounts section */}
      <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
        <Text style={{ color: Colors.text.muted, fontSize: 11, fontWeight: "600", textTransform: "uppercase", letterSpacing: 0.8 }}>
          Linked Accounts ({accounts.length})
        </Text>
        <TouchableOpacity
          onPress={() => setShowAddAccount(true)}
          style={{
            flexDirection: "row", alignItems: "center", gap: 4,
            backgroundColor: Colors.bg.surface, borderRadius: 16,
            paddingHorizontal: 12, paddingVertical: 6,
            borderWidth: 1, borderColor: Colors.border.subtle,
          }}
        >
          <Ionicons name="add" size={14} color={Colors.accent} />
          <Text style={{ color: Colors.accent, fontSize: 12, fontWeight: "600" }}>Add Account</Text>
        </TouchableOpacity>
      </View>

      {accounts.length > 0 && (
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          <View style={{ flexDirection: "row", gap: 8 }}>
            {accounts.map((acct) => (
              <View
                key={acct.id}
                style={{
                  backgroundColor: Colors.bg.surface, borderRadius: 14, padding: 12,
                  borderWidth: 1, borderColor: Colors.border.subtle, minWidth: 130, gap: 6,
                }}
              >
                <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
                  <Ionicons name={ACCOUNT_ICONS[acct.type] as any} size={14} color={Colors.accent} />
                  <Text style={{ color: Colors.text.secondary, fontSize: 11, fontWeight: "600", textTransform: "capitalize" }}>
                    {acct.type}
                  </Text>
                </View>
                <Text style={{ color: Colors.text.primary, fontSize: 13, fontWeight: "700" }} numberOfLines={1}>
                  {acct.name}
                </Text>
                {acct.last4 && (
                  <Text style={{ color: Colors.text.muted, fontSize: 11 }}>•••• {acct.last4}</Text>
                )}
                {acct.institution && (
                  <Text style={{ color: Colors.text.muted, fontSize: 10 }} numberOfLines={1}>{acct.institution}</Text>
                )}
              </View>
            ))}
          </View>
        </ScrollView>
      )}

      {accounts.length === 0 && (
        <View style={{
          backgroundColor: Colors.bg.surface, borderRadius: 14, padding: 16,
          borderWidth: 1, borderColor: Colors.border.subtle, borderStyle: "dashed",
          alignItems: "center", gap: 6,
        }}>
          <Ionicons name="card-outline" size={24} color={Colors.text.muted} />
          <Text style={{ color: Colors.text.muted, fontSize: 13 }}>No accounts added yet</Text>
          <Text style={{ color: Colors.text.muted, fontSize: 11, textAlign: "center" }}>
            Add accounts manually, or link via Plaid when your key is ready.
          </Text>
        </View>
      )}

      {/* Bills list */}
      <Text style={{ color: Colors.text.muted, fontSize: 11, fontWeight: "600", textTransform: "uppercase", letterSpacing: 0.8, marginTop: 4 }}>
        Fixed Bills
      </Text>

      {fixedBills.map((bill) => {
        const link = getLinkForBill(bill.id);
        const linkedAcct = link ? getAccountById(link.accountId) : null;

        return (
          <View
            key={bill.id}
            style={{
              backgroundColor: Colors.bg.surface, borderRadius: 16, padding: 14,
              borderWidth: 1, borderColor: Colors.border.subtle, gap: 10,
            }}
          >
            <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
              <View style={{ flex: 1 }}>
                <Text style={{ color: Colors.text.primary, fontSize: 14, fontWeight: "700" }}>{bill.name}</Text>
                <Text style={{ color: Colors.text.muted, fontSize: 12 }}>
                  {bill.fixed_day_of_month ? `Due the ${bill.fixed_day_of_month}th` : "No due date set"}
                  {" · "}{formatCurrency(bill.monthly_limit)}
                </Text>
              </View>
              {link && (
                <TouchableOpacity onPress={() => handleUnlink(bill.id)}>
                  <Ionicons name="close-circle" size={18} color={Colors.text.muted} />
                </TouchableOpacity>
              )}
            </View>

            {linkedAcct ? (
              <View style={{
                backgroundColor: Colors.accentSoft, borderRadius: 10, padding: 10,
                borderWidth: 1, borderColor: Colors.accentBorder,
                flexDirection: "row", alignItems: "center", gap: 8,
              }}>
                <Ionicons name="link" size={13} color={Colors.accent} />
                <View style={{ flex: 1 }}>
                  <Text style={{ color: Colors.accent, fontSize: 12, fontWeight: "700" }}>{linkedAcct.name}</Text>
                  {linkedAcct.last4 && (
                    <Text style={{ color: Colors.accent, fontSize: 11 }}>•••• {linkedAcct.last4}</Text>
                  )}
                </View>
                <View style={{ alignItems: "flex-end" }}>
                  <Text style={{ color: Colors.text.muted, fontSize: 10 }}>Reminder</Text>
                  <Text style={{ color: Colors.accent, fontSize: 12, fontWeight: "600" }}>
                    {link?.reminderDaysBefore}d before
                  </Text>
                </View>
              </View>
            ) : (
              <TouchableOpacity
                onPress={() => {
                  if (accounts.length === 0) {
                    Alert.alert("Add an account first", "Tap '+ Add Account' above to add a bank account or card.");
                    return;
                  }
                  setSelectedBill(bill.id);
                }}
                style={{
                  backgroundColor: Colors.bg.overlay, borderRadius: 10, padding: 10,
                  borderWidth: 1, borderColor: Colors.border.subtle, borderStyle: "dashed",
                  flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 6,
                }}
              >
                <Ionicons name="link-outline" size={14} color={Colors.text.muted} />
                <Text style={{ color: Colors.text.muted, fontSize: 13 }}>Link a payment account</Text>
              </TouchableOpacity>
            )}
          </View>
        );
      })}

      {/* Add account modal */}
      <Modal visible={showAddAccount} transparent animationType="slide" onRequestClose={() => setShowAddAccount(false)}>
        <View style={{ flex: 1, justifyContent: "flex-end", backgroundColor: "rgba(0,0,0,0.6)" }}>
          <View style={{
            backgroundColor: Colors.bg.raised, borderTopLeftRadius: 28, borderTopRightRadius: 28,
            borderTopWidth: 1, borderColor: Colors.border.subtle,
            padding: 24, paddingBottom: Platform.OS === "ios" ? 44 : 28, gap: 14,
          }}>
            <View style={{ alignItems: "center", marginTop: -8, marginBottom: 4 }}>
              <View style={{ width: 40, height: 4, borderRadius: 2, backgroundColor: Colors.border.subtle }} />
            </View>
            <Text style={{ color: Colors.text.primary, fontSize: 18, fontWeight: "700" }}>Add Account</Text>

            <TextInput
              style={{ backgroundColor: Colors.bg.surface, borderRadius: 12, padding: 14, color: Colors.text.primary, borderWidth: 1.5, borderColor: Colors.border.subtle, fontSize: 15 }}
              placeholder="Account name (e.g. Chase Checking)"
              placeholderTextColor={Colors.text.muted}
              value={acctName}
              onChangeText={setAcctName}
            />

            <View style={{ flexDirection: "row", gap: 10 }}>
              {(["checking", "savings", "credit"] as LinkedAccount["type"][]).map((t) => (
                <TouchableOpacity
                  key={t}
                  onPress={() => setAcctType(t)}
                  style={{
                    flex: 1, padding: 10, borderRadius: 10, alignItems: "center",
                    backgroundColor: acctType === t ? Colors.accentSoft : Colors.bg.surface,
                    borderWidth: 1.5, borderColor: acctType === t ? Colors.accentBorder : Colors.border.subtle,
                  }}
                >
                  <Text style={{ color: acctType === t ? Colors.accent : Colors.text.muted, fontSize: 12, fontWeight: "600", textTransform: "capitalize" }}>
                    {t}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <View style={{ flexDirection: "row", gap: 10 }}>
              <TextInput
                style={{ flex: 1, backgroundColor: Colors.bg.surface, borderRadius: 12, padding: 14, color: Colors.text.primary, borderWidth: 1.5, borderColor: Colors.border.subtle, fontSize: 15 }}
                placeholder="Last 4 digits (optional)"
                placeholderTextColor={Colors.text.muted}
                value={acctLast4}
                onChangeText={setAcctLast4}
                keyboardType="number-pad"
                maxLength={4}
              />
              <TextInput
                style={{ flex: 2, backgroundColor: Colors.bg.surface, borderRadius: 12, padding: 14, color: Colors.text.primary, borderWidth: 1.5, borderColor: Colors.border.subtle, fontSize: 15 }}
                placeholder="Bank name (optional)"
                placeholderTextColor={Colors.text.muted}
                value={acctInstitution}
                onChangeText={setAcctInstitution}
              />
            </View>

            <View style={{ flexDirection: "row", gap: 10 }}>
              <Button label="Cancel" variant="ghost" onPress={() => setShowAddAccount(false)} style={{ flex: 1 }} />
              <Button label="Add Account" variant="primary" onPress={handleAddAccount} style={{ flex: 1 }} />
            </View>
          </View>
        </View>
      </Modal>

      {/* Link account to bill modal */}
      <Modal visible={selectedBill !== null} transparent animationType="slide" onRequestClose={() => setSelectedBill(null)}>
        <View style={{ flex: 1, justifyContent: "flex-end", backgroundColor: "rgba(0,0,0,0.6)" }}>
          <View style={{
            backgroundColor: Colors.bg.raised, borderTopLeftRadius: 28, borderTopRightRadius: 28,
            borderTopWidth: 1, borderColor: Colors.border.subtle,
            padding: 24, paddingBottom: Platform.OS === "ios" ? 44 : 28, gap: 14,
          }}>
            <View style={{ alignItems: "center", marginTop: -8, marginBottom: 4 }}>
              <View style={{ width: 40, height: 4, borderRadius: 2, backgroundColor: Colors.border.subtle }} />
            </View>
            <Text style={{ color: Colors.text.primary, fontSize: 18, fontWeight: "700" }}>
              Link Account
            </Text>
            <Text style={{ color: Colors.text.muted, fontSize: 13 }}>Which account pays this bill?</Text>

            {accounts.map((acct) => (
              <TouchableOpacity
                key={acct.id}
                onPress={() => selectedBill && handleLinkAccount(selectedBill, acct.id)}
                style={{
                  backgroundColor: Colors.bg.surface, borderRadius: 14, padding: 14,
                  borderWidth: 1, borderColor: Colors.border.subtle,
                  flexDirection: "row", alignItems: "center", gap: 10,
                }}
              >
                <Ionicons name={ACCOUNT_ICONS[acct.type] as any} size={18} color={Colors.accent} />
                <View style={{ flex: 1 }}>
                  <Text style={{ color: Colors.text.primary, fontSize: 14, fontWeight: "600" }}>{acct.name}</Text>
                  <Text style={{ color: Colors.text.muted, fontSize: 12 }}>
                    {acct.type}{acct.last4 ? ` •••• ${acct.last4}` : ""}
                    {acct.institution ? ` · ${acct.institution}` : ""}
                  </Text>
                </View>
                <Ionicons name="chevron-forward" size={16} color={Colors.text.muted} />
              </TouchableOpacity>
            ))}

            <View style={{ gap: 4 }}>
              <Text style={{ color: Colors.text.muted, fontSize: 11 }}>Reminder days before due date</Text>
              <TextInput
                style={{ backgroundColor: Colors.bg.surface, borderRadius: 10, padding: 12, color: Colors.text.primary, borderWidth: 1.5, borderColor: Colors.border.subtle, fontSize: 15 }}
                placeholder="3"
                placeholderTextColor={Colors.text.muted}
                value={reminderDays}
                onChangeText={setReminderDays}
                keyboardType="number-pad"
              />
            </View>

            <Button label="Cancel" variant="ghost" onPress={() => setSelectedBill(null)} />
          </View>
        </View>
      </Modal>
    </View>
  );
}
