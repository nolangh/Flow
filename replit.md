# Flow — Personal Finance App

## Overview
Flow is a mobile-first personal and household financial management app built with Expo/React Native. It supports budget tracking, recurring bills, transaction management, a shared "household" model, AI budget analysis, goals tracking, bank account linking (Plaid), CSV import/export, and a premium subscription tier.

## Tech Stack
- **Framework**: Expo SDK 54 with Expo Router (file-based routing)
- **Frontend**: React Native (inline styles via `constants/theme.ts` design system)
- **Backend**: Supabase (Auth, PostgreSQL, Realtime subscriptions, Edge Functions)
- **State Management**: Zustand
- **Icons**: `@expo/vector-icons` (Ionicons)
- **Charts**: `react-native-svg` (custom donut + bar charts in `components/budget/AllocationChart.tsx`)
- **Animations**: `react-native-reanimated` v4 + `react-native-worklets`
- **File I/O**: `expo-file-system`, `expo-sharing`, `expo-document-picker`
- **Language**: TypeScript
- **Package Manager**: npm

## Project Layout
```
app/
  (auth)/         # Login, Register, Household setup screens
  (tabs)/         # Dashboard, Budget, Goals, Calendar, Profile, Upgrade tabs
  accounts.tsx    # Bank accounts & Bill Pay management screen
  upgrade.tsx     # Premium upgrade/paywall screen (Adaptly)
  _layout.tsx     # Root layout
components/
  ui/             # Button (with icon), ProgressBar (with color), EmptyState, Divider
  budget/         # CategoryCard, AddTransactionModal, AddCategoryModal, EditCategoryModal, AllocationChart
  premium/        # AiAnalysisSheet, BillPayTracker
  dashboard/      # TransactionItem
constants/
  theme.ts        # Full design system — Colors.accent = #00D632
  features.ts     # Premium feature flags, UPGRADE_BENEFITS, isPremium()
hooks/
  useBudgetSummary.ts
  useCalendarEvents.ts
  useRealtimeSync.ts
lib/
  supabase.ts     # Supabase client (supabaseConfigured flag)
  plaid.ts        # Plaid edge function calls (link token, exchange, sync)
  openai.ts       # OpenAI GPT-4o-mini budget analysis (EXPO_PUBLIC_OPENAI_API_KEY)
  adaptly.ts      # Adaptly paywall abstraction (EXPO_PUBLIC_ADAPTLY_KEY)
  csvUtils.ts     # CSV import/export (expo-file-system, expo-sharing, expo-document-picker)
  utils.ts        # formatCurrency, currentYearMonth, formatMonth
store/
  authStore.ts    # Auth + household state
  budgetStore.ts  # Categories, monthly budget, CRUD
  transactionStore.ts
  goalsStore.ts   # Goals CRUD (premium feature)
supabase/
  migrations/
    001_initial_schema.sql  # Core tables + RLS + triggers
    002_goals.sql           # Goals table
    003_plaid_accounts.sql  # Plaid accounts + bill_pay_links tables
```

## Navigation (Tab Bar)
| Tab | Screen | Description |
|-----|--------|-------------|
| Home | `index.tsx` | Dashboard — balance, recent transactions, fixed bills |
| Budget | `budget.tsx` | Overview / Charts / History tabs + AI analysis + CSV |
| Goals | `goals.tsx` | Savings goals with progress rings |
| Calendar | `calendar.tsx` | Monthly calendar + event management |
| Profile | `settings.tsx` | Account, banking, CSV import, upgrade |

## Premium Features
All premium features are unlocked in dev mode (no Adaptly key configured).

| Feature | Status | Key Required |
|---------|--------|-------------|
| AI Budget Analysis | Built (full UI) | `EXPO_PUBLIC_OPENAI_KEY` |
| Budget Allocation Charts | Built ✓ | — |
| Goals | Built ✓ | — |
| CSV Import/Export | Built ✓ | — |
| Bill Pay Tracker | Built ✓ | — |
| Plaid Bank Sync | Boilerplate ✓ | Plaid credentials + Edge Functions |
| Paywall (Adaptly) | Boilerplate ✓ | `EXPO_PUBLIC_ADAPTLY_KEY` + SDK install |

## Babel / Metro Critical Notes
- Babel: Only `react-native-worklets/plugin` — NOT `react-native-reanimated/plugin`
- Metro blockList: `/.local/.*` and `/.git/.*`
- `web.output: "single"` in app.json to prevent SSR crashes

## Supabase SQL to Run
Run these in order in Supabase SQL Editor:
1. `supabase/migrations/001_initial_schema.sql`
2. `supabase/migrations/002_goals.sql`
3. `supabase/migrations/003_plaid_accounts.sql`
4. RPC functions: `create_household`, `join_household`, `create_calendar_event`

## Key Design Decisions
- **RLS bypass pattern**: Security-definer RPC functions for inserts that fail RLS (households, calendar events)
- **`supabaseConfigured` flag**: Skips all network calls when credentials are placeholders
- **CHART_COLORS**: Defined inline in budget.tsx (10 colors cycling)
- **Category types**: `is_income`, `is_fixed` flags drive UI section (Income / Fixed Bills / Spending)
- **Bill pay links**: Stored in `bill_pay_links` table (Supabase), manually managed in BillPayTracker component
