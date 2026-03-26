import { useEffect } from "react";
import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import * as SplashScreen from "expo-splash-screen";
import { useAuthStore } from "@/store/authStore";
import "../global.css";

SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const { refreshSession } = useAuthStore();

  useEffect(() => {
    refreshSession().finally(() => SplashScreen.hideAsync());
  }, []);

  return (
    <GestureHandlerRootView style={{ flex: 1, backgroundColor: "#000000" }}>
      <StatusBar style="light" backgroundColor="#000000" />
      <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: "#000000" } }}>
        <Stack.Screen name="(auth)" options={{ headerShown: false }} />
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen name="+not-found" />
      </Stack>
    </GestureHandlerRootView>
  );
}
