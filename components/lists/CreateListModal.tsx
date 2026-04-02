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
import { Ionicons } from "@expo/vector-icons";
import { useListStore } from "@/store/listStore";
import { useColors, Fonts, Spacing, Radius } from "@/constants/theme";
import Button from "@/components/ui/Button";
import type { ListType, ListResetRule } from "@/types";
import { LIST_RESET_LABELS, DAY_NAMES, type ListResetRule as LRR } from "@/lib/recurrence";

const EMOJIS = [
  "📋", "🛒", "🏠", "🎉", "✈️", "🎁", "📚", "💊",
  "🔧", "🌱", "🍽️", "💪", "🎯", "🧹", "👗", "🐾",
  "🎮", "💰", "📦", "🎵", "🌍", "🏋️", "🐶", "🌿",
];

const COLORS = [
  "#00D632", "#FF453A", "#FF9F0A", "#0A84FF",
  "#BF5AF2", "#FF2D55", "#5AC8FA", "#30D158",
];

const LIST_TYPES: { id: ListType; label: string; icon: string; desc: string }[] = [
  { id: "checklist", label: "Checklist", icon: "checkbox-outline", desc: "Check items off as you go" },
  { id: "bulleted",  label: "Bulleted",  icon: "list-outline",     desc: "Simple bullet points" },
  { id: "numbered",  label: "Numbered",  icon: "list-circle-outline", desc: "Numbered order" },
];

interface Props {
  visible: boolean;
  onClose: () => void;
  /** Pre-populated values for editing an existing list */
  editId?: string;
  defaultName?: string;
  defaultEmoji?: string;
  defaultColor?: string | null;
  defaultType?: ListType;
  defaultResetRule?: ListResetRule;
  defaultResetDayOfWeek?: number | null;
  defaultResetDayOfMonth?: number | null;
}

