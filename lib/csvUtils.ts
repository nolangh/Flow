/**
 * CSV import/export utilities for Flow budget data.
 *
 * Export: generates a CSV string that can be shared via expo-sharing.
 * Import: parses a CSV file and returns structured budget rows.
 *
 * TO ENABLE FILE SHARING:
 *  Run: npx expo install expo-file-system expo-sharing expo-document-picker
 *  Then uncomment the imports below.
 */

// import * as FileSystem from "expo-file-system";       // <-- uncomment after install
// import * as Sharing from "expo-sharing";               // <-- uncomment after install
// import * as DocumentPicker from "expo-document-picker"; // <-- uncomment after install

export interface BudgetCsvRow {
  name: string;
  type: "fixed" | "spending" | "income";
  monthly_limit: number;
  fixed_day_of_month?: number;
  emoji?: string;
}

export interface TransactionCsvRow {
  date: string;
  name: string;
  amount: number;
  category: string;
  type: "debit" | "credit";
  note?: string;
}

// ─── Export ──────────────────────────────────────────────────────────────────

function escapeCsv(val: string | number | undefined | null): string {
  const s = String(val ?? "");
  return s.includes(",") || s.includes('"') || s.includes("\n")
    ? `"${s.replace(/"/g, '""')}"`
    : s;
}

export function buildBudgetCsv(
  categories: { name: string; monthly_limit: number; is_fixed: boolean; is_income: boolean; fixed_day_of_month?: number | null; emoji?: string }[]
): string {
  const header = "name,type,monthly_limit,fixed_day_of_month,emoji";
  const rows = categories.map((c) => {
    const type = c.is_income ? "income" : c.is_fixed ? "fixed" : "spending";
    return [
      escapeCsv(c.name),
      type,
      c.monthly_limit,
      c.fixed_day_of_month ?? "",
      escapeCsv(c.emoji ?? ""),
    ].join(",");
  });
  return [header, ...rows].join("\n");
}

export function buildTransactionCsv(
  transactions: { date: string; name: string; amount: number; category_name?: string; pending?: boolean; note?: string }[]
): string {
  const header = "date,name,amount,category,type,note";
  const rows = transactions.map((t) => [
    escapeCsv(t.date),
    escapeCsv(t.name),
    Math.abs(t.amount),
    escapeCsv(t.category_name ?? "Uncategorized"),
    t.amount < 0 ? "debit" : "credit",
    escapeCsv(t.note ?? ""),
  ].join(","));
  return [header, ...rows].join("\n");
}

// ─── Import ───────────────────────────────────────────────────────────────────

export function parseBudgetCsv(csvText: string): BudgetCsvRow[] {
  const lines = csvText.trim().split("\n");
  if (lines.length < 2) return [];

  const header = lines[0].split(",").map((h) => h.trim().toLowerCase());
  const nameIdx = header.indexOf("name");
  const typeIdx = header.indexOf("type");
  const limitIdx = header.indexOf("monthly_limit");
  const dayIdx = header.indexOf("fixed_day_of_month");
  const emojiIdx = header.indexOf("emoji");

  if (nameIdx === -1 || limitIdx === -1) {
    throw new Error('CSV must have "name" and "monthly_limit" columns.');
  }

  return lines
    .slice(1)
    .filter((l) => l.trim())
    .map((line) => {
      const cols = splitCsvLine(line);
      const type = (cols[typeIdx] ?? "spending").toLowerCase();
      return {
        name: cols[nameIdx]?.trim() ?? "",
        type: (["fixed", "spending", "income"].includes(type) ? type : "spending") as BudgetCsvRow["type"],
        monthly_limit: parseFloat(cols[limitIdx]) || 0,
        fixed_day_of_month: dayIdx !== -1 && cols[dayIdx] ? parseInt(cols[dayIdx]) || undefined : undefined,
        emoji: emojiIdx !== -1 ? cols[emojiIdx]?.trim() || undefined : undefined,
      };
    })
    .filter((r) => r.name && r.monthly_limit > 0);
}

function splitCsvLine(line: string): string[] {
  const result: string[] = [];
  let current = "";
  let inQuotes = false;
  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (ch === '"') {
      if (inQuotes && line[i + 1] === '"') { current += '"'; i++; }
      else inQuotes = !inQuotes;
    } else if (ch === "," && !inQuotes) {
      result.push(current); current = "";
    } else {
      current += ch;
    }
  }
  result.push(current);
  return result;
}

// ─── Share helpers (stubs until expo-sharing is installed) ────────────────────

export async function exportCsvFile(filename: string, content: string): Promise<void> {
  // TODO: uncomment after running: npx expo install expo-file-system expo-sharing
  //
  // const uri = FileSystem.cacheDirectory + filename;
  // await FileSystem.writeAsStringAsync(uri, content, { encoding: FileSystem.EncodingType.UTF8 });
  // const canShare = await Sharing.isAvailableAsync();
  // if (canShare) {
  //   await Sharing.shareAsync(uri, { mimeType: "text/csv", dialogTitle: "Export CSV" });
  // }
  console.log(`[CSV Export] ${filename}\n${content.slice(0, 300)}...`);
  throw new Error(
    "File sharing not yet installed. Run: npx expo install expo-file-system expo-sharing"
  );
}

export async function pickCsvFile(): Promise<string> {
  // TODO: uncomment after running: npx expo install expo-document-picker
  //
  // const result = await DocumentPicker.getDocumentAsync({ type: "text/csv", copyToCacheDirectory: true });
  // if (result.canceled) throw new Error("Cancelled");
  // return await FileSystem.readAsStringAsync(result.assets[0].uri);
  throw new Error(
    "Document picker not yet installed. Run: npx expo install expo-document-picker expo-file-system"
  );
}
