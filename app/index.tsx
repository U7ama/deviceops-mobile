import React, { useState } from 'react';
import { ActivityIndicator, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { useRouter } from 'expo-router';
import { login } from '../src/api';
import { useSession } from './_layout';
import { colors } from '../src/theme';

export default function LoginScreen() {
  const router = useRouter(); const { setSession } = useSession();
  const [email, setEmail] = useState(''); const [password, setPassword] = useState(''); const [error, setError] = useState(''); const [loading, setLoading] = useState(false);
  async function submit() { setLoading(true); setError(''); try { setSession(await login(email, password)); router.replace('/(tabs)/devices'); } catch (value) { setError(value instanceof Error ? value.message : 'Login failed'); } finally { setLoading(false); } }
  return <View style={styles.container}><Text style={styles.title}>DeviceOps AI Copilot</Text><Text style={styles.subtitle}>Secure technician session · synthetic data</Text>{error ? <Text style={styles.error}>{error}</Text> : null}<TextInput style={styles.input} value={email} onChangeText={setEmail} autoCapitalize="none" keyboardType="email-address" placeholder="Email" placeholderTextColor={colors.muted} /><TextInput style={styles.input} value={password} onChangeText={setPassword} secureTextEntry placeholder="Password" placeholderTextColor={colors.muted} /><TouchableOpacity style={styles.button} onPress={submit} disabled={loading}>{loading ? <ActivityIndicator color={colors.white} /> : <Text style={styles.buttonText}>Sign in</Text>}</TouchableOpacity><Text style={styles.footer}>Access and tenant scope come from the API session, never from the device or model.</Text></View>;
}
const styles = StyleSheet.create({ container: { flex: 1, backgroundColor: colors.background, padding: 24, justifyContent: 'center' }, title: { fontSize: 28, fontWeight: '700', color: colors.textPrimary, textAlign: 'center' }, subtitle: { color: colors.textSecondary, textAlign: 'center', marginVertical: 8 }, input: { backgroundColor: colors.surface, color: colors.textPrimary, padding: 14, borderRadius: 8, marginTop: 14 }, button: { backgroundColor: colors.buttonPrimary, padding: 16, borderRadius: 8, alignItems: 'center', marginTop: 18 }, buttonText: { color: colors.white, fontWeight: '700' }, error: { color: colors.errorText, textAlign: 'center', marginTop: 14 }, footer: { color: colors.muted, textAlign: 'center', fontSize: 12, marginTop: 24 } });
