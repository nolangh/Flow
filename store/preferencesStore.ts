import { create } from "zustand";
import AsyncStorage from "@react-native-async-storage/async-storage";

const STORAGE_KEY = "honeydo-prefs-v1";

interface PreferencesState {
  morningBriefingEnabled: boolean;
  morningBriefingHour: number;   // 0–23, default 8
  loaded: boolean;
  setMorningBriefing: (enabled: boolean) => void;
  setMorningBriefingHour: (hour: number) => void;
  loadPreferences: () => Promise<void>;
}

export const usePreferencesStore = create<PreferencesState>((set, get) => ({
  morningBriefingEnabled: true,
  morningBriefingHour: 8,
  loaded: false,

  setMorningBriefing: (enabled) => {
    set({ morningBriefingEnabled: enabled });
    AsyncStorage.setItem(STORAGE_KEY, JSON.stringify({
      morningBriefingEnabled: enabled,
      morningBriefingHour: get().morningBriefingHour,
    })).catch(() => {});
  },

  setMorningBriefingHour: (hour) => {
    set({ morningBriefingHour: hour });
    AsyncStorage.setItem(STORAGE_KEY, JSON.stringify({
      morningBriefingEnabled: get().morningBriefingEnabled,
      morningBriefingHour: hour,
    })).catch(() => {});
  },

  loadPreferences: async () => {
    try {
      const raw = await AsyncStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        set({
          morningBriefingEnabled: parsed.morningBriefingEnabled ?? true,
          morningBriefingHour: parsed.morningBriefingHour ?? 8,
        });
      }
    } catch {
      // keep defaults
    } finally {
      set({ loaded: true });
    }
  },
}));
