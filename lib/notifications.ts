import * as Notifications from "expo-notifications";
import { Platform } from "react-native";

// Configure how notifications appear when the app is foregrounded
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

export async function requestNotificationPermissions(): Promise<boolean> {
  if (Platform.OS === "web") return false;
  const { status: existing } = await Notifications.getPermissionsAsync();
  if (existing === "granted") return true;
  const { status } = await Notifications.requestPermissionsAsync();
  return status === "granted";
}

/**
 * Schedule a local reminder for a task.
 * Uses taskId as the notification identifier so it can always be cancelled by ID.
 */
export async function scheduleTaskReminder(
  taskId: string,
  title: string,
  reminderAt: Date
): Promise<void> {
  if (Platform.OS === "web") return;
  // Cancel any existing reminder for this task first
  await cancelTaskReminder(taskId);
  // Don't schedule if the time has already passed
  if (reminderAt <= new Date()) return;
  await Notifications.scheduleNotificationAsync({
    identifier: taskId,
    content: {
      title: "🔔 " + title,
      body: "You have a task due soon.",
      sound: true,
    },
    trigger: { type: Notifications.SchedulableTriggerInputTypes.DATE, date: reminderAt },
  });
}

export async function cancelTaskReminder(taskId: string): Promise<void> {
  if (Platform.OS === "web") return;
  try {
    await Notifications.cancelScheduledNotificationAsync(taskId);
  } catch {
    // ignore if no notification exists with this id
  }
}

export type ReminderPreset = "none" | "morning" | "evening_before" | "two_days_before";

export const REMINDER_LABELS: Record<ReminderPreset, string> = {
  none:             "None",
  morning:          "Day of (9 AM)",
  evening_before:   "Evening before",
  two_days_before:  "2 days before",
};

/**
 * Compute an absolute reminder datetime from a due date string (YYYY-MM-DD)
 * and a preset. Returns null if preset is "none" or no due date.
 */
export function computeReminderAt(
  dueDate: string | null,
  preset: ReminderPreset
): string | null {
  if (!dueDate || preset === "none") return null;
  const [y, m, d] = dueDate.split("-").map(Number);
  let date: Date;
  switch (preset) {
    case "morning":
      date = new Date(y, m - 1, d, 9, 0, 0);
      break;
    case "evening_before":
      date = new Date(y, m - 1, d - 1, 20, 0, 0);
      break;
    case "two_days_before":
      date = new Date(y, m - 1, d - 2, 9, 0, 0);
      break;
    default:
      return null;
  }
  return date.toISOString();
}

/**
 * Reverse-derive the preset from a stored reminder_at value and its due_date.
 * Used to re-populate the picker when editing a task.
 */
export function reminderPresetFromAt(
  reminderAt: string | null,
  dueDate: string | null
): ReminderPreset {
  if (!reminderAt || !dueDate) return "none";
  const [y, m, d] = dueDate.split("-").map(Number);
  const stored = new Date(reminderAt);
  const morning       = new Date(y, m - 1, d, 9, 0, 0);
  const eveningBefore = new Date(y, m - 1, d - 1, 20, 0, 0);
  const twoDaysBefore = new Date(y, m - 1, d - 2, 9, 0, 0);
  if (stored.getTime() === morning.getTime())       return "morning";
  if (stored.getTime() === eveningBefore.getTime()) return "evening_before";
  if (stored.getTime() === twoDaysBefore.getTime()) return "two_days_before";
  return "none";
}