export default function CreateListModal({
  visible,
  onClose,
  editId,
  defaultName = "",
  defaultEmoji = "📋",
  defaultColor = null,
  defaultType = "checklist",
  defaultResetRule = null,
  defaultResetDayOfWeek = null,
  defaultResetDayOfMonth = null,
}: Props) {
  const Colors = useColors();
  const { createList, updateList } = useListStore();
  const [name, setName] = useState(defaultName);
  const [emoji, setEmoji] = useState(defaultEmoji);
  const [color, setColor] = useState<string | null>(defaultColor);
  const [listType, setListType] = useState<ListType>(defaultType);
  const [resetRule, setResetRule] = useState<ListResetRule>(defaultResetRule);
  const [resetDayOfWeek, setResetDayOfWeek] = useState<number>(defaultResetDayOfWeek ?? 0);
  const [resetDayOfMonth, setResetDayOfMonth] = useState<number>(defaultResetDayOfMonth ?? 1);
  const [loading, setLoading] = useState(false);

  // Sync defaults when modal opens for editing
  const handleOpen = () => {
    setName(defaultName);
    setEmoji(defaultEmoji);
    setColor(defaultColor);
    setListType(defaultType);
    setResetRule(defaultResetRule);
    setResetDayOfWeek(defaultResetDayOfWeek ?? 0);
    setResetDayOfMonth(defaultResetDayOfMonth ?? 1);
  };

  const reset = () => {
    setName("");
    setEmoji("📋");
    setColor(null);
    setListType("checklist");
    setResetRule(null);
    setResetDayOfWeek(0);
    setResetDayOfMonth(1);
  };

  const handleSubmit = async () => {
    if (!name.trim()) return Alert.alert("Name required", "Give your list a name.");
    setLoading(true);
    try {
      if (editId) {
        await updateList(editId, {
          name: name.trim(), emoji, color, list_type: listType,
          recurrence_rule: resetRule,
          recurrence_day_of_week: resetRule === "weekly" ? resetDayOfWeek : null,
          recurrence_day_of_month: resetRule === "monthly" ? resetDayOfMonth : null,
        });
      } else {
        await createList({
          name, emoji, color: color ?? undefined, list_type: listType,
          recurrence_rule: resetRule,
          recurrence_day_of_week: resetRule === "weekly" ? resetDayOfWeek : null,
          recurrence_day_of_month: resetRule === "monthly" ? resetDayOfMonth : null,
        });
      }
      reset();
      onClose();
    } catch (err: unknown) {
      Alert.alert("Error", (err as Error).message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose} onShow={handleOpen}>
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
            maxHeight: "92%",
          }}
        >
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
                {editId ? "Edit List" : "New List"}
              </Text>

              {/* Name */}
              <TextInput
                style={{
                  backgroundColor: Colors.bg.raised,
                  borderRadius: Radius.md,
                  paddingHorizontal: Spacing.md,
                  paddingVertical: 14,
                  color: Colors.text.primary,
                  fontSize: 16,
                  fontFamily: Fonts.regular,
                  borderWidth: 1.5,
                  borderColor: Colors.border.subtle,
                }}
                placeholder="List name"
                placeholderTextColor={Colors.text.muted}
                value={name}
                onChangeText={setName}
                autoFocus={!editId}
                maxLength={60}
              />

              {/* List type */}
              <View>
                <Text style={{ color: Colors.text.muted, fontSize: 11, fontFamily: Fonts.semiBold, marginBottom: Spacing.sm }}>
                  LIST TYPE
                </Text>
                <View style={{ gap: Spacing.xs }}>
                  {LIST_TYPES.map((t) => (
                    <TouchableOpacity
                      key={t.id}
                      onPress={() => setListType(t.id)}
                      style={{
                        flexDirection: "row",
                        alignItems: "center",
                        gap: Spacing.md,
                        padding: Spacing.md,
                        borderRadius: Radius.md,
                        backgroundColor: listType === t.id ? Colors.accentSoft : Colors.bg.raised,
                        borderWidth: 1.5,
                        borderColor: listType === t.id ? Colors.accentBorder : "transparent",
                      }}
                    >
                      <Ionicons name={t.icon as any} size={20} color={listType === t.id ? Colors.accent : Colors.text.muted} />
                      <View style={{ flex: 1 }}>
                        <Text style={{ color: Colors.text.primary, fontFamily: Fonts.semiBold, fontSize: 14 }}>{t.label}</Text>
                        <Text style={{ color: Colors.text.muted, fontSize: 12 }}>{t.desc}</Text>
                      </View>
                      {listType === t.id && <Ionicons name="checkmark-circle" size={18} color={Colors.accent} />}
                    </TouchableOpacity>
                  ))}
                </View>
              </View>

              {/* Emoji */}
              <View>
                <Text style={{ color: Colors.text.muted, fontSize: 11, fontFamily: Fonts.semiBold, marginBottom: Spacing.sm }}>
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

              {/* Color */}
              <View>
                <Text style={{ color: Colors.text.muted, fontSize: 11, fontFamily: Fonts.semiBold, marginBottom: Spacing.sm }}>
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

              {/* Reset schedule */}
              <View>
                <Text style={{ color: Colors.text.muted, fontSize: 11, fontFamily: Fonts.semiBold, marginBottom: Spacing.sm }}>
                  AUTO-RESET SCHEDULE
                </Text>
                <View style={{ flexDirection: "row", flexWrap: "wrap", gap: Spacing.xs }}>
                  {(["none", "daily", "weekly", "monthly"] as const).map((r) => {
                    const active = resetRule === (r === "none" ? null : r);
                    return (
                      <TouchableOpacity
                        key={r}
                        onPress={() => setResetRule(r === "none" ? null : r)}
                        style={{
                          paddingHorizontal: Spacing.md,
                          paddingVertical: 8,
                          borderRadius: Radius.full,
                          backgroundColor: active ? Colors.accentSoft : Colors.bg.raised,
                          borderWidth: 1.5,
                          borderColor: active ? Colors.accentBorder : "transparent",
                        }}
                      >
                        <Text style={{
                          color: active ? Colors.accent : Colors.text.secondary,
                          fontFamily: Fonts.semiBold,
                          fontSize: 13,
                        }}>
                          {LIST_RESET_LABELS[r]}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>

                {/* Day-of-week picker for weekly */}
                {resetRule === "weekly" && (
                  <View style={{ marginTop: Spacing.sm }}>
                    <Text style={{ color: Colors.text.muted, fontSize: 11, fontFamily: Fonts.semiBold, marginBottom: Spacing.xs }}>
                      RESET ON
                    </Text>
                    <View style={{ flexDirection: "row", gap: Spacing.xs }}>
                      {DAY_NAMES.map((day, idx) => (
                        <TouchableOpacity
                          key={day}
                          onPress={() => setResetDayOfWeek(idx)}
                          style={{
                            flex: 1,
                            paddingVertical: 8,
                            borderRadius: Radius.md,
                            alignItems: "center",
                            backgroundColor: resetDayOfWeek === idx ? Colors.accentSoft : Colors.bg.raised,
                            borderWidth: 1.5,
                            borderColor: resetDayOfWeek === idx ? Colors.accentBorder : "transparent",
                          }}
                        >
                          <Text style={{
                            color: resetDayOfWeek === idx ? Colors.accent : Colors.text.muted,
                            fontFamily: Fonts.semiBold,
                            fontSize: 11,
                          }}>
                            {day}
                          </Text>
                        </TouchableOpacity>
                      ))}
                    </View>
                  </View>
                )}

                {/* Day-of-month picker for monthly */}
                {resetRule === "monthly" && (
                  <View style={{ marginTop: Spacing.sm }}>
                    <Text style={{ color: Colors.text.muted, fontSize: 11, fontFamily: Fonts.semiBold, marginBottom: Spacing.xs }}>
                      RESET ON DAY
                    </Text>
                    <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                      <View style={{ flexDirection: "row", gap: Spacing.xs }}>
                        {Array.from({ length: 28 }, (_, i) => i + 1).map((day) => (
                          <TouchableOpacity
                            key={day}
                            onPress={() => setResetDayOfMonth(day)}
                            style={{
                              width: 38,
                              height: 38,
                              borderRadius: Radius.md,
                              alignItems: "center",
                              justifyContent: "center",
                              backgroundColor: resetDayOfMonth === day ? Colors.accentSoft : Colors.bg.raised,
                              borderWidth: 1.5,
                              borderColor: resetDayOfMonth === day ? Colors.accentBorder : "transparent",
                            }}
                          >
                            <Text style={{
                              color: resetDayOfMonth === day ? Colors.accent : Colors.text.muted,
                              fontFamily: Fonts.semiBold,
                              fontSize: 13,
                            }}>
                              {day}
                            </Text>
                          </TouchableOpacity>
                        ))}
                      </View>
                    </ScrollView>
                  </View>
                )}
              </View>

              <View style={{ flexDirection: "row", gap: Spacing.sm, marginTop: Spacing.xs }}>
                <Button label="Cancel" variant="ghost" onPress={onClose} style={{ flex: 1 }} />
                <Button
                  label={editId ? "Save Changes" : "Create List"}
                  variant="primary"
                  loading={loading}
                  onPress={handleSubmit}
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
