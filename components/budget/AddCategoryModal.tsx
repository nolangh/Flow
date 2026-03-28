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
import { useState } from "react";
import { Colors, Fonts } from "@/constants/theme";
import Button from "@/components/ui/Button";

const EMOJI_OPTIONS = ["🍔", "🛒", "🚗", "🏠", "💊", "🎬", "✈️", "📱", "💡", "🎓", "👗", "🐾", "💵", "📦", "🏋️", "🎮"];

interface AddCategoryModalProps {
  visible: boolean;
  onClose: () => void;
  onAdd: (data: {
    name: string;
    emoji: string;
    monthly_limit: number;
    is_income: boolean;
    is_fixed: boolean;
    fixed_day_of_month: number | null;
  }) => Promise<void>;
}

export default function AddCategoryModal({ visible, onClose, onAdd }: AddCategoryModalProps) {
  const [name, setName] = useState("");
  const [emoji, setEmoji] = useState("📦");
  const [limit, setLimit] = useState("");
  const [isIncome, setIsIncome] = useState(false);
  const [isFixed, setIsFixed] = useState(false);
  const [fixedDay, setFixedDay] = useState("");
  const [loading, setLoading] = useState(false);

  const reset = () => {
    setName(""); setEmoji("📦"); setLimit("");
    setIsIncome(false); setIsFixed(false); setFixedDay("");
  };

  const handleAdd = async () => {
    if (!name.trim()) return Alert.alert("Enter a category name.");
    const parsedLimit = parseFloat(limit);
    if (isNaN(parsedLimit) || parsedLimit <= 0) return Alert.alert("Enter a valid monthly amount.");
    setLoading(true);
    try {
      await onAdd({
        name: name.trim(),
        emoji,
        monthly_limit: parsedLimit,
        is_income: isIncome,
        is_fixed: isFixed,
        fixed_day_of_month: isFixed ? (parseInt(fixedDay) || null) : null,
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
              <Text style={{ color: Colors.text.primary, fontSize: 20, fontFamily: Fonts.bold }}>
                New Category
              </Text>

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
                placeholder="Category name"
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
                  <Text style={{ color: Colors.text.muted, fontSize: 11, marginTop: 2 }}>
                    e.g. mortgage, car insurance, utilities
                  </Text>
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
                  <Text style={{ color: Colors.text.muted, fontSize: 11, marginTop: 2 }}>
                    e.g. paycheck, side income
                  </Text>
                </View>
                <Switch
                  value={isIncome}
                  onValueChange={(v) => { setIsIncome(v); if (v) setIsFixed(false); }}
                  trackColor={{ false: Colors.bg.overlay, true: Colors.neonGreenDim }}
                  thumbColor={isIncome ? Colors.neonGreen : Colors.text.muted}
                />
              </View>

              {isFixed && (
                <TextInput
                  style={{ backgroundColor: Colors.bg.surface, borderRadius: 12, padding: 14, color: Colors.text.primary, borderWidth: 1, borderColor: Colors.border.subtle, fontSize: 15 }}
                  placeholder="Bill day of month (e.g. 15)"
                  placeholderTextColor={Colors.text.muted}
                  keyboardType="number-pad"
                  value={fixedDay}
                  onChangeText={setFixedDay}
                />
              )}

              <View style={{ flexDirection: "row", gap: 10, marginTop: 4 }}>
                <Button label="Cancel" variant="ghost" onPress={onClose} style={{ flex: 1 }} />
                <Button label="Create" variant="primary" loading={loading} onPress={handleAdd} style={{ flex: 1 }} />
              </View>
            </View>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}
