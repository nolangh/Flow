import {
  nextDueDate,
  isListDueForReset,
  RECURRENCE_LABELS,
  LIST_RESET_LABELS,
  DAY_NAMES,
  type RecurrenceRule,
  type ListResetRule,
} from "@/lib/recurrence";

// ─── nextDueDate ────────────────────────────────────────────────────────────

describe("nextDueDate", () => {
  describe("daily rule", () => {
    it("advances by 1 day", () => {
      expect(nextDueDate("2025-03-15", "daily")).toBe("2025-03-16");
    });

    it("rolls over month boundary", () => {
      expect(nextDueDate("2025-03-31", "daily")).toBe("2025-04-01");
    });

    it("rolls over year boundary", () => {
      expect(nextDueDate("2024-12-31", "daily")).toBe("2025-01-01");
    });
  });

  describe("weekly rule", () => {
    it("advances by 7 days", () => {
      expect(nextDueDate("2025-03-10", "weekly")).toBe("2025-03-17");
    });

    it("crosses month boundary", () => {
      expect(nextDueDate("2025-03-28", "weekly")).toBe("2025-04-04");
    });

    it("crosses year boundary", () => {
      expect(nextDueDate("2024-12-30", "weekly")).toBe("2025-01-06");
    });
  });

  describe("biweekly rule", () => {
    it("advances by 14 days", () => {
      expect(nextDueDate("2025-03-01", "biweekly")).toBe("2025-03-15");
    });

    it("crosses month boundary", () => {
      expect(nextDueDate("2025-03-25", "biweekly")).toBe("2025-04-08");
    });
  });

  describe("monthly rule", () => {
    it("advances by 1 month", () => {
      expect(nextDueDate("2025-03-15", "monthly")).toBe("2025-04-15");
    });

    it("advances from December to January next year", () => {
      expect(nextDueDate("2024-12-15", "monthly")).toBe("2025-01-15");
    });

    it("handles end of month (JS Date overflow behaviour)", () => {
      // Jan 31 + 1 month → JS will land on Mar 2/3 depending on leap
      const result = nextDueDate("2025-01-31", "monthly");
      expect(result).toMatch(/^2025-0[23]-/);
    });
  });

  it("returns a YYYY-MM-DD formatted string for all rules", () => {
    const rules: NonNullable<RecurrenceRule>[] = ["daily", "weekly", "biweekly", "monthly"];
    for (const rule of rules) {
      expect(nextDueDate("2025-06-15", rule)).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    }
  });
});

// ─── RECURRENCE_LABELS ──────────────────────────────────────────────────────

describe("RECURRENCE_LABELS", () => {
  it("has human-readable label for none", () => {
    expect(RECURRENCE_LABELS.none).toBe("Never");
  });

  it("has labels for all rules", () => {
    expect(RECURRENCE_LABELS.daily).toBeTruthy();
    expect(RECURRENCE_LABELS.weekly).toBeTruthy();
    expect(RECURRENCE_LABELS.biweekly).toBeTruthy();
    expect(RECURRENCE_LABELS.monthly).toBeTruthy();
  });
});

// ─── LIST_RESET_LABELS ──────────────────────────────────────────────────────

describe("LIST_RESET_LABELS", () => {
  it("has label for none", () => {
    expect(LIST_RESET_LABELS.none).toBe("Never");
  });

  it("has labels for daily, weekly, monthly", () => {
    expect(LIST_RESET_LABELS.daily).toBeTruthy();
    expect(LIST_RESET_LABELS.weekly).toBeTruthy();
    expect(LIST_RESET_LABELS.monthly).toBeTruthy();
  });
});

// ─── DAY_NAMES ──────────────────────────────────────────────────────────────

describe("DAY_NAMES", () => {
  it("has exactly 7 entries", () => {
    expect(DAY_NAMES).toHaveLength(7);
  });

  it("starts with Sun and ends with Sat", () => {
    expect(DAY_NAMES[0]).toBe("Sun");
    expect(DAY_NAMES[6]).toBe("Sat");
  });
});

