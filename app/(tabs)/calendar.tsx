import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Modal,
  TextInput,
  Alert,
  Platform,
  StatusBar,
} from "react-native";
import { useState, useMemo } from "react";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { getDaysInMonth, getDay, parseISO, format, isSameDay } from "date-fns";
import { useCalendarEvents } from "@/hooks/useCalendarEvents";
import { useBudgetStore } from "@/store/budgetStore";
import { Colors, pillShadow } from "@/constants/theme";
import { formatCurrency, formatMonth, currentYearMonth } from "@/lib/utils";
import Button from "@/components/ui/Button";
import EmptyState from "@/components/ui/EmptyState";
import type { CalendarEvent } from "@/types";

const DAY_LABELS = ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"];

export default function CalendarScreen() {
  const [viewMonth, setViewMonth] = useState(currentYearMonth());
  const { events, isLoading, addEvent, deleteEvent } = useCalendarEvents(viewMonth);
  const { categories } = useBudgetStore();

  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [newTitle, setNewTitle] = useState("");
  const [newTime, setNewTime] = useState("12:00");
  const [allDay, setAllDay] = useState(true);
  const [saving, setSaving] = useState(false);

  const [year, month] = viewMonth.split("-").map(Number);
  const daysInMonth = getDaysInMonth(parseISO(`${viewMonth}-01`));
  const firstDayOfWeek = getDay(parseISO(`${viewMonth}-01`));

  const handlePrevMonth = () => {
    setViewMonth(month === 1 ? `${year - 1}-12` : `${year}-${String(month - 1).padStart(2, "0")}`);
  };
  const handleNextMonth = () => {
    setViewMonth(month === 12 ? `${year + 1}-01` : `${year}-${String(month + 1).padStart(2, "0")}`);
  };

  const eventsByDate = useMemo(() => {
    const map: Record<string, CalendarEvent[]> = {};
    for (const ev of events) {
      const d = ev.start_at.split("T")[0];
      if (!map[d]) map[d] = [];
      map[d].push(ev);
    }
    for (const cat of categories.filter((c) => c.is_fixed && c.fixed_day_of_month)) {
      const d = `${viewMonth}-${String(cat.fixed_day_of_month!).padStart(2, "0")}`;
      if (!map[d]) map[d] = [];
      map[d].push({
        id: `bill-${cat.id}`,
        household_id: "",
        user_id: null,
        title: cat.name,
        description: `Fixed bill · ${formatCurrency(cat.monthly_limit)}`,
        start_at: `${d}T00:00:00`,
        end_at: null,
        all_day: true,
        source: "budget_bill",
        google_event_id: null,
        budget_category_id: cat.id,
        amount: cat.monthly_limit,
        color: Colors.danger,
        created_at: "",
        updated_at: "",
      });
    }
    return map;
  }, [events, categories, viewMonth]);

  const selectedEvents = selectedDate ? (eventsByDate[selectedDate] ?? []) : [];

  const handleDayPress = (day: number) => {
    const dateStr = `${viewMonth}-${String(day).padStart(2, "0")}`;
    setSelectedDate(selectedDate === dateStr ? null : dateStr);
  };

  const handleAddEvent = async () => {
    if (!newTitle.trim() || !selectedDate) return;
    setSaving(true);
    try {
      const startAt = allDay ? `${selectedDate}T00:00:00` : `${selectedDate}T${newTime}:00`;
      await addEvent({ title: newTitle.trim(), start_at: startAt, all_day: allDay, source: "manual" });
      setNewTitle(""); setNewTime("12:00"); setAllDay(true);
      setShowAddModal(false);
    } catch (err: unknown) {
      Alert.alert("Error", (err as Error).message);
    } finally {
      setSaving(false);
    }
  };

  const calendarDays: (number | null)[] = [
    ...Array(firstDayOfWeek).fill(null),
    ...Array.from({ length: daysInMonth }, (_, i) => i + 1),
  ];
  while (calendarDays.length % 7 !== 0) calendarDays.push(null);

  const todayStr = format(new Date(), "yyyy-MM-dd");

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: "#000" }} edges={["top"]}>
      <StatusBar barStyle="light-content" />
      <ScrollView contentContainerStyle={{ paddingBottom: 40 }} showsVerticalScrollIndicator={false}>

        {/* Header */}
        <View style={{
          flexDirection: "row", justifyContent: "space-between",
          alignItems: "center", paddingHorizontal: 20, paddingTop: 6, paddingBottom: 20,
        }}>
          <Text style={{ color: Colors.text.primary, fontSize: 26, fontWeight: "800", letterSpacing: -0.5 }}>
            Calendar
          </Text>
          {/* Month nav */}
          <View style={{ flexDirection: "row", alignItems: "center", gap: 4, backgroundColor: Colors.bg.surface, borderRadius: 20, paddingHorizontal: 12, paddingVertical: 7, borderWidth: 1, borderColor: Colors.border.subtle }}>
            <TouchableOpacity onPress={handlePrevMonth} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
              <Ionicons name="chevron-back" size={14} color={Colors.text.muted} />
            </TouchableOpacity>
            <Text style={{ color: Colors.text.secondary, fontSize: 13, fontWeight: "600", marginHorizontal: 6 }}>
              {formatMonth(`${viewMonth}-01`)}
            </Text>
            <TouchableOpacity onPress={handleNextMonth} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
              <Ionicons name="chevron-forward" size={14} color={Colors.text.muted} />
            </TouchableOpacity>
          </View>
        </View>

        {/* Calendar */}
        <View style={{ marginHorizontal: 16 }}>
          {/* Day headers */}
          <View style={{ flexDirection: "row", marginBottom: 6 }}>
            {DAY_LABELS.map((d) => (
              <View key={d} style={{ flex: 1, alignItems: "center", paddingBottom: 6 }}>
                <Text style={{ color: Colors.text.muted, fontSize: 11, fontWeight: "700" }}>{d}</Text>
              </View>
            ))}
          </View>

          {/* Weeks */}
          {Array.from({ length: calendarDays.length / 7 }, (_, row) => (
            <View key={row} style={{ flexDirection: "row", marginBottom: 2 }}>
              {calendarDays.slice(row * 7, row * 7 + 7).map((day, col) => {
                const dateStr = day ? `${viewMonth}-${String(day).padStart(2, "0")}` : null;
                const isToday = dateStr === todayStr;
                const isSelected = dateStr === selectedDate;
                const hasEvents = dateStr ? (eventsByDate[dateStr]?.length ?? 0) > 0 : false;
                const hasBill = dateStr
                  ? (eventsByDate[dateStr] ?? []).some((e) => e.source === "budget_bill")
                  : false;

                return (
                  <TouchableOpacity
                    key={col}
                    onPress={() => day && handleDayPress(day)}
                    disabled={!day}
                    style={{ flex: 1, alignItems: "center", paddingVertical: 5 }}
                  >
                    <View style={{
                      width: 36, height: 36, borderRadius: 18,
                      alignItems: "center", justifyContent: "center",
                      backgroundColor: isSelected
                        ? Colors.accent
                        : isToday
                        ? Colors.accentSoft
                        : "transparent",
                      borderWidth: isToday && !isSelected ? 1.5 : 0,
                      borderColor: Colors.accentBorder,
                    }}>
                      <Text style={{
                        color: isSelected ? "#000" : isToday ? Colors.accent : day ? Colors.text.primary : "transparent",
                        fontSize: 14,
                        fontWeight: isToday || isSelected ? "700" : "400",
                      }}>
                        {day ?? ""}
                      </Text>
                    </View>
                    {hasEvents && (
                      <View style={{ flexDirection: "row", gap: 2, marginTop: 2 }}>
                        <View style={{
                          width: 4, height: 4, borderRadius: 2,
                          backgroundColor: hasBill ? Colors.danger : Colors.accent,
                        }} />
                      </View>
                    )}
                  </TouchableOpacity>
                );
              })}
            </View>
          ))}
        </View>

        {/* Divider */}
        <View style={{ height: 1, backgroundColor: Colors.border.dim, marginVertical: 20, marginHorizontal: 20 }} />

        {/* Selected day */}
        <View style={{ paddingHorizontal: 20 }}>
          <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
            <Text style={{ color: selectedDate ? Colors.text.primary : Colors.text.muted, fontSize: 15, fontWeight: "600" }}>
              {selectedDate
                ? format(parseISO(selectedDate), "EEEE, MMMM d")
                : "Select a day"}
            </Text>
            {selectedDate && (
              <TouchableOpacity
                onPress={() => setShowAddModal(true)}
                style={{
                  backgroundColor: Colors.accent,
                  borderRadius: 20,
                  paddingHorizontal: 14,
                  paddingVertical: 7,
                  ...pillShadow(Colors.accent),
                }}
              >
                <Text style={{ color: "#000", fontSize: 12, fontWeight: "700" }}>+ Add</Text>
              </TouchableOpacity>
            )}
          </View>

          {selectedDate && selectedEvents.length === 0 && (
            <EmptyState title="Nothing scheduled" subtitle="Tap + Add to create an event." />
          )}

          {selectedEvents.map((ev) => (
            <View
              key={ev.id}
              style={{
                backgroundColor: Colors.bg.surface,
                borderRadius: 16,
                padding: 14,
                marginBottom: 10,
                borderWidth: 1,
                borderColor: ev.source === "budget_bill" ? Colors.dangerBorder : Colors.border.subtle,
                flexDirection: "row",
                alignItems: "flex-start",
                gap: 12,
              }}
            >
              <View style={{
                width: 36, height: 36, borderRadius: 18,
                backgroundColor: ev.source === "budget_bill" ? Colors.dangerSoft : Colors.bg.overlay,
                alignItems: "center", justifyContent: "center",
              }}>
                <Ionicons
                  name={ev.source === "budget_bill" ? "repeat" : ev.source === "recurring" ? "sync" : "calendar-outline"}
                  size={16}
                  color={ev.source === "budget_bill" ? Colors.danger : Colors.accent}
                />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={{ color: Colors.text.primary, fontSize: 14, fontWeight: "600" }}>{ev.title}</Text>
                {ev.description && (
                  <Text style={{ color: Colors.text.muted, fontSize: 12, marginTop: 2 }}>{ev.description}</Text>
                )}
                {!ev.all_day && (
                  <Text style={{ color: Colors.text.secondary, fontSize: 12, marginTop: 2 }}>
                    {format(parseISO(ev.start_at), "h:mm a")}
                  </Text>
                )}
                {ev.amount && (
                  <Text style={{ color: Colors.danger, fontSize: 13, fontWeight: "700", marginTop: 4 }}>
                    {formatCurrency(ev.amount)}
                  </Text>
                )}
              </View>
              {ev.source === "manual" && (
                <TouchableOpacity
                  onPress={() => deleteEvent(ev.id)}
                  hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                  style={{
                    width: 28, height: 28, borderRadius: 14,
                    backgroundColor: Colors.bg.overlay,
                    alignItems: "center", justifyContent: "center",
                  }}
                >
                  <Ionicons name="close" size={14} color={Colors.text.muted} />
                </TouchableOpacity>
              )}
            </View>
          ))}
        </View>
      </ScrollView>

      {/* Add event modal */}
      <Modal visible={showAddModal} transparent animationType="slide" onRequestClose={() => setShowAddModal(false)}>
        <View style={{ flex: 1, justifyContent: "flex-end", backgroundColor: "rgba(0,0,0,0.6)" }}>
          <View style={{
            backgroundColor: Colors.bg.raised,
            borderTopLeftRadius: 28, borderTopRightRadius: 28,
            borderTopWidth: 1, borderColor: Colors.border.subtle,
            padding: 24,
            paddingBottom: Platform.OS === "ios" ? 44 : 28,
            gap: 14,
          }}>
            <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 4 }}>
              <Text style={{ color: Colors.text.primary, fontSize: 18, fontWeight: "700" }}>
                New Event
              </Text>
              <Text style={{ color: Colors.text.muted, fontSize: 14 }}>
                {selectedDate ? format(parseISO(selectedDate), "MMM d") : ""}
              </Text>
            </View>
            <TextInput
              style={{
                backgroundColor: Colors.bg.surface,
                borderRadius: 14, padding: 16,
                color: Colors.text.primary,
                borderWidth: 1.5, borderColor: Colors.border.subtle,
                fontSize: 15,
              }}
              placeholder="Event title"
              placeholderTextColor={Colors.text.muted}
              value={newTitle}
              onChangeText={setNewTitle}
            />
            {!allDay && (
              <TextInput
                style={{
                  backgroundColor: Colors.bg.surface,
                  borderRadius: 14, padding: 16,
                  color: Colors.text.primary,
                  borderWidth: 1.5, borderColor: Colors.border.subtle,
                  fontSize: 15,
                }}
                placeholder="Time (HH:MM)"
                placeholderTextColor={Colors.text.muted}
                value={newTime}
                onChangeText={setNewTime}
              />
            )}
            <TouchableOpacity
              onPress={() => setAllDay(!allDay)}
              style={{ flexDirection: "row", alignItems: "center", gap: 10 }}
            >
              <View style={{
                width: 22, height: 22, borderRadius: 6,
                borderWidth: 1.5,
                borderColor: allDay ? Colors.accent : Colors.border.subtle,
                backgroundColor: allDay ? Colors.accentSoft : "transparent",
                alignItems: "center", justifyContent: "center",
              }}>
                {allDay && <Ionicons name="checkmark" size={13} color={Colors.accent} />}
              </View>
              <Text style={{ color: Colors.text.secondary, fontSize: 14 }}>All day</Text>
            </TouchableOpacity>
            <View style={{ flexDirection: "row", gap: 10 }}>
              <Button label="Cancel" variant="ghost" onPress={() => setShowAddModal(false)} style={{ flex: 1 }} />
              <Button label="Add Event" variant="primary" loading={saving} onPress={handleAddEvent} style={{ flex: 1 }} />
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}
