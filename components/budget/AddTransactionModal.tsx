import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Modal,
  ScrollView,
  Alert,
  Platform,
} from "react-native";
import { useState } from "react";
import { Colors, pillShadow, Fonts, useColors} from "@/constants/theme";
import Button from "@/components/ui/Button";
import type { BudgetCategory } from "@/types";

interface AddTransactionModalProps {
  visible: boolean;
  categories: BudgetCategory[];
  onClose: () => void;
  onAdd: (data: {
    name: string;
    amount: number;
    type: "debit" | "credit";
    date: string;
    budget_category_id: string | null;
    notes: string | null;
  }) => Promise<void>;
}

export default function AddTransactionModal({
  visible,
  categories,
  onClose,
  onAdd,
}: AddTransactionModalProps) {
  const Colors = useColors();
  const [name, setName] = useState("");
  const [amount, setAmount] = useState("");
  const [type, setType] = useState<"debit" | "credit">("debit");
  const [date, setDate] = useState(new Date().toISOString().split("T")[0]);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [notes, setNotes] = useState("");
  const [loading, setLoading] = useState(false);

  const spendCategories = categories.filter((c) => !c.is_income);

  const handleSelectCategory = (cat: BudgetCategory | null) => {
    if (!cat) {
      setSelectedCategory(null);
      return;
    }
    setSelectedCategory(cat.id);
    // Auto-fill name from the category so the user doesn't have to retype it
    setName(cat.name);
    // For fixed bills, pre-fill the exact monthly amount too
    if (cat.is_fixed && cat.monthly_limit > 0) {
      setAmount(cat.monthly_limit.toString());
    }
  };

  const reset = () => {
    setName(""); setAmount(""); setType("debit");
    setDate(new Date().toISOString().split("T")[0]);
    setSelectedCategory(null); setNotes("");
  };

  const handleAdd = async () => {
    if (!name.trim()) return Alert.alert("Enter a transaction name.");
    const parsed = parseFloat(amount);
    if (isNaN(parsed) || parsed <= 0) return Alert.alert("Enter a valid amount.");
    setLoading(true);
    try {
      await onAdd({
        name: name.trim(),
        amount: parsed,
        type,
        date,
        budget_category_id: selectedCategory,
        notes: notes.trim() || null,
      });
      reset();
      onClose();
    } catch (err: unknown) {
      Alert.alert("Error", (err as Error).message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={{ flex: 1, justifyContent: "flex-end", backgroundColor: "rgba(0,0,0,0.7)" }}>
        <View
          style={{
            backgroundColor: Colors.bg.raised,
            borderTopLeftRadius: 24,
            borderTopRightRadius: 24,
            borderTopWidth: 1,
            borderColor: Colors.border.subtle,
            paddingBottom: Platform.OS === "ios" ? 34 : 20,
          }}
        >
          {/* Handle */}
          <View style={{ alignItems: "center", paddingTop: 12, paddingBottom: 8 }}>
            <View style={{ width: 40, height: 4, borderRadius: 2, backgroundColor: Colors.border.subtle }} />
          </View>

          <ScrollView keyboardShouldPersistTaps="handled">
            <View style={{ paddingHorizontal: 20, gap: 14 }}>
              <Text style={{ color: Colors.text.primary, fontSize: 20, fontFamily: Fonts.bold }}>
                Add Transaction
              </Text>

              {/* Debit / Credit toggle */}
              <View style={{ flexDirection: "row", gap: 8 }}>
                {(["debit", "credit"] as const).map((t) => (
                  <TouchableOpacity
                    key={t}
                    onPress={() => setType(t)}
                    style={{
                      flex: 1,
                      borderRadius: 9999,
                      paddingVertical: 10,
                      alignItems: "center",
                      backgroundColor:
                        type === t
                          ? t === "debit"
                            ? Colors.dangerPink
                            : Colors.neonGreen
                          : Colors.bg.surface,
                      borderWidth: 1,
                      borderColor: Colors.border.subtle,
                      ...(type === t
                        ? pillShadow(t === "debit" ? Colors.dangerPink : Colors.neonGreen)
                        : {}),
                    }}
                  >
                    <Text style={{ color: type === t ? "#000" : Colors.text.secondary, fontFamily: Fonts.semiBold, fontSize: 13 }}>
                      {t === "debit" ? "💸 Expense" : "💰 Income"}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              {/* Name */}
              <TextInput
                style={{
                  backgroundColor: Colors.bg.surface,
                  borderRadius: 12,
                  padding: 14,
                  color: Colors.text.primary,
                  borderWidth: 1,
                  borderColor: Colors.border.subtle,
                  fontSize: 15,
                }}
                placeholder={selectedCategory ? "Auto-filled from category" : "Name (e.g. Whole Foods)"}
                placeholderTextColor={Colors.text.muted}
                value={name}
                onChangeText={setName}
              />

              {/* Amount */}
              <TextInput
                style={{
                  backgroundColor: Colors.bg.surface,
                  borderRadius: 12,
                  padding: 14,
                  color: Colors.text.primary,
                  borderWidth: 1,
                  borderColor: Colors.border.subtle,
                  fontSize: 24,
                  fontFamily: Fonts.bold,
                }}
                placeholder="0.00"
                placeholderTextColor={Colors.text.muted}
                keyboardType="decimal-pad"
                value={amount}
                onChangeText={setAmount}
              />

              {/* Date */}
              <TextInput
                style={{
                  backgroundColor: Colors.bg.surface,
                  borderRadius: 12,
                  padding: 14,
                  color: Colors.text.primary,
                  borderWidth: 1,
                  borderColor: Colors.border.subtle,
                  fontSize: 15,
                }}
                placeholder="Date (YYYY-MM-DD)"
                placeholderTextColor={Colors.text.muted}
                value={date}
                onChangeText={setDate}
              />

              {/* Category selector (expense only) */}
              {type === "debit" && (
                <View>
                  <Text style={{ color: Colors.text.secondary, fontSize: 12, marginBottom: 8 }}>
                    CATEGORY
                  </Text>
                  <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                    <View style={{ flexDirection: "row", gap: 8 }}>
                      <TouchableOpacity
                        onPress={() => handleSelectCategory(null)}
                        style={{
                          borderRadius: 9999,
                          paddingHorizontal: 14,
                          paddingVertical: 8,
                          backgroundColor: !selectedCategory ? Colors.neonGreenGlow : Colors.bg.surface,
                          borderWidth: 1,
                          borderColor: !selectedCategory ? Colors.neonGreenBorder : Colors.border.subtle,
                        }}
                      >
                        <Text style={{ color: Colors.text.secondary, fontSize: 13 }}>None</Text>
                      </TouchableOpacity>
                      {spendCategories.map((cat) => (
                        <TouchableOpacity
                          key={cat.id}
                          onPress={() => handleSelectCategory(cat)}
                          style={{
                            borderRadius: 9999,
                            paddingHorizontal: 14,
                            paddingVertical: 8,
                            backgroundColor:
                              selectedCategory === cat.id ? Colors.neonGreenGlow : Colors.bg.surface,
                            borderWidth: 1,
                            borderColor:
                              selectedCategory === cat.id ? Colors.neonGreenBorder : Colors.border.subtle,
                          }}
                        >
                          <Text style={{ color: Colors.text.primary, fontSize: 13 }}>
                            {cat.emoji} {cat.name}
                          </Text>
                        </TouchableOpacity>
                      ))}
                    </View>
                  </ScrollView>
                </View>
              )}

              {/* Notes */}
              <TextInput
                style={{
                  backgroundColor: Colors.bg.surface,
                  borderRadius: 12,
                  padding: 14,
                  color: Colors.text.primary,
                  borderWidth: 1,
                  borderColor: Colors.border.subtle,
                  fontSize: 14,
                  minHeight: 64,
                  textAlignVertical: "top",
                }}
                placeholder="Notes (optional)"
                placeholderTextColor={Colors.text.muted}
                multiline
                value={notes}
                onChangeText={setNotes}
              />

              {/* Actions */}
              <View style={{ flexDirection: "row", gap: 10, marginTop: 4 }}>
                <Button label="Cancel" variant="ghost" onPress={onClose} style={{ flex: 1 }} />
                <Button label="Add" variant="primary" loading={loading} onPress={handleAdd} style={{ flex: 1 }} />
              </View>
            </View>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}