// ─── isListDueForReset ──────────────────────────────────────────────────────

describe("isListDueForReset", () => {
  // Lock "today" to a known Wednesday: 2025-04-09
  const TODAY = "2025-04-09"; // Wednesday
  const TODAY_DATE = new Date("2025-04-09T12:00:00.000Z");

  beforeEach(() => {
    jest.useFakeTimers();
    jest.setSystemTime(TODAY_DATE);
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it("returns false when rule is null", () => {
    expect(isListDueForReset(null, null, null, null)).toBe(false);
  });

  it("returns true when lastReset is null (never been reset)", () => {
    expect(isListDueForReset("daily", null, null, null)).toBe(true);
    expect(isListDueForReset("weekly", null, null, null)).toBe(true);
    expect(isListDueForReset("monthly", null, null, null)).toBe(true);
  });

  it("returns false when lastReset is today", () => {
    expect(isListDueForReset("daily", null, null, TODAY)).toBe(false);
    expect(isListDueForReset("weekly", null, null, TODAY)).toBe(false);
    expect(isListDueForReset("monthly", null, null, TODAY)).toBe(false);
  });

  describe("daily rule", () => {
    it("returns true when lastReset was yesterday", () => {
      expect(isListDueForReset("daily", null, null, "2025-04-08")).toBe(true);
    });

    it("returns true when lastReset was a week ago", () => {
      expect(isListDueForReset("daily", null, null, "2025-04-02")).toBe(true);
    });

    it("returns false when lastReset is today", () => {
      expect(isListDueForReset("daily", null, null, TODAY)).toBe(false);
    });
  });

  describe("weekly rule", () => {
    // TODAY = Wednesday Apr 9, 2025
    // If resetDayOfWeek = 3 (Wednesday), last occurrence = today => not due
    it("returns false when the last weekly occurrence was today", () => {
      expect(isListDueForReset("weekly", 3 /* Wed */, null, TODAY)).toBe(false);
    });

    // resetDayOfWeek = 1 (Monday), last Monday was Apr 7
    it("returns true when last reset was before the most recent Monday", () => {
      expect(isListDueForReset("weekly", 1 /* Mon */, null, "2025-03-31")).toBe(true);
    });

    it("returns false when last reset was on most recent Monday", () => {
      // Most recent Monday was Apr 7
      expect(isListDueForReset("weekly", 1 /* Mon */, null, "2025-04-07")).toBe(false);
    });

    it("defaults to Sunday (0) when day not specified", () => {
      // Most recent Sunday was Apr 6
      // If last reset was before Apr 6 → due
      expect(isListDueForReset("weekly", null, null, "2025-04-05")).toBe(true);
    });
  });

  describe("monthly rule", () => {
    // TODAY = Apr 9
    // resetDayOfMonth = 1 → last reset date = Apr 1
    it("returns true when last reset was before the 1st of this month", () => {
      expect(isListDueForReset("monthly", null, 1, "2025-03-15")).toBe(true);
    });

    it("returns false when last reset was on the most recent 1st", () => {
      expect(isListDueForReset("monthly", null, 1, "2025-04-01")).toBe(false);
    });

    // resetDayOfMonth = 15 → we're on the 9th so last occurrence = Mar 15
    it("returns true when last reset was before Mar 15 (day 15, currently Apr 9)", () => {
      expect(isListDueForReset("monthly", null, 15, "2025-03-01")).toBe(true);
    });

    it("returns false when last reset was on or after Mar 15", () => {
      expect(isListDueForReset("monthly", null, 15, "2025-03-15")).toBe(false);
    });

    it("defaults to the 1st when day not specified", () => {
      expect(isListDueForReset("monthly", null, null, "2025-03-31")).toBe(true);
    });
  });
});
