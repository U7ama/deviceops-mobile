import React, { createContext, useContext, useState } from 'react';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import type { MobileSession } from '../src/api';
import { colors } from '../src/theme';

export interface SessionContextType { session: MobileSession | null; setSession: (session: MobileSession | null) => void; }
const SessionContext = createContext<SessionContextType>({ session: null, setSession: () => undefined });
export const useSession = () => useContext(SessionContext);

export default function RootLayout() {
  const [session, setSession] = useState<MobileSession | null>(null);
  return <SessionContext.Provider value={{ session, setSession }}><StatusBar style="light" /><Stack screenOptions={{ headerStyle: { backgroundColor: colors.headerBackground }, headerTintColor: colors.textPrimary }}><Stack.Screen name="index" options={{ title: 'Technician Login' }} /><Stack.Screen name="(tabs)" options={{ headerShown: false }} /><Stack.Screen name="runs/[id]" options={{ title: 'Diagnosis Run Timeline' }} /></Stack></SessionContext.Provider>;
}
