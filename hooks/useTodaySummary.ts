import { useMemo, useEffect, useState } from "react";
import { format } from "date-fns";
import { supabase } from "@/lib/supabase";
import { useAuthStore } from "@/store/authStore";
import { useTasksStore } from "@/store/tasksStore";
import type { CalendarEvent } from "@/types";

export interface TodaySummary {
  date: string;                    // "Thursday, April 3"
  todayTasks: TodayTask[];
  todayEvents: CalendarEvent[];
  overdueCount: number;
  isLoading: boolean;
}

export interface TodayTask {
  id: string;
  title: string;
  is_completed: boolean;
  assigneeName: string | null;     // null = unassigned
  assignedByPartner: boolean;      // true when assigned by someone else
  priority: "low" | "medium" | "high";
}

export function useTodaySummary(): TodaySummary {
  const { user, household } = useAuthStore();
  const { tasks } = useTasksStore();
  const [todayEvents, setTodayEvents] = useState<CalendarEvent[]>([]);
  const [eventsLoading, setEventsLoading] = useState(false);

  const today = format(new Date(), "yyyy-MM-dd");

  // Fetch today's calendar events directly
  useEffect(() => {
    if (!household?.id) return;
    setEventsLoading(true);
    supabase
      .from("calendar_events")
      .select("*")
      .eq("household_id", household.id)
      .gte("start_at", `${today}T00:00:00`)
      .lt("start_at", `${today}T23:59:59`)
      .order("start_at")
      .then(({ data }) => {
        setTodayEvents((data as CalendarEvent[]) ?? []);
        setEventsLoading(false);
      })
      .catch(() => setEventsLoading(false));
  }, [household?.id, today]);

  const members: Array<{ id: string; full_name: string | null }> =
    (household as any)?.members ?? (user ? [user] : []);

  const getMemberName = (id: string | null): string | null => {
    if (!id) return null;
    return members.find((m) => m.id === id)?.full_name ?? null;
  };

  const todayTasks = useMemo<TodayTask[]>(() => {
    return tasks
      .filter((t) => t.due_date === today && !t.parent_task_id)
      .map((t) => ({
        id: t.id,
        title: t.title,
        is_completed: t.is_completed,
        priority: t.priority,
        assigneeName: getMemberName(t.assigned_to),
        assignedByPartner:
          !!t.assigned_to &&
          t.assigned_to === user?.id &&
          t.created_by !== user?.id,
      }));
  }, [tasks, today, user?.id, members]);

  const overdueCount = useMemo(() =>
    tasks.filter((t) => !t.is_completed && t.due_date && t.due_date < today && !t.parent_task_id).length,
  [tasks, today]);

  return {
    date: format(new Date(), "EEEE, MMMM d"),
    todayTasks,
    todayEvents,
    overdueCount,
    isLoading: eventsLoading,
  };
}
