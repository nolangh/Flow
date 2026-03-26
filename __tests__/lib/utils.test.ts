import {
  formatCurrency,
  formatMonth,
  formatDate,
  currentYearMonth,
  monthBounds,
  calculateBudgetPercent,
  isOverBudget,
  buildCumulativeSpendingData,
  guessCategoryName,
  clamp,
  generateInviteCode,
} from "@/lib/utils";

describe("formatCurrency", () => {
  it("formats positive amounts correctly", () => {
    expect(formatCurrency(1234.56)).toBe("$1,234.56");
  });

  it("formats zero", () => {
    expect(formatCurrency(0)).toBe("$0.00");
  });

  it("formats negative amounts without minus sign by default", () => {
    expect(formatCurrency(-50)).toBe("-$50.00");
  });

  it("shows plus sign when showSign=true and amount is positive", () => {
    expect(formatCurrency(100, "USD", true)).toBe("+$100.00");
  });

  it("formats large numbers with commas", () => {
    expect(formatCurrency(1000000)).toBe("$1,000,000.00");
  });
});

describe("formatMonth", () => {
  it("formats a date string to month/year", () => {
    expect(formatMonth("2025-03-15")).toBe("March 2025");
  });

  it("accepts a Date object", () => {
    expect(formatMonth(new Date("2025-01-01"))).toBe("January 2025");
  });
});

describe("formatDate", () => {
  it("formats a date string to abbreviated month and day", () => {
    expect(formatDate("2025-06-15")).toBe("Jun 15");
  });
});

describe("currentYearMonth", () => {
  it("returns a string in YYYY-MM format", () => {
    expect(currentYearMonth()).toMatch(/^\d{4}-\d{2}$/);
  });
});

describe("monthBounds", () => {
  it("returns correct start and end for January", () => {
    const { start, end } = monthBounds("2025-01");
    expect(start).toBe("2025-01-01");
    expect(end).toBe("2025-01-31");
  });

  it("returns correct end for February (non-leap)", () => {
    const { end } = monthBounds("2025-02");
    expect(end).toBe("2025-02-28");
  });

  it("returns correct end for February (leap year)", () => {
    const { end } = monthBounds("2024-02");
    expect(end).toBe("2024-02-29");
  });

  it("returns correct end for a 30-day month", () => {
    const { end } = monthBounds("2025-04");
    expect(end).toBe("2025-04-30");
  });
});

describe("calculateBudgetPercent", () => {
  it("returns 0 when limit is 0", () => {
    expect(calculateBudgetPercent(100, 0)).toBe(0);
  });

  it("returns 50 when spent is half of limit", () => {
    expect(calculateBudgetPercent(250, 500)).toBe(50);
  });

  it("returns 100 when exactly at limit", () => {
    expect(calculateBudgetPercent(500, 500)).toBe(100);
  });

  it("caps at 150 when significantly over budget", () => {
    expect(calculateBudgetPercent(900, 500)).toBe(150);
  });

  it("returns partial percent for near-zero", () => {
    expect(calculateBudgetPercent(1, 1000)).toBeCloseTo(0.1);
  });
});

describe("isOverBudget", () => {
  it("returns false when under budget", () => {
    expect(isOverBudget(400, 500)).toBe(false);
  });

  it("returns false when exactly at budget", () => {
    expect(isOverBudget(500, 500)).toBe(false);
  });

  it("returns true when over budget", () => {
    expect(isOverBudget(501, 500)).toBe(true);
  });

  it("returns false when limit is 0", () => {
    expect(isOverBudget(100, 0)).toBe(false);
  });
});

describe("buildCumulativeSpendingData", () => {
  it("returns daysInMonth data points", () => {
    const result = buildCumulativeSpendingData([], 30);
    expect(result).toHaveLength(30);
  });

  it("all points are zero for empty transactions", () => {
    const result = buildCumulativeSpendingData([], 7);
    result.forEach((p) => expect(p.cumulative).toBe(0));
  });

  it("correctly accumulates single transaction", () => {
    const txs = [{ date: "2025-03-05", amount: 100 }];
    const result = buildCumulativeSpendingData(txs, 31);
    // Days 1-4: 0, day 5 onward: 100
    expect(result[4].cumulative).toBe(100);
    expect(result[3].cumulative).toBe(0);
    expect(result[30].cumulative).toBe(100);
  });

  it("accumulates multiple transactions on same day", () => {
    const txs = [
      { date: "2025-03-01", amount: 50 },
      { date: "2025-03-01", amount: 75 },
    ];
    const result = buildCumulativeSpendingData(txs, 31);
    expect(result[0].cumulative).toBe(125);
  });

  it("accumulates across multiple days", () => {
    const txs = [
      { date: "2025-03-01", amount: 100 },
      { date: "2025-03-03", amount: 200 },
    ];
    const result = buildCumulativeSpendingData(txs, 31);
    expect(result[0].cumulative).toBe(100);
    expect(result[1].cumulative).toBe(100);
    expect(result[2].cumulative).toBe(300);
    expect(result[10].cumulative).toBe(300);
  });

  it("assigns correct day numbers", () => {
    const result = buildCumulativeSpendingData([], 5);
    expect(result.map((p) => p.day)).toEqual([1, 2, 3, 4, 5]);
  });
});

describe("guessCategoryName", () => {
  it("maps known Plaid categories", () => {
    expect(guessCategoryName(["Food and Drink", "Restaurants"])).toBe("Dining Out");
  });

  it("maps top-level Food and Drink", () => {
    expect(guessCategoryName(["Food and Drink"])).toBe("Groceries");
  });

  it("returns first category for unmapped", () => {
    expect(guessCategoryName(["Exotic Category", "Sub"])).toBe("Exotic Category");
  });

  it("returns Uncategorized for empty array", () => {
    expect(guessCategoryName([])).toBe("Uncategorized");
  });
});

describe("clamp", () => {
  it("clamps below min", () => expect(clamp(-5, 0, 100)).toBe(0));
  it("clamps above max", () => expect(clamp(200, 0, 100)).toBe(100));
  it("passes through values in range", () => expect(clamp(50, 0, 100)).toBe(50));
  it("passes exact min", () => expect(clamp(0, 0, 100)).toBe(0));
  it("passes exact max", () => expect(clamp(100, 0, 100)).toBe(100));
});

describe("generateInviteCode", () => {
  it("returns a 6-character string", () => {
    const code = generateInviteCode();
    expect(code).toHaveLength(6);
  });

  it("returns uppercase alphanumeric characters", () => {
    const code = generateInviteCode();
    expect(code).toMatch(/^[A-Z0-9]{6}$/);
  });

  it("generates unique codes on repeated calls", () => {
    const codes = new Set(Array.from({ length: 20 }, () => generateInviteCode()));
    expect(codes.size).toBeGreaterThan(1);
  });
});
