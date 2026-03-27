# Flow - Personal Finance App

## Overview
Flow is a mobile-first personal and household financial management app built with Expo/React Native. It focuses on budget tracking, recurring bills, and transaction management with a collaborative "household" model for multiple users.

## Tech Stack
- **Framework**: Expo SDK 52 with Expo Router (file-based routing)
- **Frontend**: React Native with NativeWind (Tailwind CSS for RN)
- **Backend**: Supabase (Auth, PostgreSQL database, Realtime)
- **State Management**: Zustand
- **Language**: TypeScript
- **Package Manager**: npm

## Project Layout
```
app/          # Expo Router file-based routes
  (auth)/     # Authentication screens
  (tabs)/     # Main app tabs (Dashboard, Budget, Calendar, Settings)
components/   # Reusable UI components
hooks/        # Custom React hooks
lib/          # Utility functions and API clients (Supabase)
store/        # Zustand stores
supabase/     # Supabase config, migrations, edge functions
trigger/      # Trigger.dev scheduled tasks
types/        # TypeScript type definitions
__tests__/    # Jest test suite
```

## Running Locally
The app runs as an Expo web app on port 5000.
- Workflow: "Start application" → `node_modules/.bin/expo start --web --port 5000`

## Configuration Required
Environment variables needed (set in Replit Secrets):
- `EXPO_PUBLIC_SUPABASE_URL` - Your Supabase project URL
- `EXPO_PUBLIC_SUPABASE_ANON_KEY` - Your Supabase anonymous key
- `SUPABASE_SERVICE_ROLE_KEY` - Supabase service role key (for edge functions)
- `TRIGGER_API_KEY` - Trigger.dev API key (for scheduled tasks)

## Key Decisions
- `web.output` changed from `"static"` to `"single"` to avoid SSR issues with AsyncStorage
- `lib/supabase.ts` uses fallback placeholder values when env vars are not set, to allow the app to render without crashing
- Babel config patched to exclude `react-native-worklets/plugin` (not installed, not needed for this app)
- `react-native-web`, `react-dom`, and `@expo/metro-runtime` installed for Expo web support

## Deployment
Configured as a static deployment:
- Build: `node_modules/.bin/expo export --platform web`
- Public dir: `dist`
