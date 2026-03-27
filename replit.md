# Flow — Personal Finance App

## Overview
Flow is a mobile-first personal and household financial management app built with Expo/React Native. It supports budget tracking, recurring bills, transaction management, and a shared "household" model for partners.

## Tech Stack
- **Framework**: Expo SDK 54 with Expo Router (file-based routing)
- **Frontend**: React Native (inline styles via `constants/theme.ts` design system)
- **Backend**: Supabase (Auth, PostgreSQL, Realtime subscriptions)
- **State Management**: Zustand
- **Icons**: `@expo/vector-icons` (Ionicons)
- **Charts**: `react-native-svg` (BezierChart component)
- **Animations**: `react-native-reanimated` v4 + `react-native-worklets`
- **Language**: TypeScript
- **Package Manager**: npm

## Project Layout
```
app/
  (auth)/       # Login, Register, Household setup screens
  (tabs)/       # Dashboard, Budget, Calendar, Profile tabs
  _layout.tsx   # Root layout (GestureHandlerRootView, SplashScreen)
  index.tsx     # Auth redirect guard
components/
  ui/           # Card, Button, ProgressBar, BezierChart, EmptyState, Divider
  budget/       # CategoryCard, AddTransactionModal, AddCategoryModal
  dashboard/    # TransactionItem
constants/
  theme.ts      # Full design system — colors, spacing, typography, helpers
hooks/
  useBudgetSummary.ts
  useCalendarEvents.ts
  useRealtimeSync.ts
lib/
  supabase.ts   # Supabase client + realtime helpers
  utils.ts      # Formatting, date helpers
store/
  authStore.ts
  budgetStore.ts
  transactionStore.ts
types/
  index.ts
assets/
  images/       # icon.png, splash.png, adaptive-icon.png, favicon.png
```

## Running the App
- **Workflow**: `node_modules/.bin/expo start --tunnel --port 5000`
- Tunnel mode required for Expo Go on physical devices (QR scan)
- Web preview: `http://localhost:5000`

## Configuration Required
Set these in Replit Secrets:
- `EXPO_PUBLIC_SUPABASE_URL` — Supabase project URL
- `EXPO_PUBLIC_SUPABASE_ANON_KEY` — Supabase anonymous key
- `SUPABASE_SERVICE_ROLE_KEY` — Service role key (edge functions)

The app falls back to placeholder values when these are not set, so it renders without crashing during development.

## Key Technical Decisions
- **Expo SDK 54**: Uses React 19.1.0, React Native 0.81.5
- **Reanimated v4**: Requires `react-native-worklets` package; only `react-native-worklets/plugin` should be in Babel (NOT `react-native-reanimated/plugin` — that causes a duplicate plugin error)
- **No NativeWind `className`**: All styles use inline `StyleSheet` / theme tokens. NativeWind/Tailwind CSS-interop is still in the pipeline but all screens use direct style props
- **Babel config**: Uses `react-native-css-interop/dist/babel-plugin` directly (not via `nativewind/babel` wrapper), plus `@babel/plugin-transform-react-jsx` with `importSource: "react-native-css-interop"`, plus `react-native-worklets/plugin`
- **app.json `web.output`**: Set to `"single"` (not `"static"`) to avoid SSR crashes with AsyncStorage
- **Supabase client**: Initialized with fallback placeholder URLs so the app doesn't crash without env vars

## Design System (`constants/theme.ts`)
- Background: `#000000` / surfaces `#141414`, `#1C1C1E`
- Primary accent: `#00D632` (Cash App green)
- Danger: `#FF453A`, Warning: `#FF9F0A`
- Text: white → `#AFAFB8` → `#636366`
- Backward-compat aliases: `Colors.neonGreen`, `Colors.dangerPink`, etc. still work

## Deployment
- Build: `node_modules/.bin/expo export --platform web`
- Output directory: `dist/`
