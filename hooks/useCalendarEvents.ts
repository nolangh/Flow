import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/lib/supabase";
import { useAuthStore } from "@/store/authStore";
import type { CalendarEvent } from "@/types";

export function useCalendarEvents(month: string) {
  const { household } = useAuthStore();
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchEvents = useCallback(async () => {
    if (!household?.id) return;
    setIsLoading(true);
    setError(null);
    try {
      const start = `${month}-01`;
      // last day: roll to next month day 0
      const [year, mon] = month.split("-").map(Number);
      const nextMonth = mon === 12 ? `${year + 1}-01` : `${year}-${String(mon + 1).padStart(2, "0")}`;
      const end = `${nextMonth}-01`;

      const { data, error: dbErr } = await supabase
        .from("calendar_events")
        .select("*")
        .eq("household_id", household.id)
        .gte("start_at", start)
        .lt("start_at", end)
        .order("start_at");

      if (dbErr) throw dbErr;
      setEvents((data as CalendarEvent[]) ?? []);
    } catch (err: unknown) {
      setError((err as Error).message);
    } finally {
      setIsLoading(false);
    }
  }, [household?.id, month]);

  useEffect(() => {
    fetchEvents();
  }, [fetchEvents]);

  const addEvent = async (data: Partial<CalendarEvent>) => {
    // Use a security-definer RPC to bypass RLS on insert (same pattern as households)
    const { error } = await supabase.rpc("create_calendar_event", {
      p_title: data.title ?? "",
      p_start_at: data.start_at ?? new Date().toISOString(),
      p_end_at: data.end_at ?? null,
      p_all_day: data.all_day ?? true,
      p_source: data.source ?? "manual",
      p_description: data.description ?? null,
    });
    if (error) throw error;
    await fetchEvents();
  };

  const deleteEvent = async (id: string) => {
    const { error } = await supabase.from("calendar_events").delete().eq("id", id);
    if (error) throw error;
    setEvents((prev) => prev.filter((e) => e.id !== id));
  };

  return { events, isLoading, error, refetch: fetchEvents, addEvent, deleteEvent };
}
