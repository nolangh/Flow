import { Stack } from "expo-router";
import { useThemeStore } from "@/store/themeStore";
import { THEMES } from "@/constants/themes";

export default function AuthLayout() {
  const { theme } = useThemeStore();
  const C = THEMES[theme] ?? THEMES.midnight;
  return (
    <Stack
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: C.bg.app },
        animation: "fade",
      }}
    />
  );
}
