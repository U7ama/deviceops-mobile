import React from "react";
import { Tabs } from "expo-router";
import { Text } from "react-native";

export default function TabsLayout() {
  return (
    <Tabs
      screenOptions={{
        headerStyle: { backgroundColor: "#0f172a" },
        headerTintColor: "#f8fafc",
        tabBarStyle: { backgroundColor: "#0f172a", borderTopColor: "#334155" },
        tabBarActiveTintColor: "#38bdf8",
        tabBarInactiveTintColor: "#64748b"
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
