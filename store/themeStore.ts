import { create } from "zustand";
import AsyncStorage from "@react-native-async-storage/async-storage";
import type { ThemeKey } from "@/constants/themes";

const STORAGE_KEY = "flow-theme-v1";

interface ThemeState {
  theme: ThemeKey;
  setTheme: (theme: ThemeKey) => void;
  loadTheme: () => Promise<void>;
}

export const useThemeStore = create<ThemeState>((set) => ({
  theme: "midnight",

  setTheme: (theme: ThemeKey) => {
    set({ theme });
    AsyncStorage.setItem(STORAGE_KEY, theme).catch(() => {});
  },

  loadTheme: async () => {
    try {
      const stored = await AsyncStorage.getItem(STORAGE_KEY);
      if (stored === "midnight" || stored === "fresh" || stored === "garden") {
        set({ theme: stored });
      }
    } catch {
      // keep default
    }
  },
}));
