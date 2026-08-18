import React, { useEffect, useState } from 'react';
import { ActivityIndicator, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import { apiFetch } from '../../src/api';
import { colors } from '../../src/theme';

export default function RunScreen() {
  const { id } = useLocalSearchParams<{ id: string }>(); const [run, setRun] = useState<any>(null); const [events, setEvents] = useState<any[]>([]); const [error, setError] = useState('');
  useEffect(() => { let active = true; async function poll() { try { const [runResponse, eventsResponse] = await Promise.all([apiFetch(`/api/v1/runs/${id}`), apiFetch(`/api/v1/runs/${id}/events`)]); if (!runResponse.ok) throw new Error('Run is not available in this tenant'); const payload = await runResponse.json(); if (active) setRun(payload.run); if (eventsResponse.ok) { const text = await eventsResponse.text(); const parsed = text.split('\n\n').map((block) => block.split('\n').find((line) => line.startsWith('data: '))).filter(Boolean).map((line) => JSON.parse(line!.slice(6))).filter((value) => value.type); if (active) setEvents(parsed); } } catch (value) { if (active) setError(value instanceof Error ? value.message : 'Could not load run'); } } void poll(); const timer = setInterval(() => void poll(), 2000); return () => { active = false; clearInterval(timer); }; }, [id]);
  if (error) return <View style={styles.container}><Text style={styles.error}>{error}</Text></View>;
  if (!run) return <View style={styles.container}><ActivityIndicator color={colors.accent} /></View>;
  return (
    <ScrollView style={styles.container}>
      <Text style={styles.title}>{run.deviceName}</Text>
      <Text style={styles.state}>{run.state.replaceAll('_', ' ')}</Text>
      {run.approvalStatus ? (
        <View style={styles.approvalBadge}>
          <Text style={styles.approvalText}>Approval: {run.approvalStatus.replaceAll('_', ' ')}</Text>
        </View>
      ) : null}
      <Text style={styles.question}>{run.question}</Text>
      <Text style={styles.section}>Durable events</Text>
      {events.map((event) => (
        <View style={styles.event} key={`${event.sequence}-${event.type}`}>
          <Text style={styles.sequence}>{event.sequence}</Text>
          <Text style={styles.eventText}>{event.type}</Text>
        </View>
      ))}
      {run.diagnosis ? (
        <>
          <Text style={styles.section}>Grounded diagnosis</Text>
          <Text style={styles.summary}>{run.diagnosis.summary}</Text>
          <Text style={styles.muted}>{run.diagnosis.uncertainty}</Text>
          {run.diagnosis.citations.map((citation: any) => (
            <Text style={styles.citation} key={citation.id}>
              {citation.title}: {citation.excerpt}
            </Text>
          ))}
        </>
      ) : null}
    </ScrollView>
  );
}
const styles = StyleSheet.create({ container: { flex: 1, backgroundColor: colors.background, padding: 16 }, title: { color: colors.textPrimary, fontSize: 24, fontWeight: '700' }, state: { color: colors.accent, textTransform: 'uppercase', marginTop: 6 }, approvalBadge: { backgroundColor: colors.surface, paddingVertical: 4, paddingHorizontal: 8, borderRadius: 4, marginTop: 8, alignSelf: 'flex-start', borderWidth: 1, borderColor: colors.border }, approvalText: { color: colors.textPrimary, fontSize: 12, fontWeight: '600', textTransform: 'uppercase' }, question: { color: colors.textMuted, marginVertical: 14 }, section: { color: colors.accent, fontWeight: '700', marginTop: 18, marginBottom: 8 }, event: { flexDirection: 'row', gap: 12, borderTopWidth: 1, borderTopColor: colors.border, paddingVertical: 10 }, sequence: { color: colors.accent, fontFamily: 'monospace' }, eventText: { color: colors.textPrimary }, summary: { color: colors.textPrimary, fontSize: 17, fontWeight: '600' }, muted: { color: colors.textSecondary, marginTop: 8 }, citation: { color: colors.textMuted, borderLeftWidth: 2, borderLeftColor: colors.accent, padding: 8, marginTop: 10 }, error: { color: colors.errorText } });
