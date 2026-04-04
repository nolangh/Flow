import * as Notifications from "expo-notifications";
import { Platform } from "react-native";
import {
  requestNotificationPermissions,
  scheduleTaskReminder,
  cancelTaskReminder,
  scheduleMorningBriefing,
  cancelMorningBriefing,
  computeReminderAt,
  reminderPresetFromAt,
  REMINDER_LABELS,
  type ReminderPreset,
} from "@/lib/notifications";

// ─── REMINDER_LABELS ────────────────────────────────────────────────────────

describe("REMINDER_LABELS", () => {
  it("has a label for every preset", () => {
    const presets: ReminderPreset[] = ["none", "morning", "evening_before", "two_days_before"];
    for (const preset of presets) {
      expect(REMINDER_LABELS[preset]).toBeTruthy();
    }
  });

  it("none label is None", () => {
    expect(REMINDER_LABELS.none).toBe("None");
  });
});

// ─── computeReminderAt ──────────────────────────────────────────────────────

describe("computeReminderAt", () => {
  it("returns null when preset is none", () => {
    expect(computeReminderAt("2025-06-15", "none")).toBeNull();
  });

  it("returns null when dueDate is null", () => {
    expect(computeReminderAt(null, "morning")).toBeNull();
  });

  it("morning → 9 AM on due date", () => {
    const result = computeReminderAt("2025-06-15", "morning");
    expect(result).not.toBeNull();
    const d = new Date(result!);
    expect(d.getHours()).toBe(9);
    expect(d.getMinutes()).toBe(0);
    // same calendar date
    expect(d.getFullYear()).toBe(2025);
    expect(d.getMonth()).toBe(5); // June = 5
    expect(d.getDate()).toBe(15);
  });

  it("evening_before → 8 PM the day before", () => {
    const result = computeReminderAt("2025-06-15", "evening_before");
    expect(result).not.toBeNull();
    const d = new Date(result!);
    expect(d.getHours()).toBe(20);
    expect(d.getMinutes()).toBe(0);
    expect(d.getDate()).toBe(14); // day before
  });

  it("two_days_before → 9 AM two days before", () => {
    const result = computeReminderAt("2025-06-15", "two_days_before");
    expect(result).not.toBeNull();
    const d = new Date(result!);
    expect(d.getHours()).toBe(9);
    expect(d.getDate()).toBe(13); // two days before
  });

  it("returns an ISO string", () => {
    const result = computeReminderAt("2025-06-15", "morning");
    expect(result).toMatch(/^\d{4}-\d{2}-\d{2}T/);
  });
});

// ─── reminderPresetFromAt ────────────────────────────────────────────────────

describe("reminderPresetFromAt", () => {
  it("returns none when reminderAt is null", () => {
    expect(reminderPresetFromAt(null, "2025-06-15")).toBe("none");
  });

  it("returns none when dueDate is null", () => {
    const at = computeReminderAt("2025-06-15", "morning");
    expect(reminderPresetFromAt(at, null)).toBe("none");
  });

  it("round-trips morning preset", () => {
    const dueDate = "2025-06-15";
    const at = computeReminderAt(dueDate, "morning")!;
    expect(reminderPresetFromAt(at, dueDate)).toBe("morning");
  });

  it("round-trips evening_before preset", () => {
    const dueDate = "2025-06-15";
    const at = computeReminderAt(dueDate, "evening_before")!;
    expect(reminderPresetFromAt(at, dueDate)).toBe("evening_before");
  });

  it("round-trips two_days_before preset", () => {
    const dueDate = "2025-06-15";
    const at = computeReminderAt(dueDate, "two_days_before")!;
    expect(reminderPresetFromAt(at, dueDate)).toBe("two_days_before");
  });

  it("returns none for an arbitrary time that matches no preset", () => {
    // Noon on the due date — doesn't match any preset
    const arbitrary = new Date(2025, 5, 15, 12, 0, 0).toISOString();
    expect(reminderPresetFromAt(arbitrary, "2025-06-15")).toBe("none");
  });
});

// ─── requestNotificationPermissions ─────────────────────────────────────────

describe("requestNotificationPermissions", () => {
  it("returns true when already granted", async () => {
    (Notifications.getPermissionsAsync as jest.Mock).mockResolvedValueOnce({ status: "granted" });
    const result = await requestNotificationPermissions();
    expect(result).toBe(true);
    expect(Notifications.requestPermissionsAsync).not.toHaveBeenCalled();
  });

  it("requests permissions when not granted and returns true on grant", async () => {
    (Notifications.getPermissionsAsync as jest.Mock).mockResolvedValueOnce({ status: "undetermined" });
    (Notifications.requestPermissionsAsync as jest.Mock).mockResolvedValueOnce({ status: "granted" });
    const result = await requestNotificationPermissions();
    expect(result).toBe(true);
    expect(Notifications.requestPermissionsAsync).toHaveBeenCalled();
  });

  it("returns false when permissions are denied", async () => {
    (Notifications.getPermissionsAsync as jest.Mock).mockResolvedValueOnce({ status: "undetermined" });
    (Notifications.requestPermissionsAsync as jest.Mock).mockResolvedValueOnce({ status: "denied" });
    const result = await requestNotificationPermissions();
    expect(result).toBe(false);
  });

  it("returns false on web platform", async () => {
    const originalOS = Platform.OS;
    Object.defineProperty(Platform, "OS", { value: "web", configurable: true });
    const result = await requestNotificationPermissions();
    expect(result).toBe(false);
    Object.defineProperty(Platform, "OS", { value: originalOS, configurable: true });
  });
});

