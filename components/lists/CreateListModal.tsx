import {
  View,
  Text,
  TextInput,
  Modal,
  TouchableOpacity,
  ScrollView,
  Alert,
  Platform,
} from "react-native";
import { useState } from "react";
import { useListStore } from "@/store/listStore";
import { useColors, Fonts, Spacing, Radius } from "@/constants/theme";
import Button from "@/components/ui/Button";

const EMOJIS = [
  "📋", "🛒", "🏠", "🎉", "✈️", "🎁", "📚", "💊",
  "🔧", "🌱", "🍽️", "💪", "🎯", "🧹", "👗", "🐾",
];

const COLORS = [
  "#00D632", "#FF453A", "#FF9F0A", "#0A84FF",
  "#BF5AF2", "#FF2D55", "#5AC8FA", "#30D158",
];

interface Props {
  visible: boolean;
  onClose: () => void;
}

export default function CreateListModal({ visible, onClose }: Props) {
  const Colors = useColors();
  const { createList } = useListStore();
  const [name, setName] = useState("");
  const [emoji, setEmoji] = useState("📋");
  const [color, setColor] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const reset = () => {
    setName("");
    setEmoji("📋");
    setColor(null);
  };

  const handleCreate = async () => {
    if (!name.trim()) return Alert.alert("Name required", "Give your list a name.");
    setLoading(true);
    try {
      await createList({ name, emoji, color: color ?? undefined });
      reset();
      onClose();
    } catch (err: unknown) {
      Alert.alert("Error", (err as Error).message);
    } finally {
      setLoading(false);
    }
  };

  const inputStyle = {
    backgroundColor: Colors.bg.raised,
    borderRadius: Radius.md,
    paddingHorizontal: Spacing.md,
    paddingVertical: 14,
    color: Colors.text.primary,
    fontSize: 16,
    fontFamily: Fonts.regular,
    borderWidth: 1.5,
    borderColor: Colors.border.subtle,
  };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <TouchableOpacity
        style={{ flex: 1, backgroundColor: "rgba(0,0,0,0.5)", justifyContent: "flex-end" }}
        activeOpacity={1}
        onPress={onClose}
      >
        <TouchableOpacity
          activeOpacity={1}
          style={{
            backgroundColor: Colors.bg.surface,
            borderTopLeftRadius: 24,
            borderTopRightRadius: 24,
            paddingBottom: Platform.OS === "ios" ? 40 : 24,
          }}
        >
          {/* Drag handle */}
          <View style={{ alignItems: "center", paddingTop: 12, paddingBottom: 4 }}>
            <View style={{ width: 40, height: 4, borderRadius: 2, backgroundColor: Colors.border.subtle }} />
          </View>

          <ScrollView keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
            <View style={{ paddingHorizontal: Spacing.lg, gap: Spacing.md, paddingTop: Spacing.sm }}>
              <Text style={{
                color: Colors.text.primary,
                fontSize: 20,
                fontFamily: Fonts.bold,
                letterSpacing: -0.4,
              }}>
                New List
              </Text>

              {/* Name input */}
              <TextInput
                style={inputStyle}
                placeholder="List name (e.g. Grocery List)"
                placeholderTextColor={Colors.text.muted}
                value={name}
                onChangeText={setName}
                autoFocus
                maxLength={60}
              />

              {/* Emoji picker */}
              <View>
                <Text style={{ color: Colors.text.muted, fontSize: 12, fontFamily: Fonts.semiBold, marginBottom: Spacing.sm }}>
                  ICON
                </Text>
                <View style={{ flexDirection: "row", flexWrap: "wrap", gap: Spacing.sm }}>
                  {EMOJIS.map((e) => (
                    <TouchableOpacity
                      key={e}
                      onPress={() => setEmoji(e)}
                      style={{
                        width: 44,
                        height: 44,
                        borderRadius: Radius.md,
                        alignItems: "center",
                        justifyContent: "center",
                        backgroundColor: emoji === e ? Colors.accentSoft : Colors.bg.raised,
                        borderWidth: 1.5,
                        borderColor: emoji === e ? Colors.accentBorder : "transparent",
                      }}
                    >
                      <Text style={{ fontSize: 22 }}>{e}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>

              {/* Color picker (optional) */}
              <View>
                <Text style={{ color: Colors.text.muted, fontSize: 12, fontFamily: Fonts.semiBold, marginBottom: Spacing.sm }}>
                  COLOR (OPTIONAL)
                </Text>
                <View style={{ flexDirection: "row", gap: Spacing.sm, flexWrap: "wrap" }}>
                  {COLORS.map((c) => (
                    <TouchableOpacity
                      key={c}
                      onPress={() => setColor(color === c ? null : c)}
                      style={{
                        width: 32,
                        height: 32,
                        borderRadius: Radius.full,
                        backgroundColor: c,
                        borderWidth: 2.5,
                        borderColor: color === c ? Colors.text.primary : "transparent",
                      }}
                    />
                  ))}
                </View>
              </View>

              {/* Buttons */}
              <View style={{ flexDirection: "row", gap: Spacing.sm, marginTop: Spacing.xs }}>
                <Button label="Cancel" variant="ghost" onPress={onClose} style={{ flex: 1 }} />
                <Button
                  label="Create List"
                  variant="primary"
                  loading={loading}
                  onPress={handleCreate}
                  style={{ flex: 1 }}
                />
              </View>
            </View>
          </ScrollView>
        </TouchableOpacity>
      </TouchableOpacity>
    </Modal>
  );
}
