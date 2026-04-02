import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  Alert,
  StatusBar,
  TextInput,
} from "react-native";
import { useEffect, useState } from "react";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useListStore } from "@/store/listStore";
import { useColors, Fonts, Spacing, Radius } from "@/constants/theme";
import type { ShoppingList } from "@/types";
import { LIST_RESET_LABELS } from "@/lib/recurrence";
import CreateListModal from "@/components/lists/CreateListModal";
import ListDetailModal from "@/components/lists/ListDetailModal";

export default function ListsScreen() {
  const Colors = useColors();
  const { lists, isLoading, fetchLists, deleteList, toggleStar } = useListStore();
  const [refreshing, setRefreshing] = useState(false);
  const [showCreate, setShowCreate] = useState(false);
  const [selectedList, setSelectedList] = useState<ShoppingList | null>(null);
  const [query, setQuery] = useState("");
  const [searchFocused, setSearchFocused] = useState(false);

  useEffect(() => { fetchLists(); }, []);

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchLists();
    setRefreshing(false);
  };

  const handleDelete = (list: ShoppingList) => {
    Alert.alert(
      `Delete "${list.name}"?`,
      "This will permanently delete the list and all its items.",
      [
        { text: "Cancel", style: "cancel" },
        { text: "Delete", style: "destructive", onPress: () => deleteList(list.id) },
      ]
    );
  };

  const filtered = query.trim()
    ? lists.filter(
        (l) =>
          l.name.toLowerCase().includes(query.toLowerCase()) ||
          l.items.some((i) => i.text.toLowerCase().includes(query.toLowerCase()))
      )
    : lists;

  const starred = filtered.filter((l) => l.is_starred);
  const unstarred = filtered.filter((l) => !l.is_starred);

  const checkedCount = (l: ShoppingList) => l.items.filter((i) => i.is_checked && i.item_type === "item").length;
  const totalCount = (l: ShoppingList) => l.items.filter((i) => i.item_type === "item").length;

  const handleLongPress = (list: ShoppingList) => {
    Alert.alert(list.name, undefined, [
      { text: "Delete", style: "destructive", onPress: () => handleDelete(list) },
      { text: "Cancel", style: "cancel" },
    ]);
  };

  const renderCard = (list: ShoppingList) => {
    const checked = checkedCount(list);
    const total = totalCount(list);
    const progress = total > 0 ? checked / total : 0;
    const uncheckedItems = list.items.filter((i) => !i.is_checked && i.item_type === "item");
    const previewItem = uncheckedItems[0];

    return (
      <TouchableOpacity
        key={list.id}
        onPress={() => setSelectedList(list)}
        onLongPress={() => handleLongPress(list)}
        activeOpacity={0.8}
        delayLongPress={400}
        style={{
          backgroundColor: Colors.bg.surface,
          borderRadius: Radius.lg,
          padding: Spacing.lg,
          borderWidth: 1,
          borderColor: list.is_starred ? Colors.accentBorder : Colors.border.subtle,
        }}
      >
        <View style={{ flexDirection: "row", alignItems: "center", gap: Spacing.sm }}>
          <Text style={{ fontSize: 26 }}>{list.emoji}</Text>
          <View style={{ flex: 1 }}>
            <Text style={{
              color: Colors.text.primary,
              fontSize: 16,
              fontFamily: Fonts.bold,
              letterSpacing: -0.3,
            }}>
              {list.name}
            </Text>
            <Text style={{ color: Colors.text.muted, fontSize: 12, marginTop: 2 }}>
              {total === 0
                ? "Empty"
                : checked === total && total > 0
                  ? "All done ✓"
                  : `${checked} / ${total} done`}
              {list.list_type !== "checklist" && (
                <Text style={{ color: Colors.text.muted }}> · {list.list_type}</Text>
              )}
            </Text>
          </View>

          {/* Recurrence badge */}
          {list.recurrence_rule && (
            <View style={{
              flexDirection: "row",
              alignItems: "center",
              gap: 3,
              backgroundColor: Colors.accentSoft,
              paddingHorizontal: 7,
              paddingVertical: 3,
              borderRadius: Radius.full,
            }}>
              <Ionicons name="refresh-outline" size={11} color={Colors.accent} />
              <Text style={{ color: Colors.accent, fontSize: 11, fontFamily: Fonts.semiBold }}>
                {LIST_RESET_LABELS[list.recurrence_rule]}
              </Text>
            </View>
          )}

          {/* Star button */}
          <TouchableOpacity
            onPress={() => toggleStar(list.id)}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <Ionicons
              name={list.is_starred ? "star" : "star-outline"}
              size={18}
              color={list.is_starred ? Colors.warning : Colors.text.muted}
            />
          </TouchableOpacity>
        </View>

        {/* Progress bar */}
        {total > 0 && list.list_type === "checklist" && (
          <View style={{
            height: 3,
            backgroundColor: Colors.bg.overlay,
            borderRadius: Radius.full,
            overflow: "hidden",
            marginTop: Spacing.sm,
          }}>
            <View style={{
              height: 3,
              width: `${progress * 100}%`,
              backgroundColor: progress === 1 ? Colors.accent : Colors.accentDim,
              borderRadius: Radius.full,
            }} />
          </View>
        )}

        {/* Single item preview */}
        {previewItem && (
          <Text
            numberOfLines={1}
            style={{ color: Colors.text.secondary, fontSize: 13, marginTop: 6 }}
          >
            {list.list_type === "numbered"
              ? `1. ${previewItem.text}`
              : list.list_type === "bulleted"
                ? `• ${previewItem.text}`
                : `· ${previewItem.text}`}
            {uncheckedItems.length > 1
              ? <Text style={{ color: Colors.text.muted }}>{" "}+{uncheckedItems.length - 1} more</Text>
              : null}
          </Text>
        )}
      </TouchableOpacity>
    );
  };

  const hasLists = lists.length > 0;

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: Colors.bg.app }}>
      <StatusBar barStyle={Colors.statusBar as any} />

      {/* Header — only shown when lists exist */}
      {hasLists && (
        <View style={{
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "space-between",
          paddingHorizontal: Spacing.lg,
          paddingTop: Spacing.sm,
          paddingBottom: Spacing.sm,
        }}>
          <Text style={{
            color: Colors.text.primary,
            fontSize: 28,
            fontFamily: Fonts.extraBold,
            letterSpacing: -0.8,
          }}>
            Lists
          </Text>
        </View>
      )}

      {/* Search bar — only shown when lists exist */}
      {hasLists && (
        <View style={{
          flexDirection: "row",
          alignItems: "center",
          marginHorizontal: Spacing.lg,
          marginBottom: Spacing.md,
          backgroundColor: Colors.bg.surface,
          borderRadius: Radius.md,
          borderWidth: 1.5,
          borderColor: searchFocused ? Colors.accentBorder : Colors.border.subtle,
          paddingHorizontal: Spacing.md,
          gap: Spacing.sm,
        }}>
          <Ionicons name="search" size={16} color={Colors.text.muted} />
          <TextInput
            style={{
              flex: 1,
              color: Colors.text.primary,
              fontSize: 15,
              fontFamily: Fonts.regular,
              paddingVertical: 10,
            }}
            placeholder="Search lists and items..."
            placeholderTextColor={Colors.text.muted}
            value={query}
            onChangeText={setQuery}
            onFocus={() => setSearchFocused(true)}
            onBlur={() => setSearchFocused(false)}
            clearButtonMode="while-editing"
          />
          {query.length > 0 && (
            <TouchableOpacity onPress={() => setQuery("")}>
              <Ionicons name="close-circle" size={16} color={Colors.text.muted} />
            </TouchableOpacity>
          )}
        </View>
      )}

      {/* Empty state — centered CTA */}
      {!hasLists && !isLoading && (
        <View style={{ flex: 1, alignItems: "center", justifyContent: "center", paddingHorizontal: 40, gap: Spacing.md }}>
          <Text style={{ fontSize: 56 }}>📋</Text>
          <Text style={{ color: Colors.text.primary, fontSize: 22, fontFamily: Fonts.extraBold, textAlign: "center", letterSpacing: -0.5 }}>
            Your lists live here
          </Text>
          <Text style={{ color: Colors.text.muted, fontSize: 15, textAlign: "center", lineHeight: 22 }}>
            Grocery runs, to-dos, anything you want to share with your household.
          </Text>
          <TouchableOpacity
            onPress={() => setShowCreate(true)}
            style={{
              marginTop: Spacing.sm,
              backgroundColor: Colors.accent,
              borderRadius: 9999,
              paddingVertical: 16,
              paddingHorizontal: 32,
              alignItems: "center",
            }}
          >
            <Text style={{ color: Colors.text.inverse, fontFamily: Fonts.bold, fontSize: 16 }}>
              + Create your first list
            </Text>
          </TouchableOpacity>
        </View>
      )}

      {/* List content */}
      {hasLists && (
        <ScrollView
          contentContainerStyle={{ paddingHorizontal: Spacing.lg, paddingBottom: 16, gap: Spacing.md }}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Colors.accent} />}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {starred.length > 0 && (
            <>
              <View style={{ flexDirection: "row", alignItems: "center", gap: Spacing.xs }}>
                <Ionicons name="star" size={13} color={Colors.warning} />
                <Text style={{ color: Colors.text.muted, fontSize: 11, fontFamily: Fonts.semiBold }}>STARRED</Text>
              </View>
              {starred.map(renderCard)}
              {unstarred.length > 0 && (
                <View style={{ flexDirection: "row", alignItems: "center", gap: Spacing.xs, marginTop: Spacing.xs }}>
                  <Text style={{ color: Colors.text.muted, fontSize: 11, fontFamily: Fonts.semiBold }}>ALL LISTS</Text>
                </View>
              )}
            </>
          )}

          {unstarred.map(renderCard)}

          {filtered.length === 0 && query.length > 0 && (
            <View style={{ alignItems: "center", paddingTop: 60, gap: Spacing.sm }}>
              <Text style={{ fontSize: 44 }}>🔍</Text>
              <Text style={{ color: Colors.text.primary, fontSize: 17, fontFamily: Fonts.bold }}>No results</Text>
              <Text style={{ color: Colors.text.muted, fontSize: 14 }}>Nothing matched "{query}"</Text>
            </View>
          )}
        </ScrollView>
      )}

      {/* FAB — only shown when lists exist */}
      {hasLists && (
        <View style={{ paddingHorizontal: Spacing.lg, paddingTop: 8, paddingBottom: 16 }}>
          <TouchableOpacity
            onPress={() => setShowCreate(true)}
            style={{
              backgroundColor: Colors.accent,
              borderRadius: 9999,
              paddingVertical: 15,
              alignItems: "center",
              flexDirection: "row",
              justifyContent: "center",
              gap: 6,
            }}
          >
            <Ionicons name="add" size={20} color={Colors.text.inverse} />
            <Text style={{ color: Colors.text.inverse, fontFamily: Fonts.bold, fontSize: 15 }}>New List</Text>
          </TouchableOpacity>
        </View>
      )}

      <CreateListModal visible={showCreate} onClose={() => setShowCreate(false)} />

      {selectedList && (
        <ListDetailModal
          list={selectedList}
          onClose={() => setSelectedList(null)}
        />
      )}
    </SafeAreaView>
  );
}
