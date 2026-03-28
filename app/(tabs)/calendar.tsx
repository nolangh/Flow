import {
  View, Text, ScrollView, TouchableOpacity,
  Modal, TextInput, Alert, Platform, StatusBar,
} from "react-native";
import { useState, useMemo, useEffect } from "react";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import {
  getDaysInMonth, getDay, parseISO, format,
  isToday, isBefore, startOfDay,
} from "date-fns";
import { useCalendarEvents } from "@/hooks/useCalendarEvents";
import { useBudgetStore } from "@/store/budgetStore";
import { useAuthStore } from "@/store/authStore";
import { useTasksStore } from "@/store/tasksStore";
import { Colors, Fonts, pillShadow } from "@/constants/theme";
import { formatCurrency, formatMonth, currentYearMonth } from "@/lib/utils";
import Button from "@/components/ui/Button";
import EmptyState from "@/components/ui/EmptyState";
import type { CalendarEvent } from "@/types";

const DAY_LABELS = ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"];
const PRIORITY_COLORS = { low: "#6b7280", medium: Colors.warning, high: Colors.danger };
const PRIORITY_LABELS = { low: "Low", medium: "Medium", high: "High" };
const TASK_PURPLE = "#8b5cf6";

type CalTab = "calendar" | "tasks";
type Priority = "low" | "medium" | "high";

function TimeInput({ label, value, onChange }: { label: string; value: string; onChange: (v: string) => void }) {
  return (
    <View style={{ flex: 1 }}>
      <Text style={{ color: Colors.text.muted, fontSize: 11, fontFamily: Fonts.semiBold, marginBottom: 6, textTransform: "uppercase", letterSpacing: 0.5 }}>
        {label}
      </Text>
      <TextInput
        style={{
          backgroundColor: Colors.bg.surface, borderRadius: 12, padding: 14,
          color: Colors.text.primary, borderWidth: 1.5, borderColor: Colors.border.subtle,
          fontSize: 18, fontFamily: Fonts.semiBold, textAlign: "center",
        }}
        placeholder="9:00 AM"
        placeholderTextColor={Colors.text.muted}
        value={value}
        onChangeText={onChange}
        keyboardType="default"
        autoCapitalize="none"
      />
    </View>
  );
}

function parseTime(raw: string): string | null {
  const s = raw.trim().toUpperCase();
  const match = s.match(/^(\d{1,2}):?(\d{2})?\s*(AM|PM)?$/);
  if (!match) return null;
  let hours = parseInt(match[1]);
  const mins = parseInt(match[2] ?? "0");
  const meridiem = match[3];
  if (meridiem === "PM" && hours < 12) hours += 12;
  if (meridiem === "AM" && hours === 12) hours = 0;
  if (hours > 23 || mins > 59) return null;
  return `${String(hours).padStart(2, "0")}:${String(mins).padStart(2, "0")}`;
}

function getInitials(name: string | null | undefined): string {
  if (!name) return "?";
  return name.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2);
}

function AssigneeChip({ name, color, size = "sm" }: { name: string | null; color: string; size?: "sm" | "md" }) {
  const dim = size === "md" ? 28 : 22;
  const fontSize = size === "md" ? 10 : 8;
  return (
    <View style={{
      width: dim, height: dim, borderRadius: dim / 2,
      backgroundColor: color + "33",
      borderWidth: 1, borderColor: color + "66",
      alignItems: "center", justifyContent: "center",
    }}>
      <Text style={{ color, fontSize, fontFamily: Fonts.bold }}>{getInitials(name)}</Text>
    </View>
  );
}

