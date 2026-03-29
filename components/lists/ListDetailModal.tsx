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
  Switch,
} from "react-native";
import { useState, useRef } from "react";
import { Ionicons } from "@expo/vector-icons";
import { useListStore } from "@/store/listStore";
import { useColors, Fonts, Spacing, Radius } from "@/constants/theme";
import type { ShoppingList, ListItem, ListItemType } from "@/types";
import CreateListModal from "./CreateListModal";

interface Props {
  list: ShoppingList;
  onClose: () => void;
}

interface AddItemState {
  text: string;
  note: string;
  quantity: string;
  item_type: ListItemType;
  showExtras: boolean;
}

const INIT_ADD: AddItemState = { text: "", note: "", quantity: "", item_type: "item", showExtras: false };

function ItemBullet({
  list,
  item,
  index,
  onToggle,
}: {
  list: ShoppingList;
  item: ListItem;
  index: number;
  onToggle: () => void;
}) {
  const Colors = useColors();

  if (list.list_type === "checklist") {
    return (
      <TouchableOpacity
        onPress={onToggle}
        style={{
          width: 24,
          height: 24,
          borderRadius: Radius.sm,
          borderWidth: 2,
          borderColor: item.is_checked ? Colors.accent : Colors.border.subtle,
          backgroundColor: item.is_checked ? Colors.accent : "transparent",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        {item.is_checked && <Ionicons name="checkmark" size={14} color="#000" />}
      </TouchableOpacity>
    );
  }
  if (list.list_type === "numbered") {
    return (
      <Text style={{ color: Colors.text.muted, fontSize: 14, fontFamily: Fonts.semiBold, width: 24, textAlign: "right" }}>
        {index + 1}.
      </Text>
    );
  }
  // bulleted
  return (
    <Text style={{ color: Colors.accent, fontSize: 22, lineHeight: 24, width: 24, textAlign: "center" }}>•</Text>
  );
}

export default function ListDetailModal({ list, onClose }: Props) {
  const Colors = useColors();
  const { toggleItem, deleteItem, addItem, updateItem, clearCheckedItems, lists } = useListStore();
  const [add, setAdd] = useState<AddItemState>(INIT_ADD);
  const [editItem, setEditItem] = useState<ListItem | null>(null);
  const [editText, setEditText] = useState("");
  const [editNote, setEditNote] = useState("");
  const [editQty, setEditQty] = useState("");
  const [showEdit, setShowEdit] = useState(false);
  const inputRef = useRef<TextInput>(null);

  // Always read the latest version from the store for real-time updates
  const currentList = lists.find((l) => l.id === list.id) ?? list;
  const isChecklist = currentList.list_type === "checklist";
  const unchecked = currentList.items.filter((i) => !i.is_checked || i.item_type === "section");
  const checked = isChecklist ? currentList.items.filter((i) => i.is_checked && i.item_type === "item") : [];
  const itemsForIndex = currentList.items.filter((i) => i.item_type === "item");

  const handleAddItem = async () => {
    if (!add.text.trim()) return;
    const data = {
      text: add.text.trim(),
      item_type: add.item_type,
      note: add.note.trim() || undefined,
      quantity: add.quantity.trim() || undefined,
    };
    setAdd(INIT_ADD);
    inputRef.current?.focus();
    try {
      await addItem(currentList.id, data);
    } catch (err: unknown) {
      Alert.alert("Error", (err as Error).message);
    }
  };

  const handleOpenEditItem = (item: ListItem) => {
    setEditItem(item);
    setEditText(item.text);
    setEditNote(item.note ?? "");
    setEditQty(item.quantity ?? "");
  };

  const handleSaveEditItem = async () => {
    if (!editItem || !editText.trim()) return;
    await updateItem(editItem.id, {
      text: editText.trim(),
      note: editNote.trim() || null,
      quantity: editQty.trim() || null,
    });
    setEditItem(null);
  };

  const handleLongPressItem = (item: ListItem) => {
    if (item.item_type === "section") {
      Alert.alert(item.text, undefined, [
        { text: "Edit", onPress: () => handleOpenEditItem(item) },
        { text: "Delete", style: "destructive", onPress: () => deleteItem(item.id) },
        { text: "Cancel", style: "cancel" },
      ]);
    } else {
      Alert.alert(item.text, item.note ?? undefined, [
        { text: "Edit", onPress: () => handleOpenEditItem(item) },
        { text: "Delete", style: "destructive", onPress: () => deleteItem(item.id) },
        { text: "Cancel", style: "cancel" },
      ]);
    }
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

  const renderItem = ({ item }: { item: ListItem }) => {
    const itemIndex = itemsForIndex.indexOf(item);

    // Section header
    if (item.item_type === "section") {
      return (
        <TouchableOpacity onLongPress={() => handleLongPressItem(item)}>
          <View style={{
            paddingVertical: 10,
            paddingHorizontal: 2,
            borderBottomWidth: 1,
            borderBottomColor: Colors.border.subtle,
            marginTop: Spacing.sm,
          }}>
            <Text style={{ color: Colors.text.secondary, fontSize: 12, fontFamily: Fonts.bold, letterSpacing: 0.8 }}>
              {item.text.toUpperCase()}
            </Text>
          </View>
        </TouchableOpacity>
      );
    }

    return (
      <TouchableOpacity
        onPress={() => isChecklist ? toggleItem(item.id, !item.is_checked) : undefined}
        onLongPress={() => handleLongPressItem(item)}
        activeOpacity={0.7}
        style={{
          flexDirection: "row",
          alignItems: "flex-start",
          gap: Spacing.md,
          paddingVertical: 10,
          borderBottomWidth: 1,
          borderBottomColor: Colors.border.dim,
        }}
      >
        <ItemBullet
          list={currentList}
          item={item}
          index={itemIndex}
          onToggle={() => toggleItem(item.id, !item.is_checked)}
        />

        <View style={{ flex: 1 }}>
          <View style={{ flexDirection: "row", alignItems: "center", gap: Spacing.sm }}>
            <Text style={{
              flex: 1,
              color: item.is_checked ? Colors.text.muted : Colors.text.primary,
              fontSize: 16,
              fontFamily: Fonts.regular,
              textDecorationLine: item.is_checked ? "line-through" : "none",
            }}>
              {item.text}
            </Text>
            {item.quantity && (
              <Text style={{
                color: Colors.accent,
                fontSize: 13,
                fontFamily: Fonts.semiBold,
                backgroundColor: Colors.accentSoft,
                paddingHorizontal: 6,
                paddingVertical: 2,
                borderRadius: Radius.sm,
              }}>
                ×{item.quantity}
              </Text>
            )}
          </View>
          {item.note ? (
            <Text style={{ color: Colors.text.muted, fontSize: 12, marginTop: 2 }}>{item.note}</Text>
          ) : null}
        </View>

        <TouchableOpacity onPress={() => deleteItem(item.id)} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
          <Ionicons name="close" size={16} color={Colors.text.muted} />
        </TouchableOpacity>
      </TouchableOpacity>
    );
  };

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
          <Text style={{ fontSize: 26 }}>{currentList.emoji}</Text>
          <Text style={{
            flex: 1,
            color: Colors.text.primary,
            fontSize: 20,
            fontFamily: Fonts.bold,
            letterSpacing: -0.5,
          }}>
            {currentList.name}
          </Text>

          {/* Edit list button */}
          <TouchableOpacity onPress={() => setShowEdit(true)} style={{ marginRight: Spacing.sm }}>
            <Ionicons name="pencil-outline" size={20} color={Colors.text.muted} />
          </TouchableOpacity>

          {/* Clear checked */}
          {isChecklist && checked.length > 0 && (
            <TouchableOpacity onPress={handleClearChecked} style={{ marginRight: Spacing.sm }}>
              <Text style={{ color: Colors.danger, fontSize: 13, fontFamily: Fonts.semiBold }}>Clear</Text>
            </TouchableOpacity>
          )}

          <TouchableOpacity onPress={onClose}>
            <Ionicons name="close" size={24} color={Colors.text.muted} />
          </TouchableOpacity>
        </View>

        {/* Counter */}
        {isChecklist && currentList.items.filter((i) => i.item_type === "item").length > 0 && (
          <Text style={{
            color: Colors.text.muted,
            fontSize: 12,
            fontFamily: Fonts.semiBold,
            paddingHorizontal: Spacing.lg,
            paddingTop: Spacing.sm,
            paddingBottom: Spacing.xs,
          }}>
            {checked.length} of {itemsForIndex.length} checked
          </Text>
        )}

        {/* Items */}
        <FlatList
          data={[...unchecked, ...checked]}
          keyExtractor={(item) => item.id}
          renderItem={renderItem}
          contentContainerStyle={{ paddingHorizontal: Spacing.lg, paddingBottom: 160 }}
          keyboardShouldPersistTaps="handled"
          ListEmptyComponent={
            <View style={{ alignItems: "center", paddingTop: 60, gap: Spacing.sm }}>
              <Text style={{ color: Colors.text.muted, fontSize: 15 }}>Add your first item below</Text>
            </View>
          }
        />

        {/* Add item panel */}
        <View style={{
          borderTopWidth: 1,
          borderTopColor: Colors.border.subtle,
          backgroundColor: Colors.bg.surface,
          paddingHorizontal: Spacing.lg,
          paddingTop: Spacing.md,
          paddingBottom: Platform.OS === "ios" ? 36 : Spacing.md,
          gap: Spacing.sm,
        }}>
          {/* Extras (note, quantity, section toggle) */}
          {add.showExtras && (
            <View style={{ gap: Spacing.sm }}>
              <View style={{ flexDirection: "row", gap: Spacing.sm }}>
                <TextInput
                  style={{
                    flex: 1,
                    backgroundColor: Colors.bg.raised,
                    borderRadius: Radius.sm,
                    paddingHorizontal: Spacing.md,
                    paddingVertical: 8,
                    color: Colors.text.primary,
                    fontSize: 13,
                    borderWidth: 1,
                    borderColor: Colors.border.subtle,
                  }}
                  placeholder="Note (optional)"
                  placeholderTextColor={Colors.text.muted}
                  value={add.note}
                  onChangeText={(v) => setAdd((s) => ({ ...s, note: v }))}
                />
                <TextInput
                  style={{
                    width: 80,
                    backgroundColor: Colors.bg.raised,
                    borderRadius: Radius.sm,
                    paddingHorizontal: Spacing.sm,
                    paddingVertical: 8,
                    color: Colors.text.primary,
                    fontSize: 13,
                    borderWidth: 1,
                    borderColor: Colors.border.subtle,
                    textAlign: "center",
                  }}
                  placeholder="Qty"
                  placeholderTextColor={Colors.text.muted}
                  value={add.quantity}
                  onChangeText={(v) => setAdd((s) => ({ ...s, quantity: v }))}
                  keyboardType="default"
                />
              </View>
              <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between" }}>
                <Text style={{ color: Colors.text.secondary, fontSize: 13, fontFamily: Fonts.medium }}>
                  Section header
                </Text>
                <Switch
                  value={add.item_type === "section"}
                  onValueChange={(v) => setAdd((s) => ({ ...s, item_type: v ? "section" : "item" }))}
                  trackColor={{ false: Colors.bg.overlay, true: Colors.accentDim }}
                  thumbColor={add.item_type === "section" ? Colors.accent : Colors.text.muted}
                />
              </View>
            </View>
          )}

          {/* Main input row */}
          <View style={{ flexDirection: "row", alignItems: "center", gap: Spacing.sm }}>
            {/* Options toggle */}
            <TouchableOpacity
              onPress={() => setAdd((s) => ({ ...s, showExtras: !s.showExtras }))}
              style={{
                width: 36,
                height: 36,
                borderRadius: Radius.full,
                backgroundColor: add.showExtras ? Colors.accentSoft : Colors.bg.overlay,
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <Ionicons
                name="ellipsis-horizontal"
                size={16}
                color={add.showExtras ? Colors.accent : Colors.text.muted}
              />
            </TouchableOpacity>

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
              placeholder={add.item_type === "section" ? "Section name..." : "Add an item..."}
              placeholderTextColor={Colors.text.muted}
              value={add.text}
              onChangeText={(v) => setAdd((s) => ({ ...s, text: v }))}
              onSubmitEditing={handleAddItem}
              returnKeyType="done"
              blurOnSubmit={false}
            />

            <TouchableOpacity
              onPress={handleAddItem}
              disabled={!add.text.trim()}
              style={{
                backgroundColor: add.text.trim() ? Colors.accent : Colors.bg.overlay,
                width: 40,
                height: 40,
                borderRadius: Radius.full,
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <Ionicons name="add" size={22} color={add.text.trim() ? "#000" : Colors.text.muted} />
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardAvoidingView>

      {/* Edit item sheet */}
      <Modal visible={!!editItem} transparent animationType="slide" onRequestClose={() => setEditItem(null)}>
        <TouchableOpacity
          style={{ flex: 1, backgroundColor: "rgba(0,0,0,0.5)", justifyContent: "flex-end" }}
          activeOpacity={1}
          onPress={() => setEditItem(null)}
        >
          <TouchableOpacity
            activeOpacity={1}
            style={{
              backgroundColor: Colors.bg.surface,
              borderTopLeftRadius: 24,
              borderTopRightRadius: 24,
              padding: Spacing.lg,
              paddingBottom: Platform.OS === "ios" ? 40 : Spacing.lg,
              gap: Spacing.md,
            }}
          >
            <View style={{ alignItems: "center", marginBottom: Spacing.xs }}>
              <View style={{ width: 40, height: 4, borderRadius: 2, backgroundColor: Colors.border.subtle }} />
            </View>
            <Text style={{ color: Colors.text.primary, fontSize: 17, fontFamily: Fonts.bold }}>Edit Item</Text>
            <TextInput
              style={{
                backgroundColor: Colors.bg.raised,
                borderRadius: Radius.md,
                paddingHorizontal: Spacing.md,
                paddingVertical: 12,
                color: Colors.text.primary,
                fontSize: 15,
                borderWidth: 1.5,
                borderColor: Colors.border.subtle,
              }}
              value={editText}
              onChangeText={setEditText}
              placeholder="Item text"
              placeholderTextColor={Colors.text.muted}
              autoFocus
            />
            {editItem?.item_type !== "section" && (
              <>
                <TextInput
                  style={{
                    backgroundColor: Colors.bg.raised,
                    borderRadius: Radius.md,
                    paddingHorizontal: Spacing.md,
                    paddingVertical: 12,
                    color: Colors.text.primary,
                    fontSize: 15,
                    borderWidth: 1.5,
                    borderColor: Colors.border.subtle,
                  }}
                  value={editNote}
                  onChangeText={setEditNote}
                  placeholder="Note (optional)"
                  placeholderTextColor={Colors.text.muted}
                />
                <TextInput
                  style={{
                    backgroundColor: Colors.bg.raised,
                    borderRadius: Radius.md,
                    paddingHorizontal: Spacing.md,
                    paddingVertical: 12,
                    color: Colors.text.primary,
                    fontSize: 15,
                    borderWidth: 1.5,
                    borderColor: Colors.border.subtle,
                  }}
                  value={editQty}
                  onChangeText={setEditQty}
                  placeholder="Quantity (e.g. 2, 500g)"
                  placeholderTextColor={Colors.text.muted}
                />
              </>
            )}
            <View style={{ flexDirection: "row", gap: Spacing.sm }}>
              <TouchableOpacity
                onPress={() => setEditItem(null)}
                style={{
                  flex: 1,
                  padding: 14,
                  borderRadius: Radius.full,
                  backgroundColor: Colors.bg.raised,
                  alignItems: "center",
                }}
              >
                <Text style={{ color: Colors.text.secondary, fontFamily: Fonts.semiBold }}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={handleSaveEditItem}
                style={{
                  flex: 1,
                  padding: 14,
                  borderRadius: Radius.full,
                  backgroundColor: Colors.accent,
                  alignItems: "center",
                }}
              >
                <Text style={{ color: "#000", fontFamily: Fonts.bold }}>Save</Text>
              </TouchableOpacity>
            </View>
          </TouchableOpacity>
        </TouchableOpacity>
      </Modal>

      {/* Edit list modal */}
      <CreateListModal
        visible={showEdit}
        onClose={() => setShowEdit(false)}
        editId={currentList.id}
        defaultName={currentList.name}
        defaultEmoji={currentList.emoji}
        defaultColor={currentList.color}
        defaultType={currentList.list_type}
      />
    </Modal>
  );
}
