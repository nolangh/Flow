import { useThemeStore } from "@/store/themeStore";

// MMKV is mocked globally in jest.setup.ts.
const { MMKV } = require("react-native-mmkv");

function getMmkvInstance() {
  return (MMKV as jest.Mock & { _instances?: Record<string, unknown> })._instances?.["theme-store"];
}

beforeEach(() => {
  useThemeStore.setState({ theme: "midnight" });
  const inst = getMmkvInstance() as Record<string, jest.Mock> | undefined;
  if (inst) {
    inst.getString.mockReset();
    inst.set.mockReset();
    inst.getString.mockReturnValue(undefined);
  }
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

  it("persists the theme via MMKV", () => {
    const inst = getMmkvInstance();
    useThemeStore.getState().setTheme("garden");
    expect(inst.set).toHaveBeenCalledWith("flow-theme-v1", "garden");
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
    const inst = getMmkvInstance();
    inst.getString.mockReturnValue("midnight");
    await useThemeStore.getState().loadTheme();
    expect(useThemeStore.getState().theme).toBe("midnight");
  });

  it("loads a stored fresh theme", async () => {
    const inst = getMmkvInstance();
    inst.getString.mockReturnValue("fresh");
    await useThemeStore.getState().loadTheme();
    expect(useThemeStore.getState().theme).toBe("fresh");
  });

  it("loads a stored garden theme", async () => {
    const inst = getMmkvInstance();
    inst.getString.mockReturnValue("garden");
    await useThemeStore.getState().loadTheme();
    expect(useThemeStore.getState().theme).toBe("garden");
  });

  it("ignores unknown stored values — state unchanged", async () => {
    const inst = getMmkvInstance();
    useThemeStore.setState({ theme: "fresh" });
    inst.getString.mockReturnValue("purple-rain");
    await useThemeStore.getState().loadTheme();
    expect(useThemeStore.getState().theme).toBe("fresh");
  });

  it("ignores undefined (nothing stored) — state unchanged", async () => {
    const inst = getMmkvInstance();
    useThemeStore.setState({ theme: "midnight" });
    inst.getString.mockReturnValue(undefined);
    await useThemeStore.getState().loadTheme();
    expect(useThemeStore.getState().theme).toBe("midnight");
  });
});
