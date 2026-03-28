import {
  View, Text, TextInput, TouchableOpacity,
  ScrollView, ActivityIndicator, Alert,
} from "react-native";
import { useState } from "react";
import { Ionicons } from "@expo/vector-icons";
import { Colors, pillShadow } from "@/constants/theme";
import { formatCurrency } from "@/lib/utils";
import { openaiConfigured, analyzeBudget, type AnalysisResult, type BudgetSuggestion } from "@/lib/openai";
import { useBudgetStore } from "@/store/budgetStore";
import Button from "@/components/ui/Button";

interface Props {
  onApplySuggestion?: (categoryName: string, newLimit: number) => Promise<void>;
  onApplyAll?: (suggestions: BudgetSuggestion[]) => Promise<void>;
}

const PRIORITY_SUGGESTIONS = [
  "Save more money overall",
  "Increase my food budget",
  "Cut discretionary spending",
  "Reduce fixed costs",
  "Build an emergency fund",
];

const PRIORITY_COLORS = {
  high: Colors.danger,
  medium: Colors.accent,
  low: Colors.text.muted,
};

export default function AiAnalysisSheet({ onApplySuggestion, onApplyAll }: Props) {
  const { categories, monthlyBudget } = useBudgetStore();
  const [priorityGoal, setPriorityGoal] = useState("");
  const [customGoal, setCustomGoal] = useState("");
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [applying, setApplying] = useState<string | null>(null);
  const [appliedAll, setAppliedAll] = useState(false);

  const handleAnalyze = async () => {
    if (!openaiConfigured) {
      Alert.alert(
        "AI Not Configured",
        "Add your OpenAI API key as EXPO_PUBLIC_OPENAI_API_KEY in Replit Secrets to enable AI analysis."
      );
      return;
    }

    const goal = customGoal.trim() || priorityGoal;
    setLoading(true);
    setResult(null);
    setAppliedAll(false);

    try {
      const catData = categories.map((c) => ({
        name: c.name,
        monthly_limit: c.monthly_limit,
        spent: monthlyBudget.find((m) => m.category_id === c.id)?.spent ?? 0,
        is_fixed: c.is_fixed ?? false,
        is_income: c.is_income ?? false,
      }));
      const analysis = await analyzeBudget(catData, goal || undefined);
      setResult(analysis);
    } catch (err: unknown) {
      Alert.alert("Analysis failed", (err as Error).message);
    } finally {
      setLoading(false);
    }
  };

  const handleApply = async (s: BudgetSuggestion) => {
    if (!onApplySuggestion) return;
    setApplying(s.category);
    try {
      await onApplySuggestion(s.category, s.suggestedLimit);
    } finally {
      setApplying(null);
    }
  };

  const handleApplyAll = async () => {
    if (!result || !onApplyAll) return;
    setApplying("all");
    try {
      await onApplyAll(result.suggestions);
      setAppliedAll(true);
    } finally {
      setApplying(null);
    }
  };

  return (
    <ScrollView
      style={{ flex: 1 }}
      contentContainerStyle={{ gap: 16, paddingBottom: 40 }}
      showsVerticalScrollIndicator={false}
    >
      {/* Header */}
      <View style={{ flexDirection: "row", alignItems: "center", gap: 10 }}>
        <View style={{
          width: 40, height: 40, borderRadius: 20,
          backgroundColor: Colors.accentSoft,
          alignItems: "center", justifyContent: "center",
        }}>
          <Ionicons name="sparkles" size={20} color={Colors.accent} />
        </View>
        <View>
          <Text style={{ color: Colors.text.primary, fontSize: 18, fontWeight: "700" }}>AI Budget Analysis</Text>
          <Text style={{ color: Colors.text.muted, fontSize: 12 }}>Powered by GPT-4o mini</Text>
        </View>
      </View>

      {/* Priority goal chips */}
      <View>
        <Text style={{ color: Colors.text.muted, fontSize: 11, fontWeight: "600", textTransform: "uppercase", letterSpacing: 0.8, marginBottom: 8 }}>
          What do you want to optimize?
        </Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 10 }}>
          <View style={{ flexDirection: "row", gap: 8 }}>
            {PRIORITY_SUGGESTIONS.map((s) => (
              <TouchableOpacity
                key={s}
                onPress={() => { setPriorityGoal(s === priorityGoal ? "" : s); setCustomGoal(""); }}
                style={{
                  paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20,
                  backgroundColor: priorityGoal === s ? Colors.accentSoft : Colors.bg.surface,
                  borderWidth: 1.5,
                  borderColor: priorityGoal === s ? Colors.accentBorder : Colors.border.subtle,
                }}
              >
                <Text style={{ color: priorityGoal === s ? Colors.accent : Colors.text.secondary, fontSize: 13, fontWeight: "600" }}>
                  {s}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </ScrollView>
        <TextInput
          style={{
            backgroundColor: Colors.bg.surface, borderRadius: 12, padding: 14,
            color: Colors.text.primary, borderWidth: 1.5, borderColor: Colors.border.subtle, fontSize: 14,
          }}
          placeholder="Or describe your goal… e.g. 'I eat out a lot, increase food budget'"
          placeholderTextColor={Colors.text.muted}
          value={customGoal}
          onChangeText={(t) => { setCustomGoal(t); setPriorityGoal(""); }}
          multiline
          numberOfLines={2}
        />
      </View>

      <Button
        label={loading ? "Analyzing…" : "Analyze My Budget"}
        variant="primary"
        onPress={handleAnalyze}
        loading={loading}
        icon={loading ? undefined : "sparkles"}
      />

      {/* Results */}
      {result && (
        <View style={{ gap: 12 }}>
          {/* Summary card */}
          <View style={{
            backgroundColor: Colors.bg.surface, borderRadius: 16, padding: 16,
            borderWidth: 1, borderColor: Colors.border.subtle,
          }}>
            <Text style={{ color: Colors.text.muted, fontSize: 11, fontWeight: "600", textTransform: "uppercase", letterSpacing: 0.8, marginBottom: 8 }}>
              Analysis Summary
            </Text>
            <Text style={{ color: Colors.text.primary, fontSize: 14, lineHeight: 20 }}>{result.summary}</Text>
            {result.topInsight && (
              <View style={{
                marginTop: 12, backgroundColor: Colors.accentSoft, borderRadius: 10,
                padding: 12, borderWidth: 1, borderColor: Colors.accentBorder,
                flexDirection: "row", gap: 8, alignItems: "flex-start",
              }}>
                <Ionicons name="bulb-outline" size={16} color={Colors.accent} style={{ marginTop: 1 }} />
                <Text style={{ color: Colors.accent, fontSize: 13, lineHeight: 18, flex: 1, fontWeight: "500" }}>
                  {result.topInsight}
                </Text>
              </View>
            )}
            {result.monthlyPotentialSavings > 0 && (
              <Text style={{ color: Colors.accent, fontSize: 13, fontWeight: "700", marginTop: 10 }}>
                Potential monthly savings: {formatCurrency(result.monthlyPotentialSavings)}
              </Text>
            )}
          </View>

          {/* Suggestions */}
          <Text style={{ color: Colors.text.muted, fontSize: 11, fontWeight: "600", textTransform: "uppercase", letterSpacing: 0.8 }}>
            Suggestions ({result.suggestions.length})
          </Text>

          {result.suggestions.map((s) => (
            <View
              key={s.category}
              style={{
                backgroundColor: Colors.bg.surface, borderRadius: 16, padding: 16,
                borderWidth: 1, borderColor: Colors.border.subtle, gap: 10,
              }}
            >
              <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start" }}>
                <View style={{ flex: 1, gap: 2 }}>
                  <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
                    <Text style={{ color: Colors.text.primary, fontSize: 14, fontWeight: "700" }}>{s.category}</Text>
                    <View style={{
                      paddingHorizontal: 6, paddingVertical: 2, borderRadius: 8,
                      backgroundColor: PRIORITY_COLORS[s.priority] + "22",
                    }}>
                      <Text style={{ color: PRIORITY_COLORS[s.priority], fontSize: 10, fontWeight: "700", textTransform: "uppercase" }}>
                        {s.priority}
                      </Text>
                    </View>
                  </View>
                  <Text style={{ color: Colors.text.muted, fontSize: 12 }}>{s.reasoning}</Text>
                </View>
                <View style={{ alignItems: "flex-end", gap: 2 }}>
                  <Text style={{ color: Colors.text.muted, fontSize: 11, textDecorationLine: "line-through" }}>
                    {formatCurrency(s.currentLimit)}
                  </Text>
                  <Text style={{ color: s.savingsImpact >= 0 ? Colors.accent : Colors.danger, fontSize: 16, fontWeight: "700" }}>
                    {formatCurrency(s.suggestedLimit)}
                  </Text>
                </View>
              </View>

              {onApplySuggestion && (
                <TouchableOpacity
                  onPress={() => handleApply(s)}
                  disabled={applying === s.category}
                  style={{
                    backgroundColor: Colors.accentSoft, borderRadius: 10, padding: 10,
                    borderWidth: 1, borderColor: Colors.accentBorder,
                    flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 6,
                  }}
                >
                  {applying === s.category ? (
                    <ActivityIndicator size="small" color={Colors.accent} />
                  ) : (
                    <Ionicons name="checkmark-circle" size={15} color={Colors.accent} />
                  )}
                  <Text style={{ color: Colors.accent, fontSize: 13, fontWeight: "600" }}>
                    Apply this suggestion
                  </Text>
                </TouchableOpacity>
              )}
            </View>
          ))}

          {/* Apply all */}
          {onApplyAll && result.suggestions.length > 1 && (
            <Button
              label={appliedAll ? "All Applied ✓" : applying === "all" ? "Applying…" : "Apply All Suggestions"}
              variant={appliedAll ? "ghost" : "primary"}
              onPress={handleApplyAll}
              loading={applying === "all"}
              disabled={appliedAll}
            />
          )}
        </View>
      )}
    </ScrollView>
  );
}
