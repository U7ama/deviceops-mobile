import React from "react";
import { Tabs } from "expo-router";
import { Text } from "react-native";
import { colors } from "../../src/theme";

export default function TabsLayout() {
  return (
    <Tabs
      screenOptions={{
        headerStyle: { backgroundColor: colors.headerBackground },
        headerTintColor: colors.textPrimary,
        tabBarStyle: { backgroundColor: colors.headerBackground, borderTopColor: colors.border },
        tabBarActiveTintColor: colors.accent,
        tabBarInactiveTintColor: colors.inactiveTab
      }}
    >
      <Tabs.Screen
        name="devices"
        options={{
          title: "Devices",
          tabBarIcon: ({ color }) => <Text style={{ color, fontSize: 16 }}>📱</Text>
        }}
      />
      <Tabs.Screen
        name="run"
        options={{
          title: "New Run",
          tabBarIcon: ({ color }) => <Text style={{ color, fontSize: 16 }}>⚡</Text>
        }}
      />
      <Tabs.Screen
        name="incidents"
        options={{
          title: "Incidents",
          tabBarIcon: ({ color }) => <Text style={{ color, fontSize: 16 }}>🚨</Text>
        }}
      />
      <Tabs.Screen
        name="offline"
        options={{
          title: "Offline Cache",
          tabBarIcon: ({ color }) => <Text style={{ color, fontSize: 16 }}>💾</Text>
        }}
      />
    </Tabs>
  );
}
