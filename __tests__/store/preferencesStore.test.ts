import AsyncStorage from "@react-native-async-storage/async-storage";
import { usePreferencesStore } from "@/store/preferencesStore";

const STORAGE_KEY = "honeydo-prefs-v1";

beforeEach(async () => {
  usePreferencesStore.setState({
    morningBriefingEnabled: true,
    morningBriefingHour: 8,
    loaded: false,
  });
  await AsyncStorage.clear();
  jest.clearAllMocks();
});

describe("preferencesStore — initial state", () => {
  it("defaults morning briefing to enabled", () => {
    expect(usePreferencesStore.getState().morningBriefingEnabled).toBe(true);
  });

  it("defaults morning briefing hour to 8", () => {
    expect(usePreferencesStore.getState().morningBriefingHour).toBe(8);
  });

  it("starts as not loaded", () => {
    expect(usePreferencesStore.getState().loaded).toBe(false);
  });
});

describe("setMorningBriefing", () => {
  it("updates morningBriefingEnabled", () => {
    usePreferencesStore.getState().setMorningBriefing(false);
    expect(usePreferencesStore.getState().morningBriefingEnabled).toBe(false);
  });

  it("persists the updated value to AsyncStorage", async () => {
    usePreferencesStore.getState().setMorningBriefing(false);
    await Promise.resolve();
    expect(AsyncStorage.setItem).toHaveBeenCalledWith(
      STORAGE_KEY,
      expect.stringContaining('"morningBriefingEnabled":false')
    );
  });

  it("persists the current hour alongside the new enabled value", async () => {
    usePreferencesStore.setState({ morningBriefingHour: 7 });
    usePreferencesStore.getState().setMorningBriefing(false);
    await Promise.resolve();
    expect(AsyncStorage.setItem).toHaveBeenCalledWith(
      STORAGE_KEY,
      expect.stringContaining('"morningBriefingHour":7')
    );
  });
});

describe("setMorningBriefingHour", () => {
  it("updates morningBriefingHour", () => {
    usePreferencesStore.getState().setMorningBriefingHour(6);
    expect(usePreferencesStore.getState().morningBriefingHour).toBe(6);
  });

  it("persists the updated hour to AsyncStorage", async () => {
    usePreferencesStore.getState().setMorningBriefingHour(9);
    await Promise.resolve();
    expect(AsyncStorage.setItem).toHaveBeenCalledWith(
      STORAGE_KEY,
      expect.stringContaining('"morningBriefingHour":9')
    );
  });

  it("includes current enabled state in the persisted value", async () => {
    usePreferencesStore.setState({ morningBriefingEnabled: false });
    usePreferencesStore.getState().setMorningBriefingHour(10);
    await Promise.resolve();
    expect(AsyncStorage.setItem).toHaveBeenCalledWith(
      STORAGE_KEY,
      expect.stringContaining('"morningBriefingEnabled":false')
    );
  });
});

describe("loadPreferences", () => {
  it("sets loaded=true after completing", async () => {
    (AsyncStorage.getItem as jest.Mock).mockResolvedValueOnce(null);
    await usePreferencesStore.getState().loadPreferences();
    expect(usePreferencesStore.getState().loaded).toBe(true);
  });

  it("restores saved preferences", async () => {
    const saved = JSON.stringify({ morningBriefingEnabled: false, morningBriefingHour: 6 });
    (AsyncStorage.getItem as jest.Mock).mockResolvedValueOnce(saved);
    await usePreferencesStore.getState().loadPreferences();
    expect(usePreferencesStore.getState().morningBriefingEnabled).toBe(false);
    expect(usePreferencesStore.getState().morningBriefingHour).toBe(6);
  });

  it("uses defaults when nothing is stored", async () => {
    (AsyncStorage.getItem as jest.Mock).mockResolvedValueOnce(null);
    await usePreferencesStore.getState().loadPreferences();
    expect(usePreferencesStore.getState().morningBriefingEnabled).toBe(true);
    expect(usePreferencesStore.getState().morningBriefingHour).toBe(8);
  });

  it("uses defaults when stored JSON is malformed", async () => {
    (AsyncStorage.getItem as jest.Mock).mockResolvedValueOnce("{invalid}");
    await usePreferencesStore.getState().loadPreferences();
    expect(usePreferencesStore.getState().loaded).toBe(true);
    expect(usePreferencesStore.getState().morningBriefingHour).toBe(8);
  });

  it("sets loaded=true even when AsyncStorage throws", async () => {
    (AsyncStorage.getItem as jest.Mock).mockRejectedValueOnce(new Error("storage error"));
    await usePreferencesStore.getState().loadPreferences();
    expect(usePreferencesStore.getState().loaded).toBe(true);
  });
});
