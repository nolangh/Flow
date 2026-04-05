import * as FileSystem from "expo-file-system/legacy";
import * as Sharing from "expo-sharing";
import * as DocumentPicker from "expo-document-picker";
import {
  buildBudgetCsv,
  buildTransactionCsv,
  parseBudgetCsv,
  exportCsvFile,
  pickCsvFile,
  type BudgetCsvRow,
  type TransactionCsvRow,
} from "@/lib/csvUtils";

// ─── buildBudgetCsv ──────────────────────────────────────────────────────────

describe("buildBudgetCsv", () => {
  const baseCategory = {
    name: "Groceries",
    monthly_limit: 400,
    is_fixed: false,
    is_income: false,
  };

  it("produces a header row", () => {
    const csv = buildBudgetCsv([baseCategory]);
    const lines = csv.split("\n");
    expect(lines[0]).toBe("name,type,monthly_limit,fixed_day_of_month,emoji");
  });

  it("produces one data row per category", () => {
    const csv = buildBudgetCsv([baseCategory, { ...baseCategory, name: "Dining", monthly_limit: 200 }]);
    const lines = csv.split("\n");
    expect(lines).toHaveLength(3); // header + 2 rows
  });

  it("marks income categories as type=income", () => {
    const csv = buildBudgetCsv([{ ...baseCategory, name: "Salary", monthly_limit: 3000, is_income: true }]);
    expect(csv).toContain("income");
  });

  it("marks fixed categories as type=fixed", () => {
    const csv = buildBudgetCsv([{ ...baseCategory, name: "Rent", is_fixed: true }]);
    expect(csv).toContain("fixed");
  });

  it("marks regular categories as type=spending", () => {
    const csv = buildBudgetCsv([baseCategory]);
    expect(csv).toContain("spending");
  });

  it("includes fixed_day_of_month when provided", () => {
    const csv = buildBudgetCsv([{ ...baseCategory, is_fixed: true, fixed_day_of_month: 1 }]);
    expect(csv).toContain(",1,");
  });

  it("includes emoji column", () => {
    const csv = buildBudgetCsv([{ ...baseCategory, emoji: "🛒" }]);
    expect(csv).toContain("🛒");
  });

  it("escapes names with commas in double quotes", () => {
    const csv = buildBudgetCsv([{ ...baseCategory, name: "Food, Drinks" }]);
    expect(csv).toContain('"Food, Drinks"');
  });

  it("handles empty category list with just a header", () => {
    const csv = buildBudgetCsv([]);
    expect(csv.trim()).toBe("name,type,monthly_limit,fixed_day_of_month,emoji");
  });
});

// ─── buildTransactionCsv ────────────────────────────────────────────────────

describe("buildTransactionCsv", () => {
  const baseTx = {
    date: "2025-03-15",
    name: "Whole Foods",
    amount: -75.5,
    category_name: "Groceries",
  };

  it("produces a header row", () => {
    const csv = buildTransactionCsv([baseTx]);
    const lines = csv.split("\n");
    expect(lines[0]).toBe("date,name,amount,category,type,note");
  });

  it("marks negative amount as debit", () => {
    const csv = buildTransactionCsv([baseTx]);
    expect(csv).toContain("debit");
  });

  it("marks positive amount as credit", () => {
    const csv = buildTransactionCsv([{ ...baseTx, amount: 3000, name: "Paycheck" }]);
    expect(csv).toContain("credit");
  });

  it("uses absolute value for amount column", () => {
    const csv = buildTransactionCsv([baseTx]);
    // Should not contain the minus sign in the amount column
    const lines = csv.split("\n");
    expect(lines[1]).toContain("75.5");
    expect(lines[1]).not.toContain("-75.5");
  });

  it("defaults category to Uncategorized when missing", () => {
    const csv = buildTransactionCsv([{ date: "2025-03-15", name: "Mystery", amount: -20 }]);
    expect(csv).toContain("Uncategorized");
  });

  it("includes note when provided", () => {
    const csv = buildTransactionCsv([{ ...baseTx, note: "Weekly shop" }]);
    expect(csv).toContain("Weekly shop");
  });

  it("handles empty list", () => {
    const csv = buildTransactionCsv([]);
    expect(csv.trim()).toBe("date,name,amount,category,type,note");
  });

  it("escapes names with commas", () => {
    const csv = buildTransactionCsv([{ ...baseTx, name: "Store, Inc." }]);
    expect(csv).toContain('"Store, Inc."');
  });
});

// ─── parseBudgetCsv ──────────────────────────────────────────────────────────

