import { Tabs } from "expo-router";
import { View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { Colors } from "@/constants/theme";
import { useRealtimeSync } from "@/hooks/useRealtimeSync";

type IconName = keyof typeof Ionicons.glyphMap;

function TabIcon({ name, focused }: { name: IconName; focused: boolean }) {
  return (
    <View style={{ alignItems: "center", justifyContent: "center" }}>
      <Ionicons
        name={name}
        size={24}
        color={focused ? Colors.neonGreen : Colors.text.muted}
      />
      {focused && (
        <View
          style={{
            position: "absolute",
            bottom: -8,
            width: 4,
            height: 4,
            borderRadius: 2,
            backgroundColor: Colors.neonGreen,
          }}
        />
      )}
    </View>
  );
}

export default function TabsLayout() {
  // Boot real-time subscriptions for all tabs
  useRealtimeSync();

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          backgroundColor: Colors.bg.surface,
          borderTopColor: Colors.border.subtle,
          borderTopWidth: 1,
          height: 72,
          paddingBottom: 16,
          paddingTop: 8,
        },
        tabBarActiveTintColor: Colors.neonGreen,
        tabBarInactiveTintColor: Colors.text.muted,
        tabBarLabelStyle: { fontSize: 10, fontWeight: "600", marginTop: 2 },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: "Dashboard",
          tabBarIcon: ({ focused }) => <TabIcon name={focused ? "grid" : "grid-outline"} focused={focused} />,
        }}
      />
      <Tabs.Screen
        name="budget"
        options={{
          title: "Budget",
          tabBarIcon: ({ focused }) => <TabIcon name={focused ? "wallet" : "wallet-outline"} focused={focused} />,
        }}
      />
      <Tabs.Screen
        name="calendar"
        options={{
          title: "Calendar",
          tabBarIcon: ({ focused }) => <TabIcon name={focused ? "calendar" : "calendar-outline"} focused={focused} />,
        }}
      />
      <Tabs.Screen
        name="settings"
        options={{
          title: "Settings",
          tabBarIcon: ({ focused }) => <TabIcon name={focused ? "person" : "person-outline"} focused={focused} />,
        }}
      />
    </Tabs>
  );
}
