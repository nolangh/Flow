import { useEffect } from "react";
import { Text } from "react-native";
import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import * as SplashScreen from "expo-splash-screen";
import * as Font from "expo-font";
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
import "../global.css";

SplashScreen.preventAutoHideAsync().catch(() => {});

function hideSplash() {
  SplashScreen.hideAsync().catch(() => {});
}

export default function RootLayout() {
  const { refreshSession } = useAuthStore();
  const { theme, loadTheme } = useThemeStore();
  const C = THEMES[theme] ?? THEMES.midnight;

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
