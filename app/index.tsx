import React, { useState } from 'react';
import { ActivityIndicator, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { useRouter } from 'expo-router';
import { login } from '../src/api';
import { useSession } from './_layout';

export default function LoginScreen() {
  const router = useRouter(); const { setSession } = useSession();
  const [email, setEmail] = useState('tech@alpha.test'); const [password, setPassword] = useState(''); const [error, setError] = useState(''); const [loading, setLoading] = useState(false);
  async function submit() { setLoading(true); setError(''); try { setSession(await login(email, password)); router.replace('/(tabs)/devices'); } catch (value) { setError(value instanceof Error ? value.message : 'Login failed'); } finally { setLoading(false); } }
  return <View style={styles.container}><Text style={styles.title}>DeviceOps AI Copilot</Text><Text style={styles.subtitle}>Secure technician session · synthetic data</Text>{error ? <Text style={styles.error}>{error}</Text> : null}<TextInput style={styles.input} value={email} onChangeText={setEmail} autoCapitalize="none" keyboardType="email-address" placeholder="Email" placeholderTextColor="#64748b" /><TextInput style={styles.input} value={password} onChangeText={setPassword} secureTextEntry placeholder="Password" placeholderTextColor="#64748b" /><TouchableOpacity style={styles.button} onPress={submit} disabled={loading}>{loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.buttonText}>Sign in</Text>}</TouchableOpacity><Text style={styles.footer}>Access and tenant scope come from the API session, never from the device or model.</Text></View>;
}
const styles = StyleSheet.create({ container: { flex: 1, backgroundColor: '#090d16', padding: 24, justifyContent: 'center' }, title: { fontSize: 28, fontWeight: '700', color: '#f8fafc', textAlign: 'center' }, subtitle: { color: '#94a3b8', textAlign: 'center', marginVertical: 8 }, input: { backgroundColor: '#1e293b', color: '#f8fafc', padding: 14, borderRadius: 8, marginTop: 14 }, button: { backgroundColor: '#2563eb', padding: 16, borderRadius: 8, alignItems: 'center', marginTop: 18 }, buttonText: { color: '#fff', fontWeight: '700' }, error: { color: '#fb7185', textAlign: 'center', marginTop: 14 }, footer: { color: '#64748b', textAlign: 'center', fontSize: 12, marginTop: 24 } });