// ─── scheduleTaskReminder ───────────────────────────────────────────────────

describe("scheduleTaskReminder", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (Notifications.getPermissionsAsync as jest.Mock).mockResolvedValue({ status: "granted" });
  });

  it("calls scheduleNotificationAsync with correct identifier", async () => {
    const future = new Date(Date.now() + 60_000);
    await scheduleTaskReminder("task-123", "Buy milk", future);
    expect(Notifications.scheduleNotificationAsync).toHaveBeenCalledWith(
      expect.objectContaining({ identifier: "task-123" })
    );
  });

  it("prefixes title with bell emoji", async () => {
    const future = new Date(Date.now() + 60_000);
    await scheduleTaskReminder("task-123", "Buy milk", future);
    expect(Notifications.scheduleNotificationAsync).toHaveBeenCalledWith(
      expect.objectContaining({
        content: expect.objectContaining({ title: "🔔 Buy milk" }),
      })
    );
  });

  it("does not schedule when reminderAt is in the past", async () => {
    const past = new Date(Date.now() - 60_000);
    await scheduleTaskReminder("task-123", "Old task", past);
    expect(Notifications.scheduleNotificationAsync).not.toHaveBeenCalled();
  });

  it("cancels any existing reminder before scheduling a new one", async () => {
    const future = new Date(Date.now() + 60_000);
    await scheduleTaskReminder("task-abc", "Task", future);
    expect(Notifications.cancelScheduledNotificationAsync).toHaveBeenCalledWith("task-abc");
  });
});

// ─── cancelTaskReminder ──────────────────────────────────────────────────────

describe("cancelTaskReminder", () => {
  beforeEach(() => jest.clearAllMocks());

  it("calls cancelScheduledNotificationAsync with the task id", async () => {
    await cancelTaskReminder("task-xyz");
    expect(Notifications.cancelScheduledNotificationAsync).toHaveBeenCalledWith("task-xyz");
  });

  it("does not throw when notification does not exist", async () => {
    (Notifications.cancelScheduledNotificationAsync as jest.Mock).mockRejectedValueOnce(
      new Error("not found")
    );
    await expect(cancelTaskReminder("missing-id")).resolves.toBeUndefined();
  });
});

// ─── scheduleMorningBriefing ─────────────────────────────────────────────────

describe("scheduleMorningBriefing", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (Notifications.getPermissionsAsync as jest.Mock).mockResolvedValue({ status: "granted" });
  });

  it("schedules a DAILY notification", async () => {
    await scheduleMorningBriefing(8);
    expect(Notifications.scheduleNotificationAsync).toHaveBeenCalledWith(
      expect.objectContaining({
        identifier: "honeydo_morning_briefing",
        trigger: expect.objectContaining({
          type: Notifications.SchedulableTriggerInputTypes.DAILY,
          hour: 8,
          minute: 0,
        }),
      })
    );
  });

  it("uses the provided hour", async () => {
    await scheduleMorningBriefing(7);
    expect(Notifications.scheduleNotificationAsync).toHaveBeenCalledWith(
      expect.objectContaining({
        trigger: expect.objectContaining({ hour: 7 }),
      })
    );
  });

  it("does not schedule when permissions are denied", async () => {
    (Notifications.getPermissionsAsync as jest.Mock).mockResolvedValueOnce({ status: "undetermined" });
    (Notifications.requestPermissionsAsync as jest.Mock).mockResolvedValueOnce({ status: "denied" });
    await scheduleMorningBriefing(8);
    expect(Notifications.scheduleNotificationAsync).not.toHaveBeenCalled();
  });
});

// ─── cancelMorningBriefing ───────────────────────────────────────────────────

describe("cancelMorningBriefing", () => {
  it("cancels the morning briefing notification", async () => {
    await cancelMorningBriefing();
    expect(Notifications.cancelScheduledNotificationAsync).toHaveBeenCalledWith(
      "honeydo_morning_briefing"
    );
  });

  it("does not throw when no briefing is scheduled", async () => {
    (Notifications.cancelScheduledNotificationAsync as jest.Mock).mockRejectedValueOnce(
      new Error("not found")
    );
    await expect(cancelMorningBriefing()).resolves.toBeUndefined();
  });
});
