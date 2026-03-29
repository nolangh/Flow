import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  Alert,
  StatusBar,
} from "react-native";
import { useEffect, useState } from "react";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useListStore } from "@/store/listStore";
import { useColors, Fonts, Spacing, Radius } from "@/constants/theme";
import type { ShoppingList } from "@/types";
import CreateListModal from "@/components/lists/CreateListModal";
import ListDetailModal from "@/components/lists/ListDetailModal";

export default function ListsScreen() {
  const Colors = useColors();
  const { lists, isLoading, fetchLists, deleteList } = useListStore();
  const [refreshing, setRefreshing] = useState(false);
  const [showCreate, setShowCreate] = useState(false);
  const [selectedList, setSelectedList] = useState<ShoppingList | null>(null);

  useEffect(() => { fetchLists(); }, []);

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchLists();
    setRefreshing(false);
  };

  const handleDeleteList = (list: ShoppingList) => {
    Alert.alert(
      `Delete "${list.name}"?`,
      "This will delete the list and all its items.",
      [
        { text: "Cancel", style: "cancel" },
        { text: "Delete", style: "destructive", onPress: () => deleteList(list.id) },
      ]
    );
  };

  const checkedCount = (list: ShoppingList) => list.items.filter((i) => i.is_checked).length;
  const totalCount = (list: ShoppingList) => list.items.length;

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: Colors.bg.app }}>
      <StatusBar barStyle={Colors.statusBar as any} />

      {/* Header */}
      <View style={{
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        paddingHorizontal: Spacing.lg,
        paddingTop: Spacing.sm,
        paddingBottom: Spacing.md,
      }}>
        <Text style={{
          color: Colors.text.primary,
          fontSize: 28,
          fontFamily: Fonts.extraBold,
          letterSpacing: -0.8,
        }}>
          Lists
        </Text>
        <TouchableOpacity
          onPress={() => setShowCreate(true)}
          style={{
            backgroundColor: Colors.accent,
            width: 36,
            height: 36,
            borderRadius: Radius.full,
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <Ionicons name="add" size={22} color="#000" />
        </TouchableOpacity>
      </View>

      <ScrollView
        contentContainerStyle={{ paddingHorizontal: Spacing.lg, paddingBottom: 100, gap: Spacing.md }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Colors.accent} />}
        showsVerticalScrollIndicator={false}
      >
        {lists.length === 0 && !isLoading && (
          <View style={{ alignItems: "center", paddingTop: 80, gap: Spacing.sm }}>
            <Text style={{ fontSize: 48 }}>📋</Text>
            <Text style={{ color: Colors.text.primary, fontSize: 18, fontFamily: Fonts.bold }}>
              No lists yet
            </Text>
            <Text style={{ color: Colors.text.muted, fontSize: 14, textAlign: "center", lineHeight: 20 }}>
              Tap the + button to create your first shared list
            </Text>
          </View>
        )}

        {lists.map((list) => {
          const checked = checkedCount(list);
          const total = totalCount(list);
          const progress = total > 0 ? checked / total : 0;

          return (
            <TouchableOpacity
              key={list.id}
              onPress={() => setSelectedList(list)}
              onLongPress={() => handleDeleteList(list)}
              activeOpacity={0.8}
              style={{
                backgroundColor: Colors.bg.surface,
                borderRadius: Radius.lg,
                padding: Spacing.lg,
                borderWidth: 1,
                borderColor: Colors.border.subtle,
              }}
            >
              {/* Top row */}
              <View style={{ flexDirection: "row", alignItems: "center", gap: Spacing.sm, marginBottom: Spacing.sm }}>
                <Text style={{ fontSize: 28 }}>{list.emoji}</Text>
                <View style={{ flex: 1 }}>
                  <Text style={{
                    color: Colors.text.primary,
                    fontSize: 17,
                    fontFamily: Fonts.bold,
                    letterSpacing: -0.3,
                  }}>
                    {list.name}
                  </Text>
                  <Text style={{ color: Colors.text.muted, fontSize: 12, marginTop: 2 }}>
                    {total === 0
                      ? "No items"
                      : checked === total
                        ? "All done ✓"
                        : `${checked} of ${total} checked`}
                  </Text>
                </View>
                <Ionicons name="chevron-forward" size={16} color={Colors.text.muted} />
              </View>

              {/* Progress bar */}
              {total > 0 && (
                <View style={{
                  height: 3,
                  backgroundColor: Colors.bg.overlay,
                  borderRadius: Radius.full,
                  overflow: "hidden",
                }}>
                  <View style={{
                    height: 3,
                    width: `${progress * 100}%`,
                    backgroundColor: progress === 1 ? Colors.accent : Colors.accentDim,
                    borderRadius: Radius.full,
                  }} />
                </View>
              )}

              {/* Preview first 3 unchecked items */}
              {list.items.filter((i) => !i.is_checked).slice(0, 3).map((item) => (
                <Text
                  key={item.id}
                  numberOfLines={1}
                  style={{
                    color: Colors.text.secondary,
                    fontSize: 13,
                    marginTop: Spacing.xs,
                  }}
                >
                  · {item.text}
                </Text>
              ))}
              {list.items.filter((i) => !i.is_checked).length > 3 && (
                <Text style={{ color: Colors.text.muted, fontSize: 12, marginTop: 2 }}>
                  +{list.items.filter((i) => !i.is_checked).length - 3} more
                </Text>
              )}
            </TouchableOpacity>
          );
        })}
      </ScrollView>

      <CreateListModal
        visible={showCreate}
        onClose={() => setShowCreate(false)}
      />

      {selectedList && (
        <ListDetailModal
          list={selectedList}
          onClose={() => setSelectedList(null)}
        />
      )}
    </SafeAreaView>
  );
}
