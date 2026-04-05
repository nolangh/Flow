import { create } from "zustand";
import { createMMKV } from "react-native-mmkv";

const storage = createMMKV({ id: "preferences-store" });
const STORAGE_KEY = "honeydo-prefs-v1";

interface PreferencesState {
  morningBriefingEnabled: boolean;
  morningBriefingHour: number;   // 0–23, default 8
  loaded: boolean;
  setMorningBriefing: (enabled: boolean) => void;
  setMorningBriefingHour: (hour: number) => void;
  loadPreferences: () => Promise<void>;
}

function persist(state: { morningBriefingEnabled: boolean; morningBriefingHour: number }) {
  storage.set(STORAGE_KEY, JSON.stringify(state));
}

export const usePreferencesStore = create<PreferencesState>((set, get) => ({
  morningBriefingEnabled: true,
  morningBriefingHour: 8,
  loaded: false,

  setMorningBriefing: (enabled) => {
    set({ morningBriefingEnabled: enabled });
    persist({ morningBriefingEnabled: enabled, morningBriefingHour: get().morningBriefingHour });
  },

  setMorningBriefingHour: (hour) => {
    set({ morningBriefingHour: hour });
    persist({ morningBriefingEnabled: get().morningBriefingEnabled, morningBriefingHour: hour });
  },

  // Synchronous under the hood — MMKV reads don't need await
  loadPreferences: async () => {
    try {
      const raw = storage.getString(STORAGE_KEY);
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
