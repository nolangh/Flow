import "@testing-library/jest-native/extend-expect";

// ─── Mock react-native-mmkv ────────────────────────────────────────────────
// Stores use createMMKV({ id }) — we track instances by id so tests can inspect them.
jest.mock("react-native-mmkv", () => {
  // instances map lives inside the factory so it's not an out-of-scope variable
  const instances: Record<string, Record<string, unknown>> = {};

  function makeMock(id: string) {
    const s: Record<string, unknown> = {};
    const inst = {
      _id: id,
      set: jest.fn((key: string, value: unknown) => { s[key] = value; }),
      getString: jest.fn((key: string) => (typeof s[key] === "string" ? (s[key] as string) : undefined)),
      getBoolean: jest.fn((key: string) => (typeof s[key] === "boolean" ? (s[key] as boolean) : undefined)),
      getNumber: jest.fn((key: string) => (typeof s[key] === "number" ? (s[key] as number) : undefined)),
      delete: jest.fn((key: string) => { delete s[key]; }),
      contains: jest.fn((key: string) => key in s),
      getAllKeys: jest.fn(() => Object.keys(s)),
      clearAll: jest.fn(() => { Object.keys(s).forEach((k) => delete s[k]); }),
      addOnValueChangedListener: jest.fn(() => ({ remove: jest.fn() })),
    };
    instances[id] = inst as unknown as Record<string, unknown>;
    return inst;
  }

  // Expose instances on global so test files can inspect mocks by store id
  (global as Record<string, unknown>).__mmkvInstances = instances;

  return {
    createMMKV: jest.fn(({ id = "default" }: { id?: string } = {}) => {
      if (!instances[id]) makeMock(id);
      return instances[id];
    }),
  };
});

// ─── Mock Sentry ───────────────────────────────────────────────────────────
jest.mock("@sentry/react-native", () => ({
  init: jest.fn(),
  wrap: jest.fn((c: unknown) => c),
  captureException: jest.fn(),
  captureMessage: jest.fn(),
  setUser: jest.fn(),
  setContext: jest.fn(),
  setTag: jest.fn(),
  addBreadcrumb: jest.fn(),
  withScope: jest.fn((fn: (scope: unknown) => void) => fn({})),
  reactNavigationIntegration: jest.fn(() => ({
    registerNavigationContainer: jest.fn(),
  })),
  mobileReplayIntegration: jest.fn(() => ({})),
  ReactNavigationInstrumentation: jest.fn(),
}));

// ─── Mock expo-application ─────────────────────────────────────────────────
jest.mock("expo-application", () => ({
  applicationId: "com.honeydo.app",
  nativeApplicationVersion: "1.0.0",
  nativeBuildVersion: "1",
}));

// ─── Mock expo modules ─────────────────────────────────────────────────────
jest.mock("expo-router", () => ({
  router: { replace: jest.fn(), push: jest.fn(), back: jest.fn() },
  Link: ({ children }: { children: React.ReactNode }) => children,
  useRouter: () => ({ replace: jest.fn(), push: jest.fn(), back: jest.fn() }),
  useLocalSearchParams: () => ({}),
  useSegments: () => [],
  Redirect: () => null,
  Stack: { Screen: () => null },
  Tabs: { Screen: () => null },
}));

jest.mock("expo-splash-screen", () => ({
  preventAutoHideAsync: jest.fn(),
  hideAsync: jest.fn(),
}));

jest.mock("expo-haptics", () => ({
  impactAsync: jest.fn(),
  ImpactFeedbackStyle: { Light: "light", Medium: "medium", Heavy: "heavy" },
}));

jest.mock("expo-secure-store", () => ({
  getItemAsync: jest.fn().mockResolvedValue(null),
  setItemAsync: jest.fn().mockResolvedValue(undefined),
  deleteItemAsync: jest.fn().mockResolvedValue(undefined),
}));

jest.mock("expo-linear-gradient", () => ({
  LinearGradient: "LinearGradient",
}));

jest.mock("expo-file-system", () => ({
  documentDirectory: "file:///documents/",
  cacheDirectory: "file:///cache/",
  writeAsStringAsync: jest.fn().mockResolvedValue(undefined),
  readAsStringAsync: jest.fn().mockResolvedValue(""),
  deleteAsync: jest.fn().mockResolvedValue(undefined),
  getInfoAsync: jest.fn().mockResolvedValue({ exists: false }),
  EncodingType: { UTF8: "utf8", Base64: "base64" },
}));

jest.mock("expo-file-system/legacy", () => ({
  documentDirectory: "file:///documents/",
  cacheDirectory: "file:///cache/",
  writeAsStringAsync: jest.fn().mockResolvedValue(undefined),
  readAsStringAsync: jest.fn().mockResolvedValue(""),
  deleteAsync: jest.fn().mockResolvedValue(undefined),
  getInfoAsync: jest.fn().mockResolvedValue({ exists: false }),
  EncodingType: { UTF8: "utf8", Base64: "base64" },
}));

jest.mock("expo-sharing", () => ({
  shareAsync: jest.fn().mockResolvedValue(undefined),
  isAvailableAsync: jest.fn().mockResolvedValue(true),
}));

jest.mock("expo-document-picker", () => ({
  getDocumentAsync: jest.fn().mockResolvedValue({ canceled: true, assets: [] }),
}));

