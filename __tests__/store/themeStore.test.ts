import AsyncStorage from "@react-native-async-storage/async-storage";
import { useThemeStore } from "@/store/themeStore";

const STORAGE_KEY = "flow-theme-v1";

beforeEach(async () => {
  // Reset store to default state between tests
  useThemeStore.setState({ theme: "midnight" });
  await AsyncStorage.clear();
  jest.clearAllMocks();
});

describe("themeStore — initial state", () => {
  it("defaults to midnight theme", () => {
    expect(useThemeStore.getState().theme).toBe("midnight");
  });
});

describe("setTheme", () => {
  it("updates the theme state immediately", () => {
    useThemeStore.getState().setTheme("fresh");
    expect(useThemeStore.getState().theme).toBe("fresh");
  });

  it("persists the theme to AsyncStorage", async () => {
    useThemeStore.getState().setTheme("garden");
    // setItem is fire-and-forget, give it a tick
    await Promise.resolve();
    expect(AsyncStorage.setItem).toHaveBeenCalledWith(STORAGE_KEY, "garden");
  });

  it("accepts all three valid themes", () => {
    const themes = ["midnight", "fresh", "garden"] as const;
    for (const theme of themes) {
      useThemeStore.getState().setTheme(theme);
      expect(useThemeStore.getState().theme).toBe(theme);
    }
  });
});

describe("loadTheme", () => {
  it("loads a stored midnight theme", async () => {
    (AsyncStorage.getItem as jest.Mock).mockResolvedValueOnce("midnight");
    await useThemeStore.getState().loadTheme();
    expect(useThemeStore.getState().theme).toBe("midnight");
  });

  it("loads a stored fresh theme", async () => {
    (AsyncStorage.getItem as jest.Mock).mockResolvedValueOnce("fresh");
    await useThemeStore.getState().loadTheme();
    expect(useThemeStore.getState().theme).toBe("fresh");
  });

  it("loads a stored garden theme", async () => {
    (AsyncStorage.getItem as jest.Mock).mockResolvedValueOnce("garden");
    await useThemeStore.getState().loadTheme();
    expect(useThemeStore.getState().theme).toBe("garden");
  });

  it("ignores unknown stored values", async () => {
    useThemeStore.setState({ theme: "fresh" });
    (AsyncStorage.getItem as jest.Mock).mockResolvedValueOnce("purple-rain");
    await useThemeStore.getState().loadTheme();
    // State should remain unchanged
    expect(useThemeStore.getState().theme).toBe("fresh");
  });

  it("ignores null (nothing stored)", async () => {
    useThemeStore.setState({ theme: "midnight" });
    (AsyncStorage.getItem as jest.Mock).mockResolvedValueOnce(null);
    await useThemeStore.getState().loadTheme();
    expect(useThemeStore.getState().theme).toBe("midnight");
  });

  it("keeps default when AsyncStorage throws", async () => {
    (AsyncStorage.getItem as jest.Mock).mockRejectedValueOnce(new Error("read error"));
    await useThemeStore.getState().loadTheme();
    expect(useThemeStore.getState().theme).toBe("midnight");
  });
});
