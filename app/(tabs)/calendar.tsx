import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Modal,
  TextInput,
  Alert,
  Platform,
} from "react-native";
import { useState, useMemo } from "react";
import { SafeAreaView } from "react-native-safe-area-context";
import { getDaysInMonth, getDay, parseISO, format, isSameDay } from "date-fns";
import { useCalendarEvents } from "@/hooks/useCalendarEvents";
import { useBudgetStore } from "@/store/budgetStore";
import { Colors, pillShadow } from "@/constants/theme";
import { formatCurrency, formatMonth, currentYearMonth } from "@/lib/utils";
import Card from "@/components/ui/Card";
import Button from "@/components/ui/Button";
import Divider from "@/components/ui/Divider";
import EmptyState from "@/components/ui/EmptyState";
import type { CalendarEvent } from "@/types";

const DAY_LABELS = ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"];
const EVENT_SOURCE_EMOJI: Record<string, string> = {
  manual: "📅",
  google: "🗓",
  budget_bill: "💳",
  recurring: "🔁",
};

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

  // Build map of date → events for fast lookup
  const eventsByDate = useMemo(() => {
    const map: Record<string, CalendarEvent[]> = {};
    for (const ev of events) {
      const d = ev.start_at.split("T")[0];
      if (!map[d]) map[d] = [];
      map[d].push(ev);
    }
    // Also inject fixed budget bills as virtual calendar events
    for (const cat of categories.filter((c) => c.is_fixed && c.fixed_day_of_month)) {
      const d = `${viewMonth}-${String(cat.fixed_day_of_month!).padStart(2, "0")}`;
      if (!map[d]) map[d] = [];
      map[d].push({
        id: `bill-${cat.id}`,
        household_id: "",
        user_id: null,
        title: cat.name,
        description: `Fixed bill: ${formatCurrency(cat.monthly_limit)}`,
        start_at: `${d}T00:00:00`,
        end_at: null,
        all_day: true,
        source: "budget_bill",
        google_event_id: null,
        budget_category_id: cat.id,
        amount: cat.monthly_limit,
        color: Colors.dangerPink,
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
      const startAt = allDay
        ? `${selectedDate}T00:00:00`
        : `${selectedDate}T${newTime}:00`;
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
  // Pad to complete last row
  while (calendarDays.length % 7 !== 0) calendarDays.push(null);

  const todayStr = format(new Date(), "yyyy-MM-dd");

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: "#000000" }} edges={["top"]}>
      <ScrollView contentContainerStyle={{ paddingBottom: 40 }} showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={{ paddingHorizontal: 20, paddingTop: 8, paddingBottom: 4 }}>
          <Text style={{ color: Colors.text.primary, fontSize: 26, fontWeight: "800", letterSpacing: -0.5 }}>
            Calendar
          </Text>
        </View>

        {/* Month nav */}
        <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "center", paddingVertical: 10, gap: 20 }}>
          <TouchableOpacity onPress={handlePrevMonth} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
            <Text style={{ color: Colors.text.secondary, fontSize: 20 }}>‹</Text>
          </TouchableOpacity>
          <Text style={{ color: Colors.text.primary, fontSize: 16, fontWeight: "700" }}>
            {formatMonth(`${viewMonth}-01`)}
          </Text>
          <TouchableOpacity onPress={handleNextMonth} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
            <Text style={{ color: Colors.text.secondary, fontSize: 20 }}>›</Text>
          </TouchableOpacity>
        </View>

        {/* Calendar grid */}
        <View style={{ paddingHorizontal: 16 }}>
          {/* Day-of-week headers */}
          <View style={{ flexDirection: "row", marginBottom: 6 }}>
            {DAY_LABELS.map((d) => (
              <View key={d} style={{ flex: 1, alignItems: "center" }}>
                <Text style={{ color: Colors.text.muted, fontSize: 11, fontWeight: "600" }}>{d}</Text>
              </View>
            ))}
          </View>

          {/* Weeks */}
          {Array.from({ length: calendarDays.length / 7 }, (_, row) => (
            <View key={row} style={{ flexDirection: "row", marginBottom: 4 }}>
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
                    style={{ flex: 1, alignItems: "center", paddingVertical: 6 }}
                  >
                    <View
                      style={{
                        width: 34, height: 34, borderRadius: 17,
                        alignItems: "center", justifyContent: "center",
                        backgroundColor: isSelected
                          ? Colors.neonGreen
                          : isToday
                          ? Colors.neonGreenGlow
                          : "transparent",
                        borderWidth: isToday && !isSelected ? 1 : 0,
                        borderColor: Colors.neonGreenBorder,
                      }}
                    >
                      <Text style={{
                        color: isSelected ? "#000" : isToday ? Colors.neonGreen : day ? Colors.text.primary : "transparent",
                        fontSize: 14,
                        fontWeight: isToday || isSelected ? "700" : "400",
                      }}>
                        {day ?? ""}
                      </Text>
                    </View>
                    {/* Event dots */}
                    {hasEvents && (
                      <View style={{ flexDirection: "row", gap: 2, marginTop: 2 }}>
                        <View style={{ width: 4, height: 4, borderRadius: 2, backgroundColor: hasBill ? Colors.dangerPink : Colors.neonGreen }} />
                      </View>
                    )}
                  </TouchableOpacity>
                );
              })}
            </View>
          ))}
        </View>

        <Divider mt={8} mb={16} />

        {/* Selected day events */}
        <View style={{ paddingHorizontal: 20 }}>
          <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
            <Text style={{ color: Colors.text.secondary, fontSize: 11, textTransform: "uppercase", letterSpacing: 0.8 }}>
              {selectedDate
                ? format(parseISO(selectedDate), "EEEE, MMMM d")
                : "Select a day"}
            </Text>
            {selectedDate && (
              <TouchableOpacity
                onPress={() => setShowAddModal(true)}
                style={{
                  backgroundColor: Colors.neonGreenGlow,
                  borderRadius: 9999,
                  paddingHorizontal: 12,
                  paddingVertical: 5,
                  borderWidth: 1,
                  borderColor: Colors.neonGreenBorder,
                }}
              >
                <Text style={{ color: Colors.neonGreen, fontSize: 12, fontWeight: "600" }}>+ Event</Text>
              </TouchableOpacity>
            )}
          </View>

          {selectedDate && selectedEvents.length === 0 && (
            <EmptyState icon="📅" title="Nothing scheduled" subtitle="Tap + Event to add one." />
          )}

          {selectedEvents.map((ev) => (
            <Card key={ev.id} padding={14} style={{ marginBottom: 8 }}
              glow={ev.source === "budget_bill" ? "pink" : null}
            >
              <View style={{ flexDirection: "row", alignItems: "flex-start", gap: 10 }}>
                <Text style={{ fontSize: 20 }}>{EVENT_SOURCE_EMOJI[ev.source] ?? "📅"}</Text>
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
                    <Text style={{ color: Colors.dangerPink, fontSize: 13, fontWeight: "600", marginTop: 4 }}>
                      {formatCurrency(ev.amount)}
                    </Text>
                  )}
                </View>
                {ev.source === "manual" && (
                  <TouchableOpacity onPress={() => deleteEvent(ev.id)} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
                    <Text style={{ color: Colors.text.muted, fontSize: 16 }}>×</Text>
                  </TouchableOpacity>
                )}
              </View>
            </Card>
          ))}
        </View>
      </ScrollView>

      {/* Add event modal */}
      <Modal visible={showAddModal} transparent animationType="slide" onRequestClose={() => setShowAddModal(false)}>
        <View style={{ flex: 1, justifyContent: "flex-end", backgroundColor: "rgba(0,0,0,0.7)" }}>
          <View style={{ backgroundColor: Colors.bg.raised, borderTopLeftRadius: 24, borderTopRightRadius: 24, borderTopWidth: 1, borderColor: Colors.border.subtle, padding: 20, paddingBottom: Platform.OS === "ios" ? 44 : 24, gap: 14 }}>
            <Text style={{ color: Colors.text.primary, fontSize: 18, fontWeight: "700" }}>
              New Event · {selectedDate ? format(parseISO(selectedDate), "MMM d") : ""}
            </Text>
            <TextInput
              style={{ backgroundColor: Colors.bg.surface, borderRadius: 12, padding: 14, color: Colors.text.primary, borderWidth: 1, borderColor: Colors.border.subtle, fontSize: 15 }}
              placeholder="Event title"
              placeholderTextColor={Colors.text.muted}
              value={newTitle}
              onChangeText={setNewTitle}
            />
            {!allDay && (
              <TextInput
                style={{ backgroundColor: Colors.bg.surface, borderRadius: 12, padding: 14, color: Colors.text.primary, borderWidth: 1, borderColor: Colors.border.subtle, fontSize: 15 }}
                placeholder="Time (HH:MM)"
                placeholderTextColor={Colors.text.muted}
                value={newTime}
                onChangeText={setNewTime}
              />
            )}
            <TouchableOpacity onPress={() => setAllDay(!allDay)} style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
              <View style={{ width: 20, height: 20, borderRadius: 4, borderWidth: 1, borderColor: allDay ? Colors.neonGreen : Colors.border.subtle, backgroundColor: allDay ? Colors.neonGreenGlow : "transparent", alignItems: "center", justifyContent: "center" }}>
                {allDay && <Text style={{ color: Colors.neonGreen, fontSize: 12 }}>✓</Text>}
              </View>
              <Text style={{ color: Colors.text.secondary, fontSize: 14 }}>All day</Text>
            </TouchableOpacity>
            <View style={{ flexDirection: "row", gap: 10 }}>
              <Button label="Cancel" variant="ghost" onPress={() => setShowAddModal(false)} style={{ flex: 1 }} />
              <Button label="Add" variant="primary" loading={saving} onPress={handleAddEvent} style={{ flex: 1 }} />
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}
