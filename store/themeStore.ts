import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import AsyncStorage from "@react-native-async-storage/async-storage";
import type { ThemeKey } from "@/constants/themes";

interface ThemeState {
  theme: ThemeKey;
  setTheme: (theme: ThemeKey) => void;
}

export const useThemeStore = create<ThemeState>()(
  persist(
    (set) => ({
      theme: "midnight",
      setTheme: (theme) => set({ theme }),
    }),
    {
      name: "flow-theme",
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);
