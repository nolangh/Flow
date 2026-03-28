// ─── Auth ──────────────────────────────────────────────────────────────────

export interface User {
  id: string;
  email: string;
  full_name: string | null;
  avatar_url: string | null;
  household_id: string | null;
  created_at: string;
}

export interface Household {
  id: string;
  name: string;
  invite_code: string;
  created_at: string;
  members?: User[];
}

// ─── Plaid ─────────────────────────────────────────────────────────────────

export interface PlaidItem {
  id: string;
  household_id: string;
  user_id: string;
  plaid_item_id: string;
  institution_id: string | null;
  institution_name: string | null;
  status: "active" | "error" | "pending_expiration";
  error_code: string | null;
  created_at: string;
  updated_at: string;
}

export interface PlaidAccount {
  id: string;
  item_id: string;
  household_id: string;
  plaid_account_id: string;
  name: string;
  official_name: string | null;
  type: "depository" | "credit" | "loan" | "investment" | "other";
  subtype: string | null;
  mask: string | null;
  current_balance: number | null;
  available_balance: number | null;
  iso_currency_code: string | null;
  created_at: string;
  updated_at: string;
}

// ─── Transactions ──────────────────────────────────────────────────────────

export type TransactionType = "debit" | "credit";

export interface Transaction {
  id: string;
  household_id: string;
  plaid_transaction_id: string | null;
  account_id: string | null;
  budget_category_id: string | null;
  name: string;
  merchant_name: string | null;
  amount: number;          // positive = debit/expense, negative = credit/income
  type: TransactionType;
  date: string;            // ISO date string YYYY-MM-DD
  pending: boolean;
  logo_url: string | null;
  plaid_category: string[] | null;
  is_manual: boolean;
  notes: string | null;
  created_at: string;
  updated_at: string;
  // joined
  category?: BudgetCategory;
}

// ─── Budget ────────────────────────────────────────────────────────────────

export interface BudgetCategory {
  id: string;
  household_id: string;
  name: string;
  emoji: string | null;
  monthly_limit: number;
  color: string | null;
  is_income: boolean;
  is_fixed: boolean;          // fixed recurring bill
  fixed_day_of_month: number | null;
  alert_threshold: number | null;   // 1–100 percent; null = no alert
  created_at: string;
  updated_at: string;
  // computed
  spent?: number;
  remaining?: number;
}

export interface MonthlyBudget {
  id: string;
  household_id: string;
  month: string;             // YYYY-MM
  total_income: number;
  total_limit: number;
  total_spent: number;
  rollover_amount: number;
  created_at: string;
  updated_at: string;
  categories?: BudgetCategory[];
}

// ─── Calendar ──────────────────────────────────────────────────────────────

export type EventSource = "manual" | "google" | "budget_bill" | "recurring";

export interface CalendarEvent {
  id: string;
  household_id: string;
  user_id: string | null;
  title: string;
  description: string | null;
  start_at: string;           // ISO datetime
  end_at: string | null;
  all_day: boolean;
  source: EventSource;
  google_event_id: string | null;
  budget_category_id: string | null;
  amount: number | null;
  color: string | null;
  created_at: string;
  updated_at: string;
}

// ─── Zustand stores ────────────────────────────────────────────────────────

export interface AuthState {
  user: User | null;
  household: Household | null;
  session: { access_token: string; refresh_token: string } | null;
  isLoading: boolean;
  error: string | null;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string, fullName: string) => Promise<void>;
  signInWithGoogle: () => Promise<void>;
  signInWithApple: () => Promise<void>;
  signInWithBiometric: () => Promise<void>;
  signOut: () => Promise<void>;
  refreshSession: () => Promise<void>;
  joinHousehold: (inviteCode: string) => Promise<void>;
  createHousehold: (name: string) => Promise<void>;
}

export interface BudgetState {
  currentMonth: string;       // YYYY-MM
  monthlyBudget: MonthlyBudget | null;
  categories: BudgetCategory[];
  isLoading: boolean;
  error: string | null;
  fetchMonthlyBudget: (month: string) => Promise<void>;
  fetchCategories: () => Promise<void>;
  createCategory: (data: Partial<BudgetCategory>) => Promise<void>;
  updateCategory: (id: string, data: Partial<BudgetCategory>) => Promise<void>;
  deleteCategory: (id: string) => Promise<void>;
  setCurrentMonth: (month: string) => void;
  setTotalLimit: (limit: number) => Promise<void>;
}

export interface TransactionState {
  transactions: Transaction[];
  isLoading: boolean;
  error: string | null;
  fetchTransactions: (month: string) => Promise<void>;
  addManualTransaction: (data: Partial<Transaction>) => Promise<void>;
  updateTransaction: (id: string, data: Partial<Transaction>) => Promise<void>;
  deleteTransaction: (id: string) => Promise<void>;
  reassignCategory: (id: string, categoryId: string) => Promise<void>;
}

// ─── Chart data ────────────────────────────────────────────────────────────

export interface SpendingDataPoint {
  day: number;
  cumulative: number;
  daily: number;
}

export interface ChartPoint {
  x: number;
  y: number;
}