jest.mock("@expo/vector-icons", () => ({
  Ionicons: "Ionicons",
  MaterialIcons: "MaterialIcons",
  FontAwesome: "FontAwesome",
  Feather: "Feather",
  AntDesign: "AntDesign",
}));

jest.mock("react-native-reanimated", () =>
  require("react-native-reanimated/mock")
);

jest.mock("react-native-safe-area-context", () => ({
  SafeAreaView: ({ children }: { children: React.ReactNode }) => children,
  SafeAreaProvider: ({ children }: { children: React.ReactNode }) => children,
  useSafeAreaInsets: () => ({ top: 44, bottom: 34, left: 0, right: 0 }),
}));

jest.mock("react-native-gesture-handler", () => ({
  GestureHandlerRootView: ({ children }: { children: React.ReactNode }) => children,
  ScrollView: require("react-native").ScrollView,
  TouchableOpacity: require("react-native").TouchableOpacity,
}));

jest.mock("react-native-svg", () => {
  const React = require("react");
  const MockSvg = ({ children }: { children?: React.ReactNode }) =>
    React.createElement("Svg", null, children);
  return {
    __esModule: true,
    default: MockSvg,
    Svg: MockSvg,
    Path: "Path",
    Circle: "Circle",
    Defs: "Defs",
    LinearGradient: "LinearGradient",
    Stop: "Stop",
    G: "G",
    Text: "Text",
  };
});

// ─── Mock Supabase ─────────────────────────────────────────────────────────
jest.mock("@/lib/supabase", () => {
  // Creates a chainable + thenable mock (so `await chain` and .then().catch() work).
  // Must be defined inside the factory to satisfy jest.mock hoisting rules.
  function createChain(defaultResult: { data?: unknown; error?: unknown } = {}) {
    const resolved = { data: defaultResult.data ?? null, error: defaultResult.error ?? null };
    const chain: Record<string, (...args: unknown[]) => unknown> = {};
    [
      "select", "insert", "update", "delete",
      "eq", "neq", "gte", "lte", "lt", "gt", "in", "is", "not",
      "order", "limit", "range", "filter",
    ].forEach((m) => {
      chain[m] = jest.fn().mockReturnThis();
    });
    chain.single = jest.fn().mockResolvedValue(resolved);
    chain.then = jest.fn().mockImplementation((onFulfilled: (v: unknown) => unknown) =>
      Promise.resolve(resolved).then(onFulfilled)
    );
    chain.catch = jest.fn().mockImplementation((onRejected: (v: unknown) => unknown) =>
      Promise.resolve(resolved).catch(onRejected)
    );
    return chain;
  }

  return {
    supabase: {
      auth: {
        getSession: jest.fn().mockResolvedValue({ data: { session: null } }),
        signInWithPassword: jest.fn(),
        signUp: jest.fn(),
        signOut: jest.fn(),
      },
      from: jest.fn(() => createChain()),
      channel: jest.fn(() => ({
        on: jest.fn().mockReturnThis(),
        subscribe: jest.fn().mockReturnThis(),
      })),
      removeChannel: jest.fn(),
      functions: {
        invoke: jest.fn().mockResolvedValue({ data: {}, error: null }),
      },
    },
    supabaseConfigured: true,
    subscribeToTransactions: jest.fn(() => ({ unsubscribe: jest.fn() })),
    subscribeToCalendarEvents: jest.fn(() => ({ unsubscribe: jest.fn() })),
    subscribeToBudgetCategories: jest.fn(() => ({ unsubscribe: jest.fn() })),
  };
});

// ─── Mock expo-notifications ───────────────────────────────────────────────
jest.mock("expo-notifications", () => ({
  setNotificationHandler: jest.fn(),
  getPermissionsAsync: jest.fn().mockResolvedValue({ status: "granted" }),
  requestPermissionsAsync: jest.fn().mockResolvedValue({ status: "granted" }),
  scheduleNotificationAsync: jest.fn().mockResolvedValue("notification-id"),
  cancelScheduledNotificationAsync: jest.fn().mockResolvedValue(undefined),
  getAllScheduledNotificationsAsync: jest.fn().mockResolvedValue([]),
  SchedulableTriggerInputTypes: { DATE: "date", DAILY: "daily", WEEKLY: "weekly" },
}));

// ─── Mock expo-local-authentication ────────────────────────────────────────
jest.mock("expo-local-authentication", () => ({
  hasHardwareAsync: jest.fn().mockResolvedValue(true),
  isEnrolledAsync: jest.fn().mockResolvedValue(true),
  supportedAuthenticationTypesAsync: jest.fn().mockResolvedValue([1, 2]),
  authenticateAsync: jest.fn().mockResolvedValue({ success: true }),
  AuthenticationType: { FINGERPRINT: 1, FACIAL_RECOGNITION: 2, IRIS: 3 },
}));

// ─── Mock async storage ────────────────────────────────────────────────────
jest.mock("@react-native-async-storage/async-storage", () =>
  require("@react-native-async-storage/async-storage/jest/async-storage-mock")
);

// ─── Silence noisy warnings in tests ──────────────────────────────────────
const originalWarn = console.warn;
beforeAll(() => {
  console.warn = (msg: string, ...args: unknown[]) => {
    if (
      typeof msg === "string" &&
      (msg.includes("NativeWind") || msg.includes("TailwindCSS") || msg.includes("act("))
    )
      return;
    originalWarn(msg, ...args);
  };
});
afterAll(() => {
  console.warn = originalWarn;
});
