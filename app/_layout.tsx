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
import { useAuthStore } from "@/store/authStore";
import "../global.css";

SplashScreen.preventAutoHideAsync().catch(() => {});

function hideSplash() {
  SplashScreen.hideAsync().catch(() => {});
}

export default function RootLayout() {
  const { refreshSession } = useAuthStore();

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
      });

      (Text as any).defaultProps = {
        ...(Text as any).defaultProps,
        style: [
          { fontFamily: "Outfit-Regular" },
          (Text as any).defaultProps?.style,
        ],
      };
    };

    const timeoutPromise = new Promise<void>((resolve) =>
      setTimeout(resolve, 2500)
    );

    Promise.all([
      Promise.race([refreshSession().catch(() => {}), timeoutPromise]),
      loadEverything().catch(() => {}),
    ]).finally(() => {
      clearTimeout(safetyTimer);
      hideSplash();
    });

    return () => clearTimeout(safetyTimer);
  }, []);

  return (
    <GestureHandlerRootView style={{ flex: 1, backgroundColor: "#000000" }}>
      <StatusBar style="light" backgroundColor="#000000" />
      <Stack
        screenOptions={{
          headerShown: false,
          contentStyle: { backgroundColor: "#000000" },
        }}
      >
        <Stack.Screen name="(auth)" options={{ headerShown: false }} />
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen name="+not-found" />
      </Stack>
    </GestureHandlerRootView>
  );
}
