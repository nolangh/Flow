import {
  View, Text, ScrollView, TouchableOpacity, Modal, TextInput,
  Alert, Platform, StatusBar, RefreshControl,
} from "react-native";
import { useState, useEffect } from "react";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { Colors, Fonts, pillShadow } from "@/constants/theme";
import { useGoalsStore, type Goal } from "@/store/goalsStore";
import { formatCurrency } from "@/lib/utils";
import ProgressBar from "@/components/ui/ProgressBar";
import Button from "@/components/ui/Button";
import EmptyState from "@/components/ui/EmptyState";

const GOAL_COLORS = [
  "#00D632", "#3b82f6", "#8b5cf6", "#f59e0b", "#ef4444", "#06b6d4", "#ec4899",
];

const GOAL_EMOJIS = ["🎯", "🏠", "🚗", "✈️", "💍", "🎓", "📱", "💪", "🌴", "🐕", "🎸", "⛵"];

function GoalCard({ goal, onContribute, onDelete }: {
  goal: Goal;
  onContribute: (id: string) => void;
  onDelete: (id: string) => void;
}) {
  const pct = goal.target_amount > 0 ? (goal.current_amount / goal.target_amount) * 100 : 0;
  const remaining = goal.target_amount - goal.current_amount;

  return (
    <View style={{
      backgroundColor: Colors.bg.surface, borderRadius: 20, padding: 18,
      borderWidth: 1, borderColor: goal.is_completed ? Colors.accentBorder : Colors.border.subtle,
      gap: 14,
    }}>
      {/* Top row */}
      <View style={{ flexDirection: "row", alignItems: "flex-start", gap: 12 }}>
        <View style={{
          width: 48, height: 48, borderRadius: 24,
          backgroundColor: goal.color + "22",
          alignItems: "center", justifyContent: "center",
          borderWidth: 1.5, borderColor: goal.color + "44",
        }}>
          <Text style={{ fontSize: 22 }}>{goal.emoji}</Text>
        </View>
        <View style={{ flex: 1 }}>
          <Text style={{ color: Colors.text.primary, fontSize: 16, fontFamily: Fonts.bold }} numberOfLines={1}>
            {goal.name}
          </Text>
          {goal.deadline && (
            <Text style={{ color: Colors.text.muted, fontSize: 12, marginTop: 2 }}>
              Target: {new Date(goal.deadline).toLocaleDateString("en-US", { month: "short", year: "numeric" })}
            </Text>
          )}
        </View>
        {goal.is_completed ? (
          <View style={{
            backgroundColor: Colors.accentSoft, borderRadius: 12,
            paddingHorizontal: 10, paddingVertical: 4, borderWidth: 1, borderColor: Colors.accentBorder,
            flexDirection: "row", alignItems: "center", gap: 4,
          }}>
            <Ionicons name="checkmark-circle" size={12} color={Colors.accent} />
            <Text style={{ color: Colors.accent, fontSize: 11, fontFamily: Fonts.bold }}>Done!</Text>
          </View>
        ) : (
          <TouchableOpacity
            onPress={() => Alert.alert("Delete Goal", `Delete "${goal.name}"?`, [
              { text: "Cancel", style: "cancel" },
              { text: "Delete", style: "destructive", onPress: () => onDelete(goal.id) },
            ])}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            style={{
              width: 28, height: 28, borderRadius: 14, backgroundColor: Colors.bg.overlay,
              alignItems: "center", justifyContent: "center",
            }}
          >
            <Ionicons name="close" size={14} color={Colors.text.muted} />
          </TouchableOpacity>
        )}
      </View>

      {/* Progress */}
      <View style={{ gap: 8 }}>
        <View style={{ flexDirection: "row", justifyContent: "space-between" }}>
          <Text style={{ color: goal.color, fontSize: 20, fontFamily: Fonts.extraBold }}>
            {formatCurrency(goal.current_amount)}
          </Text>
          <Text style={{ color: Colors.text.muted, fontSize: 14, alignSelf: "flex-end" }}>
            / {formatCurrency(goal.target_amount)}
          </Text>
        </View>
        <ProgressBar spent={goal.current_amount} limit={goal.target_amount} height={8} color={goal.color} />
        <View style={{ flexDirection: "row", justifyContent: "space-between" }}>
          <Text style={{ color: Colors.text.muted, fontSize: 12 }}>{pct.toFixed(0)}% complete</Text>
          {!goal.is_completed && (
            <Text style={{ color: Colors.text.muted, fontSize: 12 }}>{formatCurrency(remaining)} to go</Text>
          )}
        </View>
      </View>

      {/* Contribute button */}
      {!goal.is_completed && (
        <TouchableOpacity
          onPress={() => onContribute(goal.id)}
          style={{
            backgroundColor: Colors.accentSoft, borderRadius: 12, padding: 12,
            borderWidth: 1, borderColor: Colors.accentBorder,
            flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 6,
          }}
        >
          <Ionicons name="add-circle-outline" size={16} color={Colors.accent} />
          <Text style={{ color: Colors.accent, fontSize: 13, fontFamily: Fonts.bold }}>Add Funds</Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

export default function GoalsScreen() {
  const { goals, isLoading, fetchGoals, createGoal, addContribution, deleteGoal } = useGoalsStore();
  const [refreshing, setRefreshing] = useState(false);
  const [showAdd, setShowAdd] = useState(false);
  const [showContribute, setShowContribute] = useState<string | null>(null);
  const [contributeAmount, setContributeAmount] = useState("");

  // New goal form state
  const [name, setName] = useState("");
  const [emoji, setEmoji] = useState("🎯");
  const [targetAmount, setTargetAmount] = useState("");
  const [deadline, setDeadline] = useState("");
  const [color, setColor] = useState(GOAL_COLORS[0]);
  const [saving, setSaving] = useState(false);

  useEffect(() => { fetchGoals(); }, []);

  const onRefresh = async () => { setRefreshing(true); await fetchGoals(); setRefreshing(false); };

  const resetForm = () => {
    setName(""); setEmoji("🎯"); setTargetAmount(""); setDeadline(""); setColor(GOAL_COLORS[0]);
  };

  const handleAdd = async () => {
    if (!name.trim()) return Alert.alert("Enter a goal name.");
    const amount = parseFloat(targetAmount);
    if (!amount || amount <= 0) return Alert.alert("Enter a valid target amount.");

    setSaving(true);
    try {
      await createGoal({
        name: name.trim(),
        emoji,
        target_amount: amount,
        deadline: deadline.trim() || null,
        color,
      });
      resetForm();
      setShowAdd(false);
    } catch (err: unknown) {
      Alert.alert("Error", (err as Error).message);
    } finally {
      setSaving(false);
    }
  };

  const handleContribute = async () => {
    if (!showContribute) return;
    const amount = parseFloat(contributeAmount);
    if (!amount || amount <= 0) return Alert.alert("Enter a valid amount.");
    try {
      await addContribution(showContribute, amount);
      setContributeAmount("");
      setShowContribute(null);
    } catch (err: unknown) {
      Alert.alert("Error", (err as Error).message);
    }
  };

  const totalSaved = goals.reduce((s, g) => s + g.current_amount, 0);
  const totalTarget = goals.reduce((s, g) => s + g.target_amount, 0);
  const completedCount = goals.filter((g) => g.is_completed).length;

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: "#000" }} edges={["top"]}>
      <StatusBar barStyle="light-content" />

      {/* Header */}
      <View style={{
        flexDirection: "row", justifyContent: "space-between",
        alignItems: "center", paddingHorizontal: 20, paddingTop: 14, paddingBottom: 16,
      }}>
        <Text style={{ color: Colors.text.primary, fontSize: 26, fontFamily: Fonts.extraBold, letterSpacing: -0.5 }}>
          Goals
        </Text>
        <TouchableOpacity
          onPress={() => setShowAdd(true)}
          style={{
            backgroundColor: Colors.accent, borderRadius: 20,
            paddingHorizontal: 16, paddingVertical: 8,
            ...pillShadow(Colors.accent),
          }}
        >
          <Text style={{ color: "#000", fontSize: 13, fontFamily: Fonts.bold }}>+ New Goal</Text>
        </TouchableOpacity>
      </View>

      {/* Summary strip */}
      {goals.length > 0 && (
        <View style={{ marginHorizontal: 20, marginBottom: 16 }}>
          <View style={{
            backgroundColor: Colors.bg.surface, borderRadius: 18, padding: 16,
            borderWidth: 1, borderColor: Colors.border.subtle,
            flexDirection: "row", justifyContent: "space-between",
          }}>
            {[
              { label: "Total Saved", value: formatCurrency(totalSaved), color: Colors.accent },
              { label: "Total Target", value: formatCurrency(totalTarget), color: Colors.text.secondary },
              { label: "Completed", value: `${completedCount}/${goals.length}`, color: completedCount > 0 ? Colors.accent : Colors.text.muted },
            ].map(({ label, value, color: c }) => (
              <View key={label} style={{ alignItems: "center" }}>
                <Text style={{ color: Colors.text.muted, fontSize: 11, marginBottom: 4 }}>{label}</Text>
                <Text style={{ color: c, fontSize: 16, fontFamily: Fonts.bold }}>{value}</Text>
              </View>
            ))}
          </View>
        </View>
      )}

      <ScrollView
        contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 100, gap: 14 }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Colors.accent} />}
        showsVerticalScrollIndicator={false}
      >
        {!isLoading && goals.length === 0 && (
          <View style={{ paddingTop: 40 }}>
            <EmptyState
              title="No goals yet"
              subtitle="Set a savings goal — house, vacation, new car — and track your progress here."
              icon="target"
            />
            <TouchableOpacity
              onPress={() => setShowAdd(true)}
              style={{
                backgroundColor: Colors.accent, borderRadius: 14, padding: 16,
                alignItems: "center", marginTop: 20,
                ...pillShadow(Colors.accent),
              }}
            >
              <Text style={{ color: "#000", fontSize: 15, fontFamily: Fonts.bold }}>Create my first goal</Text>
            </TouchableOpacity>
          </View>
        )}

        {goals
          .sort((a, b) => (a.is_completed ? 1 : 0) - (b.is_completed ? 1 : 0))
          .map((goal) => (
            <GoalCard
              key={goal.id}
              goal={goal}
              onContribute={setShowContribute}
              onDelete={deleteGoal}
            />
          ))}
      </ScrollView>

      {/* Add goal modal */}
      <Modal visible={showAdd} transparent animationType="slide" onRequestClose={() => { setShowAdd(false); resetForm(); }}>
        <View style={{ flex: 1, justifyContent: "flex-end", backgroundColor: "rgba(0,0,0,0.6)" }}>
          <ScrollView style={{ maxHeight: "90%" }} keyboardShouldPersistTaps="handled">
            <View style={{
              backgroundColor: Colors.bg.raised, borderTopLeftRadius: 28, borderTopRightRadius: 28,
              borderTopWidth: 1, borderColor: Colors.border.subtle,
              padding: 24, paddingBottom: Platform.OS === "ios" ? 44 : 28, gap: 16,
            }}>
              <View style={{ alignItems: "center", marginTop: -8, marginBottom: 4 }}>
                <View style={{ width: 40, height: 4, borderRadius: 2, backgroundColor: Colors.border.subtle }} />
              </View>
              <Text style={{ color: Colors.text.primary, fontSize: 20, fontFamily: Fonts.bold }}>New Goal</Text>

              {/* Emoji picker */}
              <View>
                <Text style={{ color: Colors.text.muted, fontSize: 11, fontFamily: Fonts.semiBold, textTransform: "uppercase", letterSpacing: 0.8, marginBottom: 8 }}>
                  Pick an emoji
                </Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                  <View style={{ flexDirection: "row", gap: 8 }}>
                    {GOAL_EMOJIS.map((e) => (
                      <TouchableOpacity
                        key={e}
                        onPress={() => setEmoji(e)}
                        style={{
                          width: 44, height: 44, borderRadius: 22, alignItems: "center", justifyContent: "center",
                          backgroundColor: emoji === e ? Colors.accentSoft : Colors.bg.surface,
                          borderWidth: 1.5, borderColor: emoji === e ? Colors.accentBorder : Colors.border.subtle,
                        }}
                      >
                        <Text style={{ fontSize: 22 }}>{e}</Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </ScrollView>
              </View>

              {/* Goal name */}
              <TextInput
                style={{ backgroundColor: Colors.bg.surface, borderRadius: 14, padding: 16, color: Colors.text.primary, borderWidth: 1.5, borderColor: Colors.border.subtle, fontSize: 15 }}
                placeholder="Goal name (e.g. Europe Trip)"
                placeholderTextColor={Colors.text.muted}
                value={name}
                onChangeText={setName}
              />

              {/* Target amount */}
              <TextInput
                style={{ backgroundColor: Colors.bg.surface, borderRadius: 14, padding: 16, color: Colors.text.primary, borderWidth: 1.5, borderColor: Colors.border.subtle, fontSize: 15 }}
                placeholder="Target amount (e.g. 5000)"
                placeholderTextColor={Colors.text.muted}
                value={targetAmount}
                onChangeText={setTargetAmount}
                keyboardType="decimal-pad"
              />

              {/* Deadline */}
              <TextInput
                style={{ backgroundColor: Colors.bg.surface, borderRadius: 14, padding: 16, color: Colors.text.primary, borderWidth: 1.5, borderColor: Colors.border.subtle, fontSize: 15 }}
                placeholder="Deadline (optional, e.g. 2026-12-01)"
                placeholderTextColor={Colors.text.muted}
                value={deadline}
                onChangeText={setDeadline}
              />

              {/* Color picker */}
              <View>
                <Text style={{ color: Colors.text.muted, fontSize: 11, fontFamily: Fonts.semiBold, textTransform: "uppercase", letterSpacing: 0.8, marginBottom: 8 }}>
                  Color
                </Text>
                <View style={{ flexDirection: "row", gap: 10 }}>
                  {GOAL_COLORS.map((c) => (
                    <TouchableOpacity
                      key={c}
                      onPress={() => setColor(c)}
                      style={{
                        width: 32, height: 32, borderRadius: 16, backgroundColor: c,
                        alignItems: "center", justifyContent: "center",
                        borderWidth: color === c ? 2.5 : 0, borderColor: "#fff",
                      }}
                    >
                      {color === c && <Ionicons name="checkmark" size={14} color="#000" />}
                    </TouchableOpacity>
                  ))}
                </View>
              </View>

              <View style={{ flexDirection: "row", gap: 10 }}>
                <Button label="Cancel" variant="ghost" onPress={() => { setShowAdd(false); resetForm(); }} style={{ flex: 1 }} />
                <Button label="Create Goal" variant="primary" loading={saving} onPress={handleAdd} style={{ flex: 1 }} />
              </View>
            </View>
          </ScrollView>
        </View>
      </Modal>

      {/* Contribute modal */}
      <Modal visible={showContribute !== null} transparent animationType="slide" onRequestClose={() => setShowContribute(null)}>
        <View style={{ flex: 1, justifyContent: "flex-end", backgroundColor: "rgba(0,0,0,0.6)" }}>
          <View style={{
            backgroundColor: Colors.bg.raised, borderTopLeftRadius: 28, borderTopRightRadius: 28,
            borderTopWidth: 1, borderColor: Colors.border.subtle,
            padding: 24, paddingBottom: Platform.OS === "ios" ? 44 : 28, gap: 14,
          }}>
            <View style={{ alignItems: "center", marginTop: -8, marginBottom: 4 }}>
              <View style={{ width: 40, height: 4, borderRadius: 2, backgroundColor: Colors.border.subtle }} />
            </View>
            <Text style={{ color: Colors.text.primary, fontSize: 18, fontFamily: Fonts.bold }}>
              {goals.find((g) => g.id === showContribute)?.name ?? "Add Funds"}
            </Text>
            <TextInput
              style={{ backgroundColor: Colors.bg.surface, borderRadius: 14, padding: 16, color: Colors.text.primary, borderWidth: 1.5, borderColor: Colors.border.subtle, fontSize: 20, fontFamily: Fonts.bold, textAlign: "center" }}
              placeholder="$0.00"
              placeholderTextColor={Colors.text.muted}
              value={contributeAmount}
              onChangeText={setContributeAmount}
              keyboardType="decimal-pad"
              autoFocus
            />
            <View style={{ flexDirection: "row", gap: 10 }}>
              <Button label="Cancel" variant="ghost" onPress={() => { setShowContribute(null); setContributeAmount(""); }} style={{ flex: 1 }} />
              <Button label="Add Funds" variant="primary" onPress={handleContribute} style={{ flex: 1 }} />
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}
