import { useEffect } from "react";
import { Text } from "react-native";
import { Stack, useNavigationContainerRef } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import * as SplashScreen from "expo-splash-screen";
import * as Font from "expo-font";
import * as Sentry from "@sentry/react-native";
import {
  Outfit_300Light,
  Outfit_400Regular,
  Outfit_500Medium,
  Outfit_600SemiBold,
  Outfit_700Bold,
  Outfit_800ExtraBold,
  Outfit_900Black,
} from "@expo-google-fonts/outfit";
import {
  SpaceGrotesk_300Light,
  SpaceGrotesk_400Regular,
  SpaceGrotesk_500Medium,
  SpaceGrotesk_600SemiBold,
  SpaceGrotesk_700Bold,
} from "@expo-google-fonts/space-grotesk";
import { useAuthStore } from "@/store/authStore";
import { useThemeStore } from "@/store/themeStore";
import { THEMES } from "@/constants/themes";
import { logger } from "@/lib/logger";
import { runSecurityChecks } from "@/lib/security";
import "../global.css";

// ─── Sentry — initialise before any component renders ────────────────────────
const navigationIntegration = Sentry.reactNavigationIntegration({ enableTimeToInitialDisplay: true });

Sentry.init({
  dsn: process.env.EXPO_PUBLIC_SENTRY_DSN,
  enabled: !!process.env.EXPO_PUBLIC_SENTRY_DSN,

  // Performance: sample 20% of transactions in prod, 100% in dev
  tracesSampleRate: __DEV__ ? 1.0 : 0.2,

  // Session replay: only capture on crashes in prod (privacy-conscious default)
  replaysSessionSampleRate: 0,
  replaysOnErrorSampleRate: __DEV__ ? 1.0 : 0.5,

  integrations: [
    navigationIntegration,
    Sentry.mobileReplayIntegration({
      // Mask all text and images by default — important for a fintech app
      maskAllText: true,
      maskAllImages: true,
    }),
  ],

  // Don't send PII — strip user IPs from events
  sendDefaultPii: false,

  environment: __DEV__ ? "development" : "production",

  beforeSend(event) {
    // Drop events with no stack trace in production (likely noise)
    if (!__DEV__ && !event.exception?.values?.[0]?.stacktrace) return null;
    return event;
  },
});

SplashScreen.preventAutoHideAsync().catch(() => {});

// Global unhandled JS error → Sentry + BetterStack
if (typeof ErrorUtils !== "undefined") {
  const previousHandler = ErrorUtils.getGlobalHandler();
  ErrorUtils.setGlobalHandler((error: Error, isFatal?: boolean) => {
    logger.captureError(error, { isFatal: isFatal ?? false, source: "global" });
    previousHandler(error, isFatal);
  });
}

function hideSplash() {
  SplashScreen.hideAsync().catch(() => {});
}

export default function RootLayout() {
  const { refreshSession } = useAuthStore();
  const { theme, loadTheme } = useThemeStore();
  const C = THEMES[theme] ?? THEMES.midnight;

  // Register the navigation container with Sentry for screen tracking
  const navigationRef = useNavigationContainerRef();
  useEffect(() => {
    if (navigationRef?.isReady()) {
      navigationIntegration.registerNavigationContainer(navigationRef);
    }
  }, [navigationRef]);

  // Update Text.defaultProps whenever theme changes so fallback font matches
  useEffect(() => {
    const fontFamily = theme === "fresh" ? "SpaceGrotesk-Regular" : "Outfit-Regular";
    (Text as any).defaultProps = {
      style: [{ fontFamily }],
    };
  }, [theme]);

  useEffect(() => {
    const safetyTimer = setTimeout(hideSplash, 3500);

    const loadEverything = async () => {
      await Font.loadAsync({
        "Outfit-Light":     Outfit_300Light,
        "Outfit-Regular":   Outfit_400Regular,
        "Outfit-Medium":    Outfit_500Medium,
        "Outfit-SemiBold":  Outfit_600SemiBold,
        "Outfit-Bold":      Outfit_700Bold,
        "Outfit-ExtraBold": Outfit_800ExtraBold,
        "Outfit-Black":     Outfit_900Black,
        "SpaceGrotesk-Light":    SpaceGrotesk_300Light,
        "SpaceGrotesk-Regular":  SpaceGrotesk_400Regular,
        "SpaceGrotesk-Medium":   SpaceGrotesk_500Medium,
        "SpaceGrotesk-SemiBold": SpaceGrotesk_600SemiBold,
        "SpaceGrotesk-Bold":     SpaceGrotesk_700Bold,
      });
    };

    const timeoutPromise = new Promise<void>((resolve) =>
      setTimeout(resolve, 2500)
    );

    Promise.all([
      Promise.race([refreshSession().catch(() => {}), timeoutPromise]),
      loadEverything().catch(() => {}),
      loadTheme().catch(() => {}),
      runSecurityChecks().catch(() => {}),
    ]).finally(() => {
      clearTimeout(safetyTimer);
      hideSplash();
    });

    return () => clearTimeout(safetyTimer);
  }, []);

  return (
    <GestureHandlerRootView style={{ flex: 1, backgroundColor: C.bg.app }}>
      <StatusBar style={theme === "fresh" ? "dark" : "light"} backgroundColor={C.bg.app} />
      <Stack
        screenOptions={{
          headerShown: false,
          contentStyle: { backgroundColor: C.bg.app },
        }}
      >
        <Stack.Screen name="(auth)" options={{ headerShown: false }} />
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen name="+not-found" />
      </Stack>
    </GestureHandlerRootView>
  );
}
