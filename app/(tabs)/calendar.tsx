import {
  View, Text, ScrollView, TouchableOpacity,
  Modal, TextInput, Alert, Platform, StatusBar,
  KeyboardAvoidingView, ActivityIndicator,
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
import { Colors, Fonts, pillShadow, useColors} from "@/constants/theme";
import { formatCurrency, formatMonth, currentYearMonth } from "@/lib/utils";
import Button from "@/components/ui/Button";
import EmptyState from "@/components/ui/EmptyState";
import type { CalendarEvent } from "@/types";

const DAY_LABELS = ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"];
const PRIORITY_LABELS = { low: "Low", medium: "Medium", high: "High" };
const TASK_PURPLE = "#8b5cf6";

type CalTab = "calendar" | "tasks";
type Priority = "low" | "medium" | "high";

function TimeInput({ label, value, onChange }: { label: string; value: string; onChange: (v: string) => void }) {
  const Colors = useColors();
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
  const Colors = useColors();
  const PRIORITY_COLORS = { low: "#6b7280", medium: Colors.warning, high: Colors.danger };
  const [calTab, setCalTab] = useState<CalTab>("calendar");
  const [viewMonth, setViewMonth] = useState(currentYearMonth());
  const { events, isLoading: eventsLoading, addEvent, deleteEvent } = useCalendarEvents(viewMonth);
  const { categories } = useBudgetStore();
  const { user, household } = useAuthStore();
  const { tasks, loadTasks, addTask, updateTask, toggleTask, deleteTask } = useTasksStore();

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

  // Edit task modal state
  const [editingTask, setEditingTask] = useState<typeof tasks[number] | null>(null);
  const [showEditTask, setShowEditTask] = useState(false);
  const [editTitle, setEditTitle] = useState("");
  const [editNotes, setEditNotes] = useState("");
  const [editPriority, setEditPriority] = useState<Priority>("medium");
  const [editAssignee, setEditAssignee] = useState<string | null>(null);
  const [editDueDate, setEditDueDate] = useState<string | null>(null);
  const [savingEdit, setSavingEdit] = useState(false);

  // Subtask state
  const [expandedTasks, setExpandedTasks] = useState<Set<string>>(new Set());
  const [newSubtaskTitle, setNewSubtaskTitle] = useState("");
  const [showSubtaskInput, setShowSubtaskInput] = useState(false);
  const [savingSubtask, setSavingSubtask] = useState(false);

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

  // Group tasks for the list view — top-level only (subtasks shown inline under parent)
  const taskGroups = useMemo(() => {
    const today = format(new Date(), "yyyy-MM-dd");
    const topLevel = tasks.filter((t) => !t.parent_task_id);
    const pending = topLevel.filter((t) => !t.is_completed);
    const completed = topLevel.filter((t) => t.is_completed);

    const overdue = pending.filter((t) => t.due_date && t.due_date < today);
    const todayTasks = pending.filter((t) => t.due_date === today);
    const upcoming = pending.filter((t) => !t.due_date || t.due_date > today);

    return { overdue, today: todayTasks, upcoming, completed };
  }, [tasks]);

  const selectedEvents = selectedDate ? (eventsByDate[selectedDate] ?? []) : [];
  const selectedTasks = selectedDate
    ? tasks.filter((t) => t.due_date === selectedDate && !t.is_completed && !t.parent_task_id)
    : [];

  const handleDayPress = (day: number) => {
    const dateStr = `${viewMonth}-${String(day).padStart(2, "0")}`;
    setSelectedDate(selectedDate === dateStr ? null : dateStr);
    setTaskDueDate(dateStr);
  };

  const resetEventModal = () => { setNewTitle(""); setStartTime(""); setEndTime(""); setAllDay(true); };
  const resetTaskModal = () => { setTaskTitle(""); setTaskNotes(""); setTaskPriority("medium"); setTaskAssignee(null); setTaskDueDate(selectedDate); };

  const openEditTask = (task: typeof tasks[number]) => {
    setEditingTask(task);
    setEditTitle(task.title);
    setEditNotes(task.notes ?? "");
    setEditPriority(task.priority);
    setEditAssignee(task.assigned_to);
    setEditDueDate(task.due_date);
    setNewSubtaskTitle("");
    setShowSubtaskInput(false);
    setShowEditTask(true);
  };

  const handleAddSubtask = async () => {
    if (!newSubtaskTitle.trim() || !editingTask || !user) return;
    setSavingSubtask(true);
    try {
      await addTask({
        household_id: household?.id ?? "",
        created_by: user.id,
        parent_task_id: editingTask.id,
        title: newSubtaskTitle.trim(),
        priority: "medium",
        due_date: editingTask.due_date,
      });
      setNewSubtaskTitle("");
      setShowSubtaskInput(false);
    } catch (err: unknown) {
      Alert.alert("Error", (err as Error).message);
    } finally {
      setSavingSubtask(false);
    }
  };

  const handleUpdateTask = async () => {
    if (!editingTask || !editTitle.trim()) return Alert.alert("Task title is required.");
    setSavingEdit(true);
    try {
      await updateTask(editingTask.id, {
        title: editTitle.trim(),
        notes: editNotes.trim() || null,
        priority: editPriority,
        assigned_to: editAssignee,
        due_date: editDueDate,
      });
      setShowEditTask(false);
      setEditingTask(null);
    } catch (err: unknown) {
      Alert.alert("Error", (err as Error).message);
    } finally {
      setSavingEdit(false);
    }
  };

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
    const subtasks = tasks.filter((t) => t.parent_task_id === task.id);
    const completedSubs = subtasks.filter((t) => t.is_completed).length;
    const hasSubtasks = subtasks.length > 0;
    const isExpanded = expandedTasks.has(task.id);
    const allDone = hasSubtasks && completedSubs === subtasks.length;

    const toggleExpand = () => {
      setExpandedTasks((prev) => {
        const next = new Set(prev);
        if (next.has(task.id)) next.delete(task.id); else next.add(task.id);
        return next;
      });
    };

    const mainBorderColor = task.is_completed
      ? Colors.border.dim
      : isOverdue ? Colors.dangerBorder : Colors.border.subtle;

    return (
      <View style={{ marginBottom: 8 }}>
        {/* ── Main row ────────────────────────────────────────────── */}
        <TouchableOpacity
          activeOpacity={0.7}
          onPress={() => openEditTask(task)}
          style={{
            flexDirection: "row", alignItems: "center", gap: 12,
            backgroundColor: Colors.bg.surface, padding: 14,
            borderWidth: 1,
            borderColor: mainBorderColor,
            borderRadius: 16,
            borderBottomLeftRadius: hasSubtasks && isExpanded ? 0 : 16,
            borderBottomRightRadius: hasSubtasks && isExpanded ? 0 : 16,
            borderBottomWidth: hasSubtasks && isExpanded ? 0 : 1,
          }}
        >
          {/* Checkbox */}
          <TouchableOpacity
            onPress={(e) => { e.stopPropagation?.(); toggleTask(task.id, task.is_completed); }}
            style={{
              width: 26, height: 26, borderRadius: 13,
              borderWidth: 2,
              borderColor: task.is_completed ? Colors.accent : PRIORITY_COLORS[task.priority],
              backgroundColor: task.is_completed ? Colors.accentSoft : "transparent",
              alignItems: "center", justifyContent: "center",
            }}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            {task.is_completed && <Ionicons name="checkmark" size={14} color={Colors.accent} />}
          </TouchableOpacity>

          {/* Content */}
          <View style={{ flex: 1 }}>
            <Text style={{
              color: task.is_completed ? Colors.text.muted : Colors.text.primary,
              fontSize: 14, fontFamily: Fonts.semiBold,
              textDecorationLine: task.is_completed ? "line-through" : "none",
            }} numberOfLines={2}>
              {task.title}
            </Text>
            {task.notes ? (
              <Text style={{ color: Colors.text.muted, fontSize: 12, marginTop: 2 }} numberOfLines={1}>{task.notes}</Text>
            ) : null}
            <View style={{ flexDirection: "row", alignItems: "center", gap: 8, marginTop: 4, flexWrap: "wrap" }}>
              {task.due_date && (
                <Text style={{ color: isOverdue ? Colors.danger : Colors.text.muted, fontSize: 11, fontFamily: Fonts.semiBold }}>
                  {isOverdue ? "⚠ " : ""}{format(parseISO(task.due_date), "MMM d")}
                </Text>
              )}
              <View style={{ width: 5, height: 5, borderRadius: 3, backgroundColor: PRIORITY_COLORS[task.priority] }} />
              <Text style={{ color: Colors.text.muted, fontSize: 11 }}>{PRIORITY_LABELS[task.priority]}</Text>
              {/* Subtask progress pill */}
              {hasSubtasks && (
                <View style={{
                  flexDirection: "row", alignItems: "center", gap: 3,
                  backgroundColor: allDone ? Colors.accentSoft : Colors.bg.raised,
                  borderRadius: 8, paddingHorizontal: 6, paddingVertical: 2,
                  borderWidth: 1, borderColor: allDone ? Colors.accentBorder : Colors.border.subtle,
                }}>
                  <Ionicons name="list-outline" size={10} color={allDone ? Colors.accent : Colors.text.muted} />
                  <Text style={{ color: allDone ? Colors.accent : Colors.text.muted, fontSize: 10, fontFamily: Fonts.bold }}>
                    {completedSubs}/{subtasks.length}
                  </Text>
                </View>
              )}
            </View>
          </View>

          {/* Assignee */}
          {task.assigned_to && (
            <AssigneeChip name={assigneeName} color={task.assigned_to === user?.id ? Colors.accent : TASK_PURPLE} />
          )}

          {/* Expand toggle or plain caret */}
          {hasSubtasks ? (
            <TouchableOpacity
              onPress={(e) => { e.stopPropagation?.(); toggleExpand(); }}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            >
              <Ionicons name={isExpanded ? "chevron-down" : "chevron-forward"} size={16} color={Colors.text.muted} />
            </TouchableOpacity>
          ) : (
            <Ionicons name="chevron-forward" size={14} color={Colors.text.muted} />
          )}
        </TouchableOpacity>

        {/* ── Subtask list (expanded) ──────────────────────────── */}
        {hasSubtasks && isExpanded && (
          <View style={{
            backgroundColor: Colors.bg.raised,
            borderWidth: 1, borderTopWidth: 0,
            borderColor: mainBorderColor,
            borderBottomLeftRadius: 16, borderBottomRightRadius: 16,
            overflow: "hidden",
          }}>
            {subtasks.map((sub) => (
              <View
                key={sub.id}
                style={{
                  flexDirection: "row", alignItems: "center", gap: 10,
                  paddingHorizontal: 14, paddingVertical: 11,
                  borderTopWidth: 1, borderTopColor: Colors.border.subtle,
                }}
              >
                {/* Subtask checkbox */}
                <TouchableOpacity
                  onPress={() => toggleTask(sub.id, sub.is_completed)}
                  style={{
                    width: 22, height: 22, borderRadius: 11,
                    borderWidth: 1.5,
                    borderColor: sub.is_completed ? Colors.accent : Colors.border.strong,
                    backgroundColor: sub.is_completed ? Colors.accentSoft : "transparent",
                    alignItems: "center", justifyContent: "center",
                  }}
                  hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}
                >
                  {sub.is_completed && <Ionicons name="checkmark" size={11} color={Colors.accent} />}
                </TouchableOpacity>

                <Text style={{
                  flex: 1,
                  color: sub.is_completed ? Colors.text.muted : Colors.text.secondary,
                  fontSize: 13, fontFamily: Fonts.medium,
                  textDecorationLine: sub.is_completed ? "line-through" : "none",
                }} numberOfLines={2}>
                  {sub.title}
                </Text>
              </View>
            ))}
          </View>
        )}
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
    <SafeAreaView style={{ flex: 1, backgroundColor: Colors.bg.app }} edges={["top"]}>
      <StatusBar barStyle={Colors.statusBar} />

      {/* Header */}
      <View style={{
        flexDirection: "row", justifyContent: "space-between",
        alignItems: "center", paddingHorizontal: 20, paddingTop: 14, paddingBottom: 16,
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
                            fontFamily: isToday2 || isSelected ? Fonts.bold : Fonts.regular,
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

      {/* ── EDIT TASK MODAL ── */}
      <Modal visible={showEditTask} transparent animationType="slide" onRequestClose={() => { setShowEditTask(false); setEditingTask(null); }}>
        <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : "height"} style={{ flex: 1, justifyContent: "flex-end" }}>
          <View style={{ flex: 1, justifyContent: "flex-end", backgroundColor: "rgba(0,0,0,0.6)" }}>
            <View style={{
              backgroundColor: Colors.bg.raised, borderTopLeftRadius: 28, borderTopRightRadius: 28,
              borderTopWidth: 1, borderColor: Colors.border.subtle,
              maxHeight: "92%",
            }}>
              {/* Drag handle */}
              <View style={{ alignItems: "center", paddingTop: 14, paddingBottom: 6 }}>
                <View style={{ width: 40, height: 4, borderRadius: 2, backgroundColor: Colors.border.subtle }} />
              </View>

              <ScrollView
                keyboardShouldPersistTaps="handled"
                showsVerticalScrollIndicator={false}
                contentContainerStyle={{ paddingHorizontal: 24, paddingBottom: Platform.OS === "ios" ? 44 : 28, gap: 16 }}
              >
                {/* Header */}
                <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
                  <Text style={{ color: Colors.text.primary, fontSize: 18, fontFamily: Fonts.bold }}>Edit Task</Text>
                  <TouchableOpacity
                    onPress={() => Alert.alert("Delete Task", "Remove this task permanently?", [
                      { text: "Cancel", style: "cancel" },
                      { text: "Delete", style: "destructive", onPress: async () => {
                        if (editingTask) { await deleteTask(editingTask.id); setShowEditTask(false); setEditingTask(null); }
                      }},
                    ])}
                  >
                    <View style={{ flexDirection: "row", alignItems: "center", gap: 4, backgroundColor: Colors.dangerSoft, borderRadius: 12, paddingHorizontal: 10, paddingVertical: 5, borderWidth: 1, borderColor: Colors.dangerBorder }}>
                      <Ionicons name="trash-outline" size={13} color={Colors.danger} />
                      <Text style={{ color: Colors.danger, fontSize: 12, fontFamily: Fonts.semiBold }}>Delete</Text>
                    </View>
                  </TouchableOpacity>
                </View>

                {/* Mark complete inline toggle */}
                {editingTask && (
                  <TouchableOpacity
                    onPress={() => { toggleTask(editingTask.id, editingTask.is_completed); setEditingTask({ ...editingTask, is_completed: !editingTask.is_completed }); }}
                    style={{
                      flexDirection: "row", alignItems: "center", gap: 10,
                      backgroundColor: editingTask.is_completed ? Colors.accentSoft : Colors.bg.surface,
                      borderRadius: 14, padding: 14,
                      borderWidth: 1.5,
                      borderColor: editingTask.is_completed ? Colors.accentBorder : Colors.border.subtle,
                    }}
                  >
                    <View style={{
                      width: 24, height: 24, borderRadius: 12,
                      borderWidth: 2, borderColor: editingTask.is_completed ? Colors.accent : Colors.text.muted,
                      backgroundColor: editingTask.is_completed ? Colors.accentSoft : "transparent",
                      alignItems: "center", justifyContent: "center",
                    }}>
                      {editingTask.is_completed && <Ionicons name="checkmark" size={13} color={Colors.accent} />}
                    </View>
                    <Text style={{ color: editingTask.is_completed ? Colors.accent : Colors.text.secondary, fontSize: 14, fontFamily: Fonts.semiBold }}>
                      {editingTask.is_completed ? "Completed" : "Mark as complete"}
                    </Text>
                  </TouchableOpacity>
                )}

                {/* Title */}
                <TextInput
                  style={{ backgroundColor: Colors.bg.surface, borderRadius: 14, padding: 16, color: Colors.text.primary, borderWidth: 1.5, borderColor: Colors.border.subtle, fontSize: 15 }}
                  placeholder="Task title"
                  placeholderTextColor={Colors.text.muted}
                  value={editTitle}
                  onChangeText={setEditTitle}
                />

                {/* Notes */}
                <TextInput
                  style={{ backgroundColor: Colors.bg.surface, borderRadius: 14, padding: 16, color: Colors.text.primary, borderWidth: 1.5, borderColor: Colors.border.subtle, fontSize: 14, minHeight: 60 }}
                  placeholder="Notes (optional)"
                  placeholderTextColor={Colors.text.muted}
                  value={editNotes}
                  onChangeText={setEditNotes}
                  multiline
                />

                {/* Priority */}
                <View>
                  <Text style={{ color: Colors.text.muted, fontSize: 11, fontFamily: Fonts.bold, textTransform: "uppercase", letterSpacing: 0.8, marginBottom: 10 }}>Priority</Text>
                  <View style={{ flexDirection: "row", gap: 8 }}>
                    {(["low", "medium", "high"] as Priority[]).map((p) => (
                      <TouchableOpacity
                        key={p}
                        onPress={() => setEditPriority(p)}
                        style={{
                          flex: 1, paddingVertical: 9, borderRadius: 12, alignItems: "center",
                          backgroundColor: editPriority === p ? PRIORITY_COLORS[p] + "22" : Colors.bg.surface,
                          borderWidth: 1.5, borderColor: editPriority === p ? PRIORITY_COLORS[p] : Colors.border.subtle,
                        }}
                      >
                        <Text style={{ color: editPriority === p ? PRIORITY_COLORS[p] : Colors.text.muted, fontSize: 13, fontFamily: Fonts.bold, textTransform: "capitalize" }}>
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
                        onPress={() => setEditAssignee(null)}
                        style={{ paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20, backgroundColor: !editAssignee ? Colors.bg.overlay : Colors.bg.surface, borderWidth: 1.5, borderColor: !editAssignee ? Colors.border.strong : Colors.border.subtle }}
                      >
                        <Text style={{ color: !editAssignee ? Colors.text.primary : Colors.text.muted, fontSize: 13, fontFamily: Fonts.semiBold }}>Unassigned</Text>
                      </TouchableOpacity>
                      {members.map((m) => {
                        const isMe = m.id === user?.id;
                        const color = isMe ? Colors.accent : TASK_PURPLE;
                        const selected = editAssignee === m.id;
                        return (
                          <TouchableOpacity
                            key={m.id}
                            onPress={() => setEditAssignee(m.id)}
                            style={{ flexDirection: "row", alignItems: "center", gap: 8, paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20, backgroundColor: selected ? color + "22" : Colors.bg.surface, borderWidth: 1.5, borderColor: selected ? color : Colors.border.subtle }}
                          >
                            <AssigneeChip name={m.full_name} color={color} size="sm" />
                            <Text style={{ color: selected ? color : Colors.text.secondary, fontSize: 13, fontFamily: Fonts.semiBold }}>{isMe ? "Me" : (m.full_name ?? m.email)}</Text>
                          </TouchableOpacity>
                        );
                      })}
                    </View>
                  </View>
                )}

                {/* ── Subtasks section ──────────────────────────────── */}
                {editingTask && (
                  <View>
                    <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
                      <Text style={{ color: Colors.text.muted, fontSize: 11, fontFamily: Fonts.bold, textTransform: "uppercase", letterSpacing: 0.8 }}>
                        Subtasks
                        {tasks.filter((t) => t.parent_task_id === editingTask.id).length > 0
                          ? ` · ${tasks.filter((t) => t.parent_task_id === editingTask.id && t.is_completed).length}/${tasks.filter((t) => t.parent_task_id === editingTask.id).length}`
                          : ""}
                      </Text>
                    </View>

                    {/* Existing subtasks */}
                    {tasks
                      .filter((t) => t.parent_task_id === editingTask.id)
                      .map((sub) => (
                        <View
                          key={sub.id}
                          style={{
                            flexDirection: "row", alignItems: "center", gap: 10,
                            backgroundColor: Colors.bg.surface, borderRadius: 12,
                            paddingHorizontal: 12, paddingVertical: 10,
                            borderWidth: 1, borderColor: Colors.border.subtle,
                            marginBottom: 6,
                          }}
                        >
                          <TouchableOpacity
                            onPress={() => toggleTask(sub.id, sub.is_completed)}
                            style={{
                              width: 22, height: 22, borderRadius: 11,
                              borderWidth: 1.5,
                              borderColor: sub.is_completed ? Colors.accent : Colors.border.strong,
                              backgroundColor: sub.is_completed ? Colors.accentSoft : "transparent",
                              alignItems: "center", justifyContent: "center",
                            }}
                            hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}
                          >
                            {sub.is_completed && <Ionicons name="checkmark" size={11} color={Colors.accent} />}
                          </TouchableOpacity>
                          <Text style={{
                            flex: 1,
                            color: sub.is_completed ? Colors.text.muted : Colors.text.secondary,
                            fontSize: 13, fontFamily: Fonts.medium,
                            textDecorationLine: sub.is_completed ? "line-through" : "none",
                          }} numberOfLines={2}>
                            {sub.title}
                          </Text>
                          <TouchableOpacity
                            onPress={() => Alert.alert("Remove subtask?", sub.title, [
                              { text: "Cancel", style: "cancel" },
                              { text: "Remove", style: "destructive", onPress: () => deleteTask(sub.id) },
                            ])}
                            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                          >
                            <Ionicons name="close-circle" size={18} color={Colors.text.muted} />
                          </TouchableOpacity>
                        </View>
                      ))
                    }

                    {/* Add subtask input */}
                    {showSubtaskInput ? (
                      <View style={{ flexDirection: "row", gap: 8, alignItems: "center" }}>
                        <TextInput
                          style={{
                            flex: 1, backgroundColor: Colors.bg.surface, borderRadius: 12,
                            paddingHorizontal: 12, paddingVertical: 10,
                            color: Colors.text.primary, borderWidth: 1.5, borderColor: Colors.accent,
                            fontSize: 14,
                          }}
                          placeholder="Subtask title…"
                          placeholderTextColor={Colors.text.muted}
                          value={newSubtaskTitle}
                          onChangeText={setNewSubtaskTitle}
                          autoFocus
                          returnKeyType="done"
                          onSubmitEditing={handleAddSubtask}
                        />
                        <TouchableOpacity
                          onPress={handleAddSubtask}
                          disabled={savingSubtask || !newSubtaskTitle.trim()}
                          style={{
                            backgroundColor: Colors.accent, borderRadius: 12,
                            paddingHorizontal: 14, paddingVertical: 11,
                            opacity: !newSubtaskTitle.trim() ? 0.5 : 1,
                          }}
                        >
                          {savingSubtask
                            ? <ActivityIndicator size="small" color="#000" />
                            : <Text style={{ color: "#000", fontFamily: Fonts.bold, fontSize: 13 }}>Add</Text>
                          }
                        </TouchableOpacity>
                        <TouchableOpacity onPress={() => { setShowSubtaskInput(false); setNewSubtaskTitle(""); }} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
                          <Ionicons name="close" size={20} color={Colors.text.muted} />
                        </TouchableOpacity>
                      </View>
                    ) : (
                      <TouchableOpacity
                        onPress={() => setShowSubtaskInput(true)}
                        style={{
                          flexDirection: "row", alignItems: "center", gap: 8,
                          paddingVertical: 10, paddingHorizontal: 12,
                          borderRadius: 12, borderWidth: 1.5, borderColor: Colors.border.subtle,
                          borderStyle: "dashed",
                        }}
                      >
                        <Ionicons name="add" size={18} color={Colors.text.muted} />
                        <Text style={{ color: Colors.text.muted, fontSize: 13, fontFamily: Fonts.medium }}>Add subtask</Text>
                      </TouchableOpacity>
                    )}
                  </View>
                )}

                {/* Actions */}
                <View style={{ flexDirection: "row", gap: 10 }}>
                  <Button label="Cancel" variant="ghost" onPress={() => { setShowEditTask(false); setEditingTask(null); }} style={{ flex: 1 }} />
                  <Button label="Save Changes" variant="primary" loading={savingEdit} onPress={handleUpdateTask} style={{ flex: 1 }} />
                </View>
              </ScrollView>
            </View>
          </View>
        </KeyboardAvoidingView>
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
