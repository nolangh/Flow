import { Tabs } from "expo-router";
import { View, Platform } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { Colors, Fonts } from "@/constants/theme";
import { useRealtimeSync } from "@/hooks/useRealtimeSync";

type IconName = keyof typeof Ionicons.glyphMap;

function TabIcon({ name, focused }: { name: IconName; focused: boolean }) {
  return (
    <View style={{ alignItems: "center", justifyContent: "center", paddingTop: 2 }}>
      <Ionicons
        name={name}
        size={23}
        color={focused ? Colors.accent : Colors.text.muted}
      />
      {focused && (
        <View
          style={{
            position: "absolute",
            bottom: -6,
            width: 4,
            height: 4,
            borderRadius: 2,
            backgroundColor: Colors.accent,
          }}
        />
      )}
    </View>
  );
}

export default function TabsLayout() {
  useRealtimeSync();

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          backgroundColor: Colors.bg.raised,
          borderTopColor: Colors.border.subtle,
          borderTopWidth: 0.5,
          height: Platform.OS === "ios" ? 84 : 68,
          paddingBottom: Platform.OS === "ios" ? 28 : 10,
          paddingTop: 10,
        },
        tabBarActiveTintColor: Colors.accent,
        tabBarInactiveTintColor: Colors.text.muted,
        tabBarLabelStyle: { fontSize: 10, fontFamily: Fonts.semiBold, marginTop: 2 },
        tabBarShowLabel: false,
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          tabBarIcon: ({ focused }) => <TabIcon name={focused ? "home" : "home-outline"} focused={focused} />,
        }}
      />
      <Tabs.Screen
        name="budget"
        options={{
          tabBarIcon: ({ focused }) => <TabIcon name={focused ? "wallet" : "wallet-outline"} focused={focused} />,
        }}
      />
      <Tabs.Screen
        name="goals"
        options={{
          tabBarIcon: ({ focused }) => <TabIcon name={focused ? "trophy" : "trophy-outline"} focused={focused} />,
        }}
      />
      <Tabs.Screen
        name="calendar"
        options={{
          tabBarIcon: ({ focused }) => <TabIcon name={focused ? "calendar" : "calendar-outline"} focused={focused} />,
        }}
      />
      <Tabs.Screen
        name="settings"
        options={{
          tabBarIcon: ({ focused }) => <TabIcon name={focused ? "person-circle" : "person-circle-outline"} focused={focused} />,
        }}
      />
      <Tabs.Screen
        name="upgrade"
        options={{
          href: null,
        }}
      />
    </Tabs>
  );
}