describe("parseBudgetCsv", () => {
  it("parses a minimal valid CSV", () => {
    const csv = "name,monthly_limit\nGroceries,400";
    const result = parseBudgetCsv(csv);
    expect(result).toHaveLength(1);
    expect(result[0].name).toBe("Groceries");
    expect(result[0].monthly_limit).toBe(400);
  });

  it("parses type column", () => {
    const csv = "name,type,monthly_limit\nSalary,income,3000";
    const result = parseBudgetCsv(csv);
    expect(result[0].type).toBe("income");
  });

  it("defaults type to spending when absent", () => {
    const csv = "name,monthly_limit\nGroceries,400";
    const result = parseBudgetCsv(csv);
    expect(result[0].type).toBe("spending");
  });

  it("defaults invalid type to spending", () => {
    const csv = "name,type,monthly_limit\nGroceries,unknown_type,400";
    const result = parseBudgetCsv(csv);
    expect(result[0].type).toBe("spending");
  });

  it("parses fixed_day_of_month column", () => {
    const csv = "name,type,monthly_limit,fixed_day_of_month\nRent,fixed,1500,1";
    const result = parseBudgetCsv(csv);
    expect(result[0].fixed_day_of_month).toBe(1);
  });

  it("parses emoji column", () => {
    const csv = "name,monthly_limit,emoji\nGroceries,400,🛒";
    const result = parseBudgetCsv(csv);
    expect(result[0].emoji).toBe("🛒");
  });

  it("throws when required columns are missing", () => {
    const csv = "foo,bar\nA,B";
    expect(() => parseBudgetCsv(csv)).toThrow();
  });

  it("returns empty array for only-header CSV", () => {
    const csv = "name,monthly_limit";
    expect(parseBudgetCsv(csv)).toHaveLength(0);
  });

  it("filters out rows with zero monthly_limit", () => {
    const csv = "name,monthly_limit\nGroceries,400\nEmpty,0";
    const result = parseBudgetCsv(csv);
    expect(result).toHaveLength(1);
    expect(result[0].name).toBe("Groceries");
  });

  it("filters out rows with empty name", () => {
    const csv = "name,monthly_limit\n,400\nGroceries,400";
    const result = parseBudgetCsv(csv);
    expect(result).toHaveLength(1);
  });

  it("handles quoted fields with commas", () => {
    const csv = `name,monthly_limit\n"Food, Drinks",350`;
    const result = parseBudgetCsv(csv);
    expect(result[0].name).toBe("Food, Drinks");
  });

  it("handles escaped quotes inside quoted fields", () => {
    const csv = `name,monthly_limit\n"Bob's ""Fancy"" Store",200`;
    const result = parseBudgetCsv(csv);
    expect(result[0].name).toBe(`Bob's "Fancy" Store`);
  });

  it("round-trips: buildBudgetCsv → parseBudgetCsv", () => {
    const categories = [
      { name: "Groceries", monthly_limit: 400, is_fixed: false, is_income: false, emoji: "🛒" },
      { name: "Rent", monthly_limit: 1500, is_fixed: true, is_income: false, fixed_day_of_month: 1 },
      { name: "Salary", monthly_limit: 3000, is_fixed: false, is_income: true },
    ];
    const csv = buildBudgetCsv(categories);
    const parsed = parseBudgetCsv(csv);
    expect(parsed).toHaveLength(3);
    expect(parsed[0].name).toBe("Groceries");
    expect(parsed[1].type).toBe("fixed");
    expect(parsed[2].type).toBe("income");
  });
});

// ─── exportCsvFile ───────────────────────────────────────────────────────────

describe("exportCsvFile", () => {
  beforeEach(() => jest.clearAllMocks());

  it("writes the file to the cache directory", async () => {
    await exportCsvFile("budget.csv", "header\nrow");
    expect(FileSystem.writeAsStringAsync).toHaveBeenCalledWith(
      expect.stringContaining("budget.csv"),
      "header\nrow",
      expect.any(Object)
    );
  });

  it("calls shareAsync when sharing is available", async () => {
    await exportCsvFile("budget.csv", "content");
    expect(Sharing.shareAsync).toHaveBeenCalled();
  });

  it("throws when sharing is not available", async () => {
    (Sharing.isAvailableAsync as jest.Mock).mockResolvedValueOnce(false);
    await expect(exportCsvFile("budget.csv", "content")).rejects.toThrow();
  });
});

// ─── pickCsvFile ─────────────────────────────────────────────────────────────

describe("pickCsvFile", () => {
  beforeEach(() => jest.clearAllMocks());

  it("throws when user cancels the picker", async () => {
    (DocumentPicker.getDocumentAsync as jest.Mock).mockResolvedValueOnce({
      canceled: true,
      assets: [],
    });
    await expect(pickCsvFile()).rejects.toThrow("No file selected");
  });

  it("returns file content when a file is selected", async () => {
    (DocumentPicker.getDocumentAsync as jest.Mock).mockResolvedValueOnce({
      canceled: false,
      assets: [{ uri: "file:///documents/budget.csv" }],
    });
    (FileSystem.readAsStringAsync as jest.Mock).mockResolvedValueOnce("name,monthly_limit\nGroceries,400");

    const content = await pickCsvFile();
    expect(content).toBe("name,monthly_limit\nGroceries,400");
  });

  it("reads from the correct file URI", async () => {
    (DocumentPicker.getDocumentAsync as jest.Mock).mockResolvedValueOnce({
      canceled: false,
      assets: [{ uri: "file:///my-file.csv" }],
    });
    (FileSystem.readAsStringAsync as jest.Mock).mockResolvedValueOnce("data");

    await pickCsvFile();
    expect(FileSystem.readAsStringAsync).toHaveBeenCalledWith(
      "file:///my-file.csv",
      expect.any(Object)
    );
  });
});
