import { useEffect } from "react";
import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import * as SplashScreen from "expo-splash-screen";
import { useAuthStore } from "@/store/authStore";
import "../global.css";

SplashScreen.preventAutoHideAsync().catch(() => {});

function hideSplash() {
  SplashScreen.hideAsync().catch(() => {});
}

export default function RootLayout() {
  const { refreshSession } = useAuthStore();

  useEffect(() => {
    // Safety net: always hide splash within 3 seconds no matter what
    const safetyTimer = setTimeout(hideSplash, 3000);

    const timeoutPromise = new Promise<void>((resolve) =>
      setTimeout(resolve, 2500)
    );

    Promise.race([refreshSession().catch(() => {}), timeoutPromise]).finally(
      () => {
        clearTimeout(safetyTimer);
        hideSplash();
      }
    );

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
