import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Modal,
  ScrollView,
  Alert,
  Switch,
  Platform,
} from "react-native";
import { useState, useEffect } from "react";
import { Ionicons } from "@expo/vector-icons";
import { Colors, Fonts } from "@/constants/theme";
import Button from "@/components/ui/Button";
import type { BudgetCategory } from "@/types";

const EMOJI_OPTIONS = ["🍔", "🛒", "🚗", "🏠", "💊", "🎬", "✈️", "📱", "💡", "🎓", "👗", "🐾", "💵", "📦", "🏋️", "🎮", "📋", "⚡", "💧", "🌊", "🏥", "📶", "🙏", "☀️"];

const THRESHOLD_PRESETS = [
  { label: "50%", value: 50 },
  { label: "75%", value: 75 },
  { label: "80%", value: 80 },
  { label: "90%", value: 90 },
  { label: "Off", value: null },
];

interface EditCategoryModalProps {
  visible: boolean;
  category: BudgetCategory | null;
  onClose: () => void;
  onSave: (id: string, data: Partial<BudgetCategory>) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
}

export default function EditCategoryModal({ visible, category, onClose, onSave, onDelete }: EditCategoryModalProps) {
  const [name, setName] = useState("");
  const [emoji, setEmoji] = useState("📦");
  const [limit, setLimit] = useState("");
  const [isIncome, setIsIncome] = useState(false);
  const [isFixed, setIsFixed] = useState(false);
  const [fixedDay, setFixedDay] = useState("");
  const [alertThreshold, setAlertThreshold] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    if (category) {
      setName(category.name);
      setEmoji(category.emoji ?? "📦");
      setLimit(category.monthly_limit.toString());
      setIsIncome(category.is_income);
      setIsFixed(category.is_fixed);
      setFixedDay(category.fixed_day_of_month?.toString() ?? "");
      setAlertThreshold(category.alert_threshold ?? null);
    }
  }, [category]);

  const handleSave = async () => {
    if (!category) return;
    if (!name.trim()) return Alert.alert("Enter a name.");
    const parsedLimit = parseFloat(limit);
    if (isNaN(parsedLimit) || parsedLimit <= 0) return Alert.alert("Enter a valid amount.");
    setLoading(true);
    try {
      await onSave(category.id, {
        name: name.trim(),
        emoji,
        monthly_limit: parsedLimit,
        is_income: isIncome,
        is_fixed: isFixed,
        fixed_day_of_month: isFixed ? (parseInt(fixedDay) || null) : null,
        alert_threshold: alertThreshold,
      });
      onClose();
    } catch (err: unknown) {
      Alert.alert("Error", (err as Error).message);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = () => {
    if (!category) return;
    Alert.alert(
      "Delete Category",
      `Remove "${category.name}"? This won't delete past transactions.`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            setDeleting(true);
            try {
              await onDelete(category.id);
              onClose();
            } catch (err: unknown) {
              Alert.alert("Error", (err as Error).message);
            } finally {
              setDeleting(false);
            }
          },
        },
      ]
    );
  };

  const isSpending = !isIncome && !isFixed;

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={{ flex: 1, justifyContent: "flex-end", backgroundColor: "rgba(0,0,0,0.7)" }}>
        <View style={{
          backgroundColor: Colors.bg.raised,
          borderTopLeftRadius: 24, borderTopRightRadius: 24,
          borderTopWidth: 1, borderColor: Colors.border.subtle,
          paddingBottom: Platform.OS === "ios" ? 34 : 20,
        }}>
          <View style={{ alignItems: "center", paddingTop: 12, paddingBottom: 8 }}>
            <View style={{ width: 40, height: 4, borderRadius: 2, backgroundColor: Colors.border.subtle }} />
          </View>

          <ScrollView keyboardShouldPersistTaps="handled">
            <View style={{ paddingHorizontal: 20, gap: 14 }}>
              <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
                <Text style={{ color: Colors.text.primary, fontSize: 20, fontFamily: Fonts.bold }}>
                  Edit {category?.is_fixed ? "Bill" : category?.is_income ? "Income" : "Category"}
                </Text>
                <TouchableOpacity onPress={handleDelete} disabled={deleting}>
                  <Text style={{ color: Colors.danger, fontSize: 14, fontFamily: Fonts.semiBold }}>
                    {deleting ? "Deleting…" : "Delete"}
                  </Text>
                </TouchableOpacity>
              </View>

              {/* Emoji picker */}
              <View>
                <Text style={{ color: Colors.text.secondary, fontSize: 12, marginBottom: 8 }}>ICON</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                  <View style={{ flexDirection: "row", gap: 8 }}>
                    {EMOJI_OPTIONS.map((e) => (
                      <TouchableOpacity
                        key={e}
                        onPress={() => setEmoji(e)}
                        style={{
                          width: 44, height: 44, borderRadius: 12,
                          backgroundColor: emoji === e ? Colors.neonGreenGlow : Colors.bg.surface,
                          alignItems: "center", justifyContent: "center",
                          borderWidth: 1,
                          borderColor: emoji === e ? Colors.neonGreenBorder : Colors.border.subtle,
                        }}
                      >
                        <Text style={{ fontSize: 22 }}>{e}</Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </ScrollView>
              </View>

              <TextInput
                style={{ backgroundColor: Colors.bg.surface, borderRadius: 12, padding: 14, color: Colors.text.primary, borderWidth: 1, borderColor: Colors.border.subtle, fontSize: 15 }}
                placeholder="Name"
                placeholderTextColor={Colors.text.muted}
                value={name}
                onChangeText={setName}
              />

              <TextInput
                style={{ backgroundColor: Colors.bg.surface, borderRadius: 12, padding: 14, color: Colors.text.primary, borderWidth: 1, borderColor: Colors.border.subtle, fontSize: 20, fontFamily: Fonts.bold }}
                placeholder="Monthly amount"
                placeholderTextColor={Colors.text.muted}
                keyboardType="decimal-pad"
                value={limit}
                onChangeText={setLimit}
              />

              {/* Type toggles */}
              <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
                <View style={{ flex: 1 }}>
                  <Text style={{ color: Colors.text.secondary, fontSize: 14 }}>Fixed monthly bill</Text>
                  <Text style={{ color: Colors.text.muted, fontSize: 11, marginTop: 2 }}>e.g. mortgage, insurance, utilities</Text>
                </View>
                <Switch
                  value={isFixed && !isIncome}
                  onValueChange={(v) => { setIsFixed(v); if (v) setIsIncome(false); }}
                  trackColor={{ false: Colors.bg.overlay, true: Colors.neonGreenDim }}
                  thumbColor={isFixed ? Colors.neonGreen : Colors.text.muted}
                />
              </View>

              <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
                <View style={{ flex: 1 }}>
                  <Text style={{ color: Colors.text.secondary, fontSize: 14 }}>This is income</Text>
                  <Text style={{ color: Colors.text.muted, fontSize: 11, marginTop: 2 }}>e.g. paycheck, side income</Text>
                </View>
                <Switch
                  value={isIncome}
                  onValueChange={(v) => { setIsIncome(v); if (v) setIsFixed(false); }}
                  trackColor={{ false: Colors.bg.overlay, true: Colors.neonGreenDim }}
                  thumbColor={isIncome ? Colors.neonGreen : Colors.text.muted}
                />
              </View>

              {isFixed && (
                <View>
                  <Text style={{ color: Colors.text.secondary, fontSize: 13, marginBottom: 8 }}>
                    Due date (day of month)
                  </Text>
                  <TextInput
                    style={{ backgroundColor: Colors.bg.surface, borderRadius: 12, padding: 14, color: Colors.text.primary, borderWidth: 1, borderColor: Colors.accentBorder, fontSize: 15 }}
                    placeholder="e.g. 1 for the 1st, 15 for the 15th"
                    placeholderTextColor={Colors.text.muted}
                    keyboardType="number-pad"
                    value={fixedDay}
                    onChangeText={setFixedDay}
                  />
                </View>
              )}

              {/* ── Spend Alert Threshold (spending categories only) ── */}
              {isSpending && (
                <View style={{
                  backgroundColor: Colors.bg.surface,
                  borderRadius: 14, padding: 14,
                  borderWidth: 1, borderColor: Colors.border.subtle,
                  gap: 10,
                }}>
                  <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
                    <Ionicons name="notifications-outline" size={16} color={Colors.text.secondary} />
                    <View style={{ flex: 1 }}>
                      <Text style={{ color: Colors.text.primary, fontSize: 14, fontFamily: Fonts.semiBold }}>
                        Spend alert
                      </Text>
                      <Text style={{ color: Colors.text.muted, fontSize: 11, marginTop: 1 }}>
                        Get notified when you reach this % of the budget
                      </Text>
                    </View>
                  </View>

                  <View style={{ flexDirection: "row", gap: 8, flexWrap: "wrap" }}>
                    {THRESHOLD_PRESETS.map((p) => {
                      const active = alertThreshold === p.value;
                      return (
                        <TouchableOpacity
                          key={String(p.value)}
                          onPress={() => setAlertThreshold(p.value)}
                          style={{
                            paddingHorizontal: 14, paddingVertical: 8,
                            borderRadius: 9999,
                            backgroundColor: active
                              ? (p.value === null ? Colors.bg.raised : Colors.accentBorder)
                              : Colors.bg.raised,
                            borderWidth: 1,
                            borderColor: active
                              ? (p.value === null ? Colors.border.strong : Colors.accent)
                              : Colors.border.subtle,
                          }}
                        >
                          <Text style={{
                            fontFamily: Fonts.bold, fontSize: 13,
                            color: active
                              ? (p.value === null ? Colors.text.secondary : Colors.accent)
                              : Colors.text.muted,
                          }}>
                            {p.label}
                          </Text>
                        </TouchableOpacity>
                      );
                    })}
                  </View>

                  {alertThreshold !== null && (
                    <View style={{ flexDirection: "row", alignItems: "center", gap: 6, paddingTop: 2 }}>
                      <Ionicons name="checkmark-circle" size={14} color={Colors.accent} />
                      <Text style={{ color: Colors.text.muted, fontSize: 12, fontFamily: Fonts.medium }}>
                        Alert at {alertThreshold}% spent · ${((parseFloat(limit) || 0) * alertThreshold / 100).toFixed(2)} of ${parseFloat(limit) ? parseFloat(limit).toFixed(2) : "0.00"}
                      </Text>
                    </View>
                  )}
                </View>
              )}

              <View style={{ flexDirection: "row", gap: 10, marginTop: 4 }}>
                <Button label="Cancel" variant="ghost" onPress={onClose} style={{ flex: 1 }} />
                <Button label="Save" variant="primary" loading={loading} onPress={handleSave} style={{ flex: 1 }} />
              </View>
            </View>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}