export default function CalendarScreen() {
  const [calTab, setCalTab] = useState<CalTab>("calendar");
  const [viewMonth, setViewMonth] = useState(currentYearMonth());
  const { events, isLoading: eventsLoading, addEvent, deleteEvent } = useCalendarEvents(viewMonth);
  const { categories } = useBudgetStore();
  const { user, household } = useAuthStore();
  const { tasks, loadTasks, addTask, toggleTask, deleteTask } = useTasksStore();

  const [selectedDate, setSelectedDate] = useState<string | null>(null);

  // Event modal state
  const [showAddEvent, setShowAddEvent] = useState(false);
  const [newTitle, setNewTitle] = useState("");
  const [startTime, setStartTime] = useState("");
  const [endTime, setEndTime] = useState("");
  const [allDay, setAllDay] = useState(true);
  const [savingEvent, setSavingEvent] = useState(false);

  // Task modal state
  const [showAddTask, setShowAddTask] = useState(false);
  const [taskTitle, setTaskTitle] = useState("");
  const [taskNotes, setTaskNotes] = useState("");
  const [taskPriority, setTaskPriority] = useState<Priority>("medium");
  const [taskAssignee, setTaskAssignee] = useState<string | null>(null);
  const [taskDueDate, setTaskDueDate] = useState<string | null>(null);
  const [savingTask, setSavingTask] = useState(false);

  const members: Array<{ id: string; full_name: string | null; email: string }> =
    (household as any)?.members ?? (user ? [user] : []);

  useEffect(() => {
    if (household?.id) loadTasks(household.id);
  }, [household?.id]);

  const [year, month] = viewMonth.split("-").map(Number);
  const daysInMonth = getDaysInMonth(parseISO(`${viewMonth}-01`));
  const firstDayOfWeek = getDay(parseISO(`${viewMonth}-01`));

  const handlePrevMonth = () =>
    setViewMonth(month === 1 ? `${year - 1}-12` : `${year}-${String(month - 1).padStart(2, "0")}`);
  const handleNextMonth = () =>
    setViewMonth(month === 12 ? `${year + 1}-01` : `${year}-${String(month + 1).padStart(2, "0")}`);

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
        id: `bill-${cat.id}`, household_id: "", user_id: null,
        title: cat.name, description: `Fixed bill · ${formatCurrency(cat.monthly_limit)}`,
        start_at: `${d}T00:00:00`, end_at: null, all_day: true,
        source: "budget_bill", google_event_id: null,
        budget_category_id: cat.id, amount: cat.monthly_limit,
        color: Colors.danger, created_at: "", updated_at: "",
      });
    }
    return map;
  }, [events, categories, viewMonth]);

  // Group tasks by due date for calendar dots
  const tasksByDate = useMemo(() => {
    const map: Record<string, number> = {};
    for (const t of tasks) {
      if (t.due_date && !t.is_completed) {
        map[t.due_date] = (map[t.due_date] ?? 0) + 1;
      }
    }
    return map;
  }, [tasks]);

  // Group tasks for the list view
  const taskGroups = useMemo(() => {
    const today = format(new Date(), "yyyy-MM-dd");
    const pending = tasks.filter((t) => !t.is_completed);
    const completed = tasks.filter((t) => t.is_completed);

    const overdue = pending.filter((t) => t.due_date && t.due_date < today);
    const todayTasks = pending.filter((t) => t.due_date === today);
    const upcoming = pending.filter((t) => !t.due_date || t.due_date > today);

    return { overdue, today: todayTasks, upcoming, completed };
  }, [tasks]);

  const selectedEvents = selectedDate ? (eventsByDate[selectedDate] ?? []) : [];
  const selectedTasks = selectedDate ? tasks.filter((t) => t.due_date === selectedDate && !t.is_completed) : [];

  const handleDayPress = (day: number) => {
    const dateStr = `${viewMonth}-${String(day).padStart(2, "0")}`;
    setSelectedDate(selectedDate === dateStr ? null : dateStr);
    setTaskDueDate(dateStr);
  };

  const resetEventModal = () => { setNewTitle(""); setStartTime(""); setEndTime(""); setAllDay(true); };
  const resetTaskModal = () => { setTaskTitle(""); setTaskNotes(""); setTaskPriority("medium"); setTaskAssignee(null); setTaskDueDate(selectedDate); };

  const handleAddEvent = async () => {
    if (!newTitle.trim()) return Alert.alert("Enter an event title.");
    if (!selectedDate) return Alert.alert("Select a date first.");
    let startAt = `${selectedDate}T00:00:00`;
    let endAt: string | undefined;
    if (!allDay) {
      const parsedStart = parseTime(startTime);
      if (!parsedStart) return Alert.alert("Enter a valid start time (e.g. 9:00 AM).");
      startAt = `${selectedDate}T${parsedStart}:00`;
      if (endTime.trim()) {
        const parsedEnd = parseTime(endTime);
        if (!parsedEnd) return Alert.alert("Enter a valid end time (e.g. 10:30 AM).");
        endAt = `${selectedDate}T${parsedEnd}:00`;
      }
    }
    setSavingEvent(true);
    try {
      await addEvent({ title: newTitle.trim(), start_at: startAt, end_at: endAt ?? null, all_day: allDay, source: "manual" });
      resetEventModal();
      setShowAddEvent(false);
    } catch (err: unknown) {
      Alert.alert("Error", (err as Error).message);
    } finally {
      setSavingEvent(false);
    }
  };

  const handleAddTask = async () => {
    if (!taskTitle.trim()) return Alert.alert("Enter a task title.");
    if (!user) return;
    setSavingTask(true);
    try {
      await addTask({
        household_id: household?.id ?? "",
        created_by: user.id,
        assigned_to: taskAssignee,
        title: taskTitle,
        notes: taskNotes || null,
        due_date: taskDueDate,
        priority: taskPriority,
      });
      resetTaskModal();
      setShowAddTask(false);
    } catch (err: unknown) {
      Alert.alert("Error", (err as Error).message);
    } finally {
      setSavingTask(false);
    }
  };

  const getMemberName = (id: string | null) => {
    if (!id) return null;
    return members.find((m) => m.id === id)?.full_name ?? "Unknown";
  };

  const calendarDays: (number | null)[] = [
    ...Array(firstDayOfWeek).fill(null),
    ...Array.from({ length: daysInMonth }, (_, i) => i + 1),
  ];
  while (calendarDays.length % 7 !== 0) calendarDays.push(null);

  const todayStr = format(new Date(), "yyyy-MM-dd");

  // ─── Task row component ───────────────────────────────────────────────────
  const TaskRow = ({ task }: { task: typeof tasks[number] }) => {
    const assigneeName = getMemberName(task.assigned_to);
    const isOverdue = task.due_date && task.due_date < todayStr && !task.is_completed;

    return (
      <View style={{
        flexDirection: "row", alignItems: "center", gap: 12,
        backgroundColor: Colors.bg.surface, borderRadius: 16, padding: 14,
        borderWidth: 1, borderColor: Colors.border.subtle, marginBottom: 8,
      }}>
        {/* Checkbox */}
        <TouchableOpacity
          onPress={() => toggleTask(task.id, task.is_completed)}
          style={{
            width: 24, height: 24, borderRadius: 12,
            borderWidth: 2,
            borderColor: task.is_completed ? Colors.accent : PRIORITY_COLORS[task.priority],
            backgroundColor: task.is_completed ? Colors.accentSoft : "transparent",
            alignItems: "center", justifyContent: "center",
          }}
        >
          {task.is_completed && <Ionicons name="checkmark" size={13} color={Colors.accent} />}
        </TouchableOpacity>

        {/* Content */}
        <View style={{ flex: 1 }}>
          <Text style={{
            color: task.is_completed ? Colors.text.muted : Colors.text.primary,
            fontSize: 14, fontFamily: Fonts.semiBold,
            textDecorationLine: task.is_completed ? "line-through" : "none",
          }}>
            {task.title}
          </Text>
          {task.notes ? (
            <Text style={{ color: Colors.text.muted, fontSize: 12, marginTop: 2 }} numberOfLines={1}>{task.notes}</Text>
          ) : null}
          <View style={{ flexDirection: "row", alignItems: "center", gap: 8, marginTop: 4 }}>
            {task.due_date && (
              <Text style={{ color: isOverdue ? Colors.danger : Colors.text.muted, fontSize: 11, fontFamily: Fonts.semiBold }}>
                {isOverdue ? "Overdue · " : ""}{format(parseISO(task.due_date), "MMM d")}
              </Text>
            )}
            <View style={{ width: 5, height: 5, borderRadius: 3, backgroundColor: PRIORITY_COLORS[task.priority] }} />
            <Text style={{ color: Colors.text.muted, fontSize: 11 }}>{PRIORITY_LABELS[task.priority]}</Text>
          </View>
        </View>

        {/* Assignee */}
        {task.assigned_to && (
          <AssigneeChip
            name={assigneeName}
            color={task.assigned_to === user?.id ? Colors.accent : TASK_PURPLE}
          />
        )}

        {/* Delete */}
        <TouchableOpacity
          onPress={() => Alert.alert("Delete Task", "Remove this task?", [
            { text: "Cancel", style: "cancel" },
            { text: "Delete", style: "destructive", onPress: () => deleteTask(task.id) },
          ])}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        >
          <Ionicons name="close" size={14} color={Colors.text.muted} />
        </TouchableOpacity>
      </View>
    );
  };

  const SectionHeader = ({ title, count }: { title: string; count: number }) => (
    <View style={{ flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 10, marginTop: 4 }}>
      <Text style={{ color: Colors.text.muted, fontSize: 11, fontFamily: Fonts.bold, textTransform: "uppercase", letterSpacing: 0.8 }}>
        {title}
      </Text>
      <View style={{ backgroundColor: Colors.bg.surface, borderRadius: 10, paddingHorizontal: 7, paddingVertical: 2 }}>
        <Text style={{ color: Colors.text.muted, fontSize: 11, fontFamily: Fonts.semiBold }}>{count}</Text>
      </View>
    </View>
  );

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: "#000" }} edges={["top"]}>
      <StatusBar barStyle="light-content" />

      {/* Header */}
      <View style={{
        flexDirection: "row", justifyContent: "space-between",
        alignItems: "center", paddingHorizontal: 20, paddingTop: 6, paddingBottom: 16,
      }}>
        <Text style={{ color: Colors.text.primary, fontSize: 26, fontFamily: Fonts.extraBold, letterSpacing: -0.5 }}>
          {calTab === "calendar" ? "Calendar" : "Tasks"}
        </Text>
        <View style={{ flexDirection: "row", gap: 8 }}>
          {calTab === "calendar" && (
            <View style={{ flexDirection: "row", alignItems: "center", gap: 4, backgroundColor: Colors.bg.surface, borderRadius: 20, paddingHorizontal: 12, paddingVertical: 7, borderWidth: 1, borderColor: Colors.border.subtle }}>
              <TouchableOpacity onPress={handlePrevMonth} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
                <Ionicons name="chevron-back" size={14} color={Colors.text.muted} />
              </TouchableOpacity>
              <Text style={{ color: Colors.text.secondary, fontSize: 13, fontFamily: Fonts.semiBold, marginHorizontal: 6 }}>
                {formatMonth(`${viewMonth}-01`)}
              </Text>
              <TouchableOpacity onPress={handleNextMonth} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
                <Ionicons name="chevron-forward" size={14} color={Colors.text.muted} />
              </TouchableOpacity>
            </View>
          )}
          {calTab === "tasks" && (
            <TouchableOpacity
              onPress={() => { resetTaskModal(); setShowAddTask(true); }}
              style={{ backgroundColor: Colors.accent, borderRadius: 20, paddingHorizontal: 14, paddingVertical: 7, ...pillShadow(Colors.accent) }}
            >
              <Text style={{ color: "#000", fontSize: 13, fontFamily: Fonts.bold }}>+ Task</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* Tab toggle */}
      <View style={{ flexDirection: "row", marginHorizontal: 20, marginBottom: 16, backgroundColor: Colors.bg.surface, borderRadius: 16, padding: 4, borderWidth: 1, borderColor: Colors.border.subtle }}>
        {(["calendar", "tasks"] as CalTab[]).map((tab) => (
          <TouchableOpacity
            key={tab}
            onPress={() => setCalTab(tab)}
            style={{
              flex: 1, paddingVertical: 9, borderRadius: 12, alignItems: "center",
              backgroundColor: calTab === tab ? Colors.accent : "transparent",
            }}
          >
            <Text style={{ color: calTab === tab ? "#000" : Colors.text.muted, fontSize: 13, fontFamily: Fonts.bold, textTransform: "capitalize" }}>
              {tab === "calendar" ? "📅 Calendar" : "✅ Tasks"}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <ScrollView contentContainerStyle={{ paddingBottom: 40 }} showsVerticalScrollIndicator={false}>

        {/* ── CALENDAR VIEW ── */}
        {calTab === "calendar" && (
          <>
            {/* Calendar grid */}
            <View style={{ marginHorizontal: 16 }}>
              <View style={{ flexDirection: "row", marginBottom: 6 }}>
                {DAY_LABELS.map((d) => (
                  <View key={d} style={{ flex: 1, alignItems: "center", paddingBottom: 6 }}>
                    <Text style={{ color: Colors.text.muted, fontSize: 11, fontFamily: Fonts.bold }}>{d}</Text>
                  </View>
                ))}
              </View>
              {Array.from({ length: calendarDays.length / 7 }, (_, row) => (
                <View key={row} style={{ flexDirection: "row", marginBottom: 2 }}>
                  {calendarDays.slice(row * 7, row * 7 + 7).map((day, col) => {
                    const dateStr = day ? `${viewMonth}-${String(day).padStart(2, "0")}` : null;
                    const isToday2 = dateStr === todayStr;
                    const isSelected = dateStr === selectedDate;
                    const hasEvents = dateStr ? (eventsByDate[dateStr]?.length ?? 0) > 0 : false;
                    const hasBill = dateStr ? (eventsByDate[dateStr] ?? []).some((e) => e.source === "budget_bill") : false;
                    const hasTask = dateStr ? (tasksByDate[dateStr] ?? 0) > 0 : false;

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
                          backgroundColor: isSelected ? Colors.accent : isToday2 ? Colors.accentSoft : "transparent",
                          borderWidth: isToday2 && !isSelected ? 1.5 : 0,
                          borderColor: Colors.accentBorder,
                        }}>
                          <Text style={{
                            color: isSelected ? "#000" : isToday2 ? Colors.accent : day ? Colors.text.primary : "transparent",
                            fontSize: 14,
                            fontWeight: isToday2 || isSelected ? "700" : "400",
                          }}>
                            {day ?? ""}
                          </Text>
                        </View>
                        {(hasEvents || hasTask) && (
                          <View style={{ flexDirection: "row", gap: 2, marginTop: 2 }}>
                            {hasEvents && <View style={{ width: 4, height: 4, borderRadius: 2, backgroundColor: hasBill ? Colors.danger : Colors.accent }} />}
                            {hasTask && <View style={{ width: 4, height: 4, borderRadius: 2, backgroundColor: TASK_PURPLE }} />}
                          </View>
                        )}
                      </TouchableOpacity>
                    );
                  })}
                </View>
              ))}
            </View>

            <View style={{ height: 1, backgroundColor: Colors.border.dim, marginVertical: 20, marginHorizontal: 20 }} />

            {/* Selected day panel */}
            <View style={{ paddingHorizontal: 20 }}>
              <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
                <Text style={{ color: selectedDate ? Colors.text.primary : Colors.text.muted, fontSize: 15, fontFamily: Fonts.semiBold }}>
                  {selectedDate ? format(parseISO(selectedDate), "EEEE, MMMM d") : "Select a day"}
                </Text>
                {selectedDate && (
                  <View style={{ flexDirection: "row", gap: 8 }}>
                    <TouchableOpacity
                      onPress={() => { resetTaskModal(); setShowAddTask(true); }}
                      style={{ backgroundColor: TASK_PURPLE + "22", borderRadius: 16, paddingHorizontal: 12, paddingVertical: 6, borderWidth: 1, borderColor: TASK_PURPLE + "44" }}
                    >
                      <Text style={{ color: TASK_PURPLE, fontSize: 12, fontFamily: Fonts.bold }}>+ Task</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      onPress={() => setShowAddEvent(true)}
                      style={{ backgroundColor: Colors.accent, borderRadius: 16, paddingHorizontal: 12, paddingVertical: 6, ...pillShadow(Colors.accent) }}
                    >
                      <Text style={{ color: "#000", fontSize: 12, fontFamily: Fonts.bold }}>+ Event</Text>
                    </TouchableOpacity>
                  </View>
                )}
              </View>

              {selectedDate && selectedEvents.length === 0 && selectedTasks.length === 0 && (
                <EmptyState title="Nothing scheduled" subtitle="Tap + Event or + Task to add something." />
              )}

              {/* Tasks on this day */}
              {selectedTasks.map((task) => <TaskRow key={task.id} task={task} />)}

              {/* Events on this day */}
              {selectedEvents.map((ev) => (
                <View key={ev.id} style={{
                  backgroundColor: Colors.bg.surface, borderRadius: 16, padding: 14, marginBottom: 10,
                  borderWidth: 1, borderColor: ev.source === "budget_bill" ? Colors.dangerBorder : Colors.border.subtle,
                  flexDirection: "row", alignItems: "flex-start", gap: 12,
                }}>
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
                    <Text style={{ color: Colors.text.primary, fontSize: 14, fontFamily: Fonts.semiBold }}>{ev.title}</Text>
                    {ev.description && <Text style={{ color: Colors.text.muted, fontSize: 12, marginTop: 2 }}>{ev.description}</Text>}
                    {!ev.all_day && ev.start_at && (
                      <Text style={{ color: Colors.text.secondary, fontSize: 12, marginTop: 2 }}>
                        {format(parseISO(ev.start_at), "h:mm a")}
                        {ev.end_at ? ` – ${format(parseISO(ev.end_at), "h:mm a")}` : ""}
                      </Text>
                    )}
                    {ev.amount && <Text style={{ color: Colors.danger, fontSize: 13, fontFamily: Fonts.bold, marginTop: 4 }}>{formatCurrency(ev.amount)}</Text>}
                  </View>
                  {ev.source === "manual" && (
                    <TouchableOpacity onPress={() => deleteEvent(ev.id)} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }} style={{ width: 28, height: 28, borderRadius: 14, backgroundColor: Colors.bg.overlay, alignItems: "center", justifyContent: "center" }}>
                      <Ionicons name="close" size={14} color={Colors.text.muted} />
                    </TouchableOpacity>
                  )}
                </View>
              ))}
            </View>
          </>
        )}

        {/* ── TASKS VIEW ── */}
        {calTab === "tasks" && (
          <View style={{ paddingHorizontal: 20 }}>

            {tasks.length === 0 && (
              <EmptyState title="No tasks yet" subtitle="Tap + Task to create your first task and assign it to a household member." />
            )}

            {taskGroups.overdue.length > 0 && (
              <View style={{ marginBottom: 16 }}>
                <SectionHeader title="Overdue" count={taskGroups.overdue.length} />
                {taskGroups.overdue.map((t) => <TaskRow key={t.id} task={t} />)}
              </View>
            )}

            {taskGroups.today.length > 0 && (
              <View style={{ marginBottom: 16 }}>
                <SectionHeader title="Today" count={taskGroups.today.length} />
                {taskGroups.today.map((t) => <TaskRow key={t.id} task={t} />)}
              </View>
            )}

            {taskGroups.upcoming.length > 0 && (
              <View style={{ marginBottom: 16 }}>
                <SectionHeader title="Upcoming" count={taskGroups.upcoming.length} />
                {taskGroups.upcoming.map((t) => <TaskRow key={t.id} task={t} />)}
              </View>
            )}

            {taskGroups.completed.length > 0 && (
              <View style={{ marginBottom: 16 }}>
                <SectionHeader title="Completed" count={taskGroups.completed.length} />
                {taskGroups.completed.map((t) => <TaskRow key={t.id} task={t} />)}
              </View>
            )}
          </View>
        )}
      </ScrollView>

      {/* ── ADD EVENT MODAL ── */}
      <Modal visible={showAddEvent} transparent animationType="slide" onRequestClose={() => { setShowAddEvent(false); resetEventModal(); }}>
        <View style={{ flex: 1, justifyContent: "flex-end", backgroundColor: "rgba(0,0,0,0.6)" }}>
          <View style={{
            backgroundColor: Colors.bg.raised, borderTopLeftRadius: 28, borderTopRightRadius: 28,
            borderTopWidth: 1, borderColor: Colors.border.subtle,
            padding: 24, paddingBottom: Platform.OS === "ios" ? 44 : 28, gap: 14,
          }}>
            <View style={{ alignItems: "center", marginTop: -8, marginBottom: 4 }}>
              <View style={{ width: 40, height: 4, borderRadius: 2, backgroundColor: Colors.border.subtle }} />
            </View>
            <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
              <Text style={{ color: Colors.text.primary, fontSize: 18, fontFamily: Fonts.bold }}>New Event</Text>
              <Text style={{ color: Colors.text.muted, fontSize: 14 }}>
                {selectedDate ? format(parseISO(selectedDate), "MMM d") : ""}
              </Text>
            </View>
            <TextInput
              style={{ backgroundColor: Colors.bg.surface, borderRadius: 14, padding: 16, color: Colors.text.primary, borderWidth: 1.5, borderColor: Colors.border.subtle, fontSize: 15 }}
              placeholder="Event title"
              placeholderTextColor={Colors.text.muted}
              value={newTitle}
              onChangeText={setNewTitle}
            />
            <TouchableOpacity onPress={() => setAllDay(!allDay)} style={{ flexDirection: "row", alignItems: "center", gap: 10 }}>
              <View style={{ width: 22, height: 22, borderRadius: 6, borderWidth: 1.5, borderColor: allDay ? Colors.accent : Colors.border.subtle, backgroundColor: allDay ? Colors.accentSoft : "transparent", alignItems: "center", justifyContent: "center" }}>
                {allDay && <Ionicons name="checkmark" size={13} color={Colors.accent} />}
              </View>
              <Text style={{ color: Colors.text.secondary, fontSize: 14 }}>All day</Text>
            </TouchableOpacity>
            {!allDay && (
              <View style={{ flexDirection: "row", gap: 12 }}>
                <TimeInput label="Start time" value={startTime} onChange={setStartTime} />
                <TimeInput label="End time" value={endTime} onChange={setEndTime} />
              </View>
            )}
            {!allDay && <Text style={{ color: Colors.text.muted, fontSize: 12 }}>Enter times like "9:00 AM", "14:30", or "2 PM"</Text>}
            <View style={{ flexDirection: "row", gap: 10 }}>
              <Button label="Cancel" variant="ghost" onPress={() => { setShowAddEvent(false); resetEventModal(); }} style={{ flex: 1 }} />
              <Button label="Add Event" variant="primary" loading={savingEvent} onPress={handleAddEvent} style={{ flex: 1 }} />
            </View>
          </View>
        </View>
      </Modal>

      {/* ── ADD TASK MODAL ── */}
      <Modal visible={showAddTask} transparent animationType="slide" onRequestClose={() => { setShowAddTask(false); resetTaskModal(); }}>
        <View style={{ flex: 1, justifyContent: "flex-end", backgroundColor: "rgba(0,0,0,0.6)" }}>
          <View style={{
            backgroundColor: Colors.bg.raised, borderTopLeftRadius: 28, borderTopRightRadius: 28,
            borderTopWidth: 1, borderColor: Colors.border.subtle,
            padding: 24, paddingBottom: Platform.OS === "ios" ? 44 : 28, gap: 16,
          }}>
            <View style={{ alignItems: "center", marginTop: -8, marginBottom: 4 }}>
              <View style={{ width: 40, height: 4, borderRadius: 2, backgroundColor: Colors.border.subtle }} />
            </View>

            <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
              <Text style={{ color: Colors.text.primary, fontSize: 18, fontFamily: Fonts.bold }}>New Task</Text>
              {taskDueDate && (
                <Text style={{ color: Colors.text.muted, fontSize: 13 }}>
                  Due {format(parseISO(taskDueDate), "MMM d")}
                </Text>
              )}
            </View>

            {/* Title */}
            <TextInput
              style={{ backgroundColor: Colors.bg.surface, borderRadius: 14, padding: 16, color: Colors.text.primary, borderWidth: 1.5, borderColor: Colors.border.subtle, fontSize: 15 }}
              placeholder="Task title"
              placeholderTextColor={Colors.text.muted}
              value={taskTitle}
              onChangeText={setTaskTitle}
            />

            {/* Notes */}
            <TextInput
              style={{ backgroundColor: Colors.bg.surface, borderRadius: 14, padding: 16, color: Colors.text.primary, borderWidth: 1.5, borderColor: Colors.border.subtle, fontSize: 14, minHeight: 60 }}
              placeholder="Notes (optional)"
              placeholderTextColor={Colors.text.muted}
              value={taskNotes}
              onChangeText={setTaskNotes}
              multiline
            />

            {/* Priority */}
            <View>
              <Text style={{ color: Colors.text.muted, fontSize: 11, fontFamily: Fonts.bold, textTransform: "uppercase", letterSpacing: 0.8, marginBottom: 10 }}>Priority</Text>
              <View style={{ flexDirection: "row", gap: 8 }}>
                {(["low", "medium", "high"] as Priority[]).map((p) => (
                  <TouchableOpacity
                    key={p}
                    onPress={() => setTaskPriority(p)}
                    style={{
                      flex: 1, paddingVertical: 9, borderRadius: 12, alignItems: "center",
                      backgroundColor: taskPriority === p ? PRIORITY_COLORS[p] + "22" : Colors.bg.surface,
                      borderWidth: 1.5,
                      borderColor: taskPriority === p ? PRIORITY_COLORS[p] : Colors.border.subtle,
                    }}
                  >
                    <Text style={{ color: taskPriority === p ? PRIORITY_COLORS[p] : Colors.text.muted, fontSize: 13, fontFamily: Fonts.bold, textTransform: "capitalize" }}>
                      {PRIORITY_LABELS[p]}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {/* Assignee */}
            {members.length > 0 && (
              <View>
                <Text style={{ color: Colors.text.muted, fontSize: 11, fontFamily: Fonts.bold, textTransform: "uppercase", letterSpacing: 0.8, marginBottom: 10 }}>Assign to</Text>
                <View style={{ flexDirection: "row", gap: 8, flexWrap: "wrap" }}>
                  <TouchableOpacity
                    onPress={() => setTaskAssignee(null)}
                    style={{
                      paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20,
                      backgroundColor: !taskAssignee ? Colors.bg.overlay : Colors.bg.surface,
                      borderWidth: 1.5, borderColor: !taskAssignee ? Colors.border.strong : Colors.border.subtle,
                    }}
                  >
                    <Text style={{ color: !taskAssignee ? Colors.text.primary : Colors.text.muted, fontSize: 13, fontFamily: Fonts.semiBold }}>Unassigned</Text>
                  </TouchableOpacity>
                  {members.map((m) => {
                    const isMe = m.id === user?.id;
                    const color = isMe ? Colors.accent : TASK_PURPLE;
                    const selected = taskAssignee === m.id;
                    return (
                      <TouchableOpacity
                        key={m.id}
                        onPress={() => setTaskAssignee(m.id)}
                        style={{
                          flexDirection: "row", alignItems: "center", gap: 8,
                          paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20,
                          backgroundColor: selected ? color + "22" : Colors.bg.surface,
                          borderWidth: 1.5, borderColor: selected ? color : Colors.border.subtle,
                        }}
                      >
                        <AssigneeChip name={m.full_name} color={color} size="sm" />
                        <Text style={{ color: selected ? color : Colors.text.secondary, fontSize: 13, fontFamily: Fonts.semiBold }}>
                          {isMe ? "Me" : (m.full_name ?? m.email)}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              </View>
            )}

            <View style={{ flexDirection: "row", gap: 10 }}>
              <Button label="Cancel" variant="ghost" onPress={() => { setShowAddTask(false); resetTaskModal(); }} style={{ flex: 1 }} />
              <Button label="Add Task" variant="primary" loading={savingTask} onPress={handleAddTask} style={{ flex: 1 }} />
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}
