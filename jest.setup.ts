import "@testing-library/jest-native/extend-expect";

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
  getItemAsync: jest.fn(),
  setItemAsync: jest.fn(),
  deleteItemAsync: jest.fn(),
}));

jest.mock("expo-linear-gradient", () => ({
  LinearGradient: "LinearGradient",
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
jest.mock("@/lib/supabase", () => ({
  supabase: {
    auth: {
      getSession: jest.fn().mockResolvedValue({ data: { session: null } }),
      signInWithPassword: jest.fn(),
      signUp: jest.fn(),
      signOut: jest.fn(),
    },
    from: jest.fn(() => ({
      select: jest.fn().mockReturnThis(),
      insert: jest.fn().mockReturnThis(),
      update: jest.fn().mockReturnThis(),
      delete: jest.fn().mockReturnThis(),
      eq: jest.fn().mockReturnThis(),
      gte: jest.fn().mockReturnThis(),
      lte: jest.fn().mockReturnThis(),
      order: jest.fn().mockReturnThis(),
      single: jest.fn().mockResolvedValue({ data: null, error: null }),
    })),
    channel: jest.fn(() => ({
      on: jest.fn().mockReturnThis(),
      subscribe: jest.fn().mockReturnThis(),
    })),
    removeChannel: jest.fn(),
    functions: {
      invoke: jest.fn().mockResolvedValue({ data: {}, error: null }),
    },
  },
  subscribeToTransactions: jest.fn(() => ({ unsubscribe: jest.fn() })),
  subscribeToCalendarEvents: jest.fn(() => ({ unsubscribe: jest.fn() })),
  subscribeToBudgetCategories: jest.fn(() => ({ unsubscribe: jest.fn() })),
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
