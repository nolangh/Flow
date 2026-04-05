import { usePreferencesStore } from "@/store/preferencesStore";

// createMMKV is mocked globally in jest.setup.ts.
// Instances are tracked in global.__mmkvInstances by store id.
type MockMMKVInstance = {
  getString: jest.Mock;
  set: jest.Mock;
  getBoolean: jest.Mock;
  getNumber: jest.Mock;
  delete: jest.Mock;
  clearAll: jest.Mock;
};

function getMmkvInstance(): MockMMKVInstance {
  return ((global as Record<string, unknown>).__mmkvInstances as Record<string, MockMMKVInstance>)["preferences-store"];
}

const STORAGE_KEY = "honeydo-prefs-v1";

beforeEach(() => {
  usePreferencesStore.setState({
    morningBriefingEnabled: true,
    morningBriefingHour: 8,
    loaded: false,
  });
  const inst = getMmkvInstance();
  if (inst) {
    inst.getString.mockReset();
    inst.set.mockReset();
    inst.getString.mockReturnValue(undefined);
  }
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

  it("persists the updated value via MMKV", () => {
    const inst = getMmkvInstance();
    usePreferencesStore.getState().setMorningBriefing(false);
    expect(inst.set).toHaveBeenCalledWith(
      STORAGE_KEY,
      expect.stringContaining('"morningBriefingEnabled":false')
    );
  });

  it("persists the current hour alongside the new enabled value", () => {
    const inst = getMmkvInstance();
    usePreferencesStore.setState({ morningBriefingHour: 7 });
    usePreferencesStore.getState().setMorningBriefing(false);
    expect(inst.set).toHaveBeenCalledWith(
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

  it("persists the updated hour via MMKV", () => {
    const inst = getMmkvInstance();
    usePreferencesStore.getState().setMorningBriefingHour(9);
    expect(inst.set).toHaveBeenCalledWith(
      STORAGE_KEY,
      expect.stringContaining('"morningBriefingHour":9')
    );
  });

  it("includes current enabled state in the persisted value", () => {
    const inst = getMmkvInstance();
    usePreferencesStore.setState({ morningBriefingEnabled: false });
    usePreferencesStore.getState().setMorningBriefingHour(10);
    expect(inst.set).toHaveBeenCalledWith(
      STORAGE_KEY,
      expect.stringContaining('"morningBriefingEnabled":false')
    );
  });
});

describe("loadPreferences", () => {
  it("sets loaded=true after completing", async () => {
    const inst = getMmkvInstance();
    inst.getString.mockReturnValue(undefined);
    await usePreferencesStore.getState().loadPreferences();
    expect(usePreferencesStore.getState().loaded).toBe(true);
  });

  it("restores saved preferences from MMKV", async () => {
    const inst = getMmkvInstance();
    const saved = JSON.stringify({ morningBriefingEnabled: false, morningBriefingHour: 6 });
    inst.getString.mockReturnValue(saved);
    await usePreferencesStore.getState().loadPreferences();
    expect(usePreferencesStore.getState().morningBriefingEnabled).toBe(false);
    expect(usePreferencesStore.getState().morningBriefingHour).toBe(6);
  });

  it("uses defaults when nothing is stored", async () => {
    const inst = getMmkvInstance();
    inst.getString.mockReturnValue(undefined);
    await usePreferencesStore.getState().loadPreferences();
    expect(usePreferencesStore.getState().morningBriefingEnabled).toBe(true);
    expect(usePreferencesStore.getState().morningBriefingHour).toBe(8);
  });

  it("uses defaults when stored JSON is malformed", async () => {
    const inst = getMmkvInstance();
    inst.getString.mockReturnValue("{invalid json}");
    await usePreferencesStore.getState().loadPreferences();
    expect(usePreferencesStore.getState().loaded).toBe(true);
    expect(usePreferencesStore.getState().morningBriefingHour).toBe(8);
  });

  it("sets loaded=true even when getString throws", async () => {
    const inst = getMmkvInstance();
    inst.getString.mockImplementation(() => { throw new Error("storage error"); });
    await usePreferencesStore.getState().loadPreferences();
    expect(usePreferencesStore.getState().loaded).toBe(true);
  });
});
