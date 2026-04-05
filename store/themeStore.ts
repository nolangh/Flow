import { create } from "zustand";
import { createMMKV } from "react-native-mmkv";
import type { ThemeKey } from "@/constants/themes";

const storage = createMMKV({ id: "theme-store" });
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
    storage.set(STORAGE_KEY, theme);
  },

  // Synchronous under the hood — MMKV reads don't need await
  loadTheme: async () => {
    const stored = storage.getString(STORAGE_KEY);
    if (stored === "midnight" || stored === "fresh" || stored === "garden") {
      set({ theme: stored });
    }
  },
}));
