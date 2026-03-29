import {
  View,
  Text,
  TextInput,
  Modal,
  TouchableOpacity,
  FlatList,
  Alert,
  Platform,
  KeyboardAvoidingView,
} from "react-native";
import { useState, useRef } from "react";
import { Ionicons } from "@expo/vector-icons";
import { useListStore } from "@/store/listStore";
import { useColors, Fonts, Spacing, Radius } from "@/constants/theme";
import type { ShoppingList, ListItem } from "@/types";

interface Props {
  list: ShoppingList;
  onClose: () => void;
}

export default function ListDetailModal({ list, onClose }: Props) {
  const Colors = useColors();
  const { toggleItem, deleteItem, addItem, clearCheckedItems, lists } = useListStore();
  const [newItemText, setNewItemText] = useState("");
  const [adding, setAdding] = useState(false);
  const inputRef = useRef<TextInput>(null);

  // Always read the latest version of this list from the store (real-time updates)
  const currentList = lists.find((l) => l.id === list.id) ?? list;
  const unchecked = currentList.items.filter((i) => !i.is_checked);
  const checked = currentList.items.filter((i) => i.is_checked);
  const hasChecked = checked.length > 0;

  const handleAddItem = async () => {
    if (!newItemText.trim()) return;
    setAdding(true);
    try {
      await addItem(currentList.id, newItemText.trim());
      setNewItemText("");
      inputRef.current?.focus();
    } catch (err: unknown) {
      Alert.alert("Error", (err as Error).message);
    } finally {
      setAdding(false);
    }
  };

  const handleDeleteItem = (item: ListItem) => {
    Alert.alert("Remove item?", `"${item.text}"`, [
      { text: "Cancel", style: "cancel" },
      { text: "Remove", style: "destructive", onPress: () => deleteItem(item.id) },
    ]);
  };

  const handleClearChecked = () => {
    Alert.alert(
      "Clear checked items?",
      `Remove ${checked.length} checked item${checked.length > 1 ? "s" : ""}?`,
      [
        { text: "Cancel", style: "cancel" },
        { text: "Clear", style: "destructive", onPress: () => clearCheckedItems(currentList.id) },
      ]
    );
  };

  const renderItem = ({ item }: { item: ListItem }) => (
    <TouchableOpacity
      onPress={() => toggleItem(item.id, !item.is_checked)}
      onLongPress={() => handleDeleteItem(item)}
      activeOpacity={0.7}
      style={{
        flexDirection: "row",
        alignItems: "center",
        gap: Spacing.md,
        paddingVertical: 12,
        borderBottomWidth: 1,
        borderBottomColor: Colors.border.dim,
      }}
    >
      {/* Checkbox */}
      <View style={{
        width: 24,
        height: 24,
        borderRadius: Radius.sm,
        borderWidth: 2,
        borderColor: item.is_checked ? Colors.accent : Colors.border.subtle,
        backgroundColor: item.is_checked ? Colors.accent : "transparent",
        alignItems: "center",
        justifyContent: "center",
      }}>
        {item.is_checked && <Ionicons name="checkmark" size={14} color="#000" />}
      </View>

      <Text style={{
        flex: 1,
        color: item.is_checked ? Colors.text.muted : Colors.text.primary,
        fontSize: 16,
        fontFamily: Fonts.regular,
        textDecorationLine: item.is_checked ? "line-through" : "none",
      }}>
        {item.text}
      </Text>

      <TouchableOpacity onPress={() => handleDeleteItem(item)} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
        <Ionicons name="close" size={16} color={Colors.text.muted} />
      </TouchableOpacity>
    </TouchableOpacity>
  );

  return (
    <Modal visible animationType="slide" onRequestClose={onClose}>
      <KeyboardAvoidingView
        style={{ flex: 1, backgroundColor: Colors.bg.app }}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
      >
        {/* Header */}
        <View style={{
          flexDirection: "row",
          alignItems: "center",
          gap: Spacing.sm,
          paddingHorizontal: Spacing.lg,
          paddingTop: Platform.OS === "ios" ? 60 : Spacing.xl,
          paddingBottom: Spacing.md,
          borderBottomWidth: 1,
          borderBottomColor: Colors.border.subtle,
        }}>
          <Text style={{ fontSize: 28 }}>{currentList.emoji}</Text>
          <Text style={{
            flex: 1,
            color: Colors.text.primary,
            fontSize: 22,
            fontFamily: Fonts.bold,
            letterSpacing: -0.5,
          }}>
            {currentList.name}
          </Text>
          {hasChecked && (
            <TouchableOpacity onPress={handleClearChecked} style={{ marginRight: Spacing.sm }}>
              <Text style={{ color: Colors.danger, fontSize: 13, fontFamily: Fonts.semiBold }}>
                Clear
              </Text>
            </TouchableOpacity>
          )}
          <TouchableOpacity onPress={onClose}>
            <Ionicons name="close" size={24} color={Colors.text.muted} />
          </TouchableOpacity>
        </View>

        {/* Item count */}
        <Text style={{
          color: Colors.text.muted,
          fontSize: 12,
          fontFamily: Fonts.semiBold,
          paddingHorizontal: Spacing.lg,
          paddingTop: Spacing.sm,
          paddingBottom: Spacing.xs,
        }}>
          {currentList.items.length === 0
            ? "No items yet"
            : `${checked.length} of ${currentList.items.length} checked`}
        </Text>

        {/* Items list */}
        <FlatList
          data={[...unchecked, ...checked]}
          keyExtractor={(item) => item.id}
          renderItem={renderItem}
          contentContainerStyle={{ paddingHorizontal: Spacing.lg, paddingBottom: 120 }}
          keyboardShouldPersistTaps="handled"
          ListEmptyComponent={
            <View style={{ alignItems: "center", paddingTop: 60, gap: Spacing.sm }}>
              <Text style={{ color: Colors.text.muted, fontSize: 15 }}>
                Add your first item below
              </Text>
            </View>
          }
        />

        {/* Add item input */}
        <View style={{
          flexDirection: "row",
          alignItems: "center",
          gap: Spacing.sm,
          paddingHorizontal: Spacing.lg,
          paddingVertical: Spacing.md,
          paddingBottom: Platform.OS === "ios" ? 36 : Spacing.md,
          borderTopWidth: 1,
          borderTopColor: Colors.border.subtle,
          backgroundColor: Colors.bg.surface,
        }}>
          <TextInput
            ref={inputRef}
            style={{
              flex: 1,
              backgroundColor: Colors.bg.raised,
              borderRadius: Radius.md,
              paddingHorizontal: Spacing.md,
              paddingVertical: 12,
              color: Colors.text.primary,
              fontSize: 15,
              fontFamily: Fonts.regular,
              borderWidth: 1,
              borderColor: Colors.border.subtle,
            }}
            placeholder="Add an item..."
            placeholderTextColor={Colors.text.muted}
            value={newItemText}
            onChangeText={setNewItemText}
            onSubmitEditing={handleAddItem}
            returnKeyType="done"
            blurOnSubmit={false}
          />
          <TouchableOpacity
            onPress={handleAddItem}
            disabled={!newItemText.trim() || adding}
            style={{
              backgroundColor: newItemText.trim() ? Colors.accent : Colors.bg.overlay,
              width: 40,
              height: 40,
              borderRadius: Radius.full,
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <Ionicons name="add" size={22} color={newItemText.trim() ? "#000" : Colors.text.muted} />
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}
