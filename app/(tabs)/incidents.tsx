import React, { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  RefreshControl,
  StyleSheet,
  Text,
  TouchableOpacity,
  View
} from 'react-native';
import { apiFetch } from '../../src/api';

type Incident = {
  id: string;
  runId: string | null;
  summary: string;
  state: 'queued' | 'dispatched' | 'delivered' | 'failed';
  assignedTeam: string;
  lastError: string | null;
  createdAt: string;
  updatedAt: string;
};

export default function IncidentsScreen() {
  const [incidents, setIncidents] = useState<Incident[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');
  const [retryingId, setRetryingId] = useState<string | null>(null);
  const [feedback, setFeedback] = useState('');

  const fetchIncidents = useCallback(async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    else setLoading(true);
    setError('');
    try {
      const response = await apiFetch('/api/v1/incidents');
      if (!response.ok) throw new Error('Sign in to view incidents in this tenant.');
      const body = (await response.json()) as { incidents: Incident[] };
      setIncidents(body.incidents);
    } catch (value) {
      setError(value instanceof Error ? value.message : 'Incidents could not be loaded.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    void fetchIncidents();
  }, [fetchIncidents]);

  async function handleRetry(incidentId: string) {
    setRetryingId(incidentId);
    setFeedback('');
    try {
      const response = await apiFetch(`/api/v1/incidents/${incidentId}/retry`, {
        method: 'POST'
      });
      const body = await response.json();
      if (!response.ok) throw new Error(body.detail ?? 'Retry dispatch failed');
      setFeedback(`Incident ${incidentId} queued for retry.`);
      await fetchIncidents(true);
    } catch (value) {
      setFeedback(value instanceof Error ? value.message : 'Retry failed');
    } finally {
      setRetryingId(null);
    }
  }

  function getBadgeColor(state: Incident['state']) {
    switch (state) {
      case 'delivered':
        return '#166534';
      case 'dispatched':
        return '#0284c7';
      case 'failed':
        return '#991b1b';
      case 'queued':
      default:
        return '#d97706';
    }
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Incident Notifications</Text>
      <Text style={styles.subtitle}>
        Live tenant router status · transactional idempotency
      </Text>
      {feedback ? <Text style={styles.feedback}>{feedback}</Text> : null}
      {loading ? (
        <ActivityIndicator color="#38bdf8" style={{ marginTop: 24 }} />
      ) : error ? (
        <Text style={styles.error}>{error}</Text>
      ) : (
        <FlatList
          data={incidents}
          keyExtractor={(item) => item.id}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={() => fetchIncidents(true)}
              tintColor="#38bdf8"
            />
          }
          ListEmptyComponent={
            <Text style={styles.empty}>No incidents currently recorded in this tenant.</Text>
          }
          renderItem={({ item }) => (
            <View style={styles.card}>
              <View style={styles.row}>
                <Text style={styles.summary}>{item.summary}</Text>
                <Text
                  style={[styles.badge, { backgroundColor: getBadgeColor(item.state) }]}
                >
                  {item.state.toUpperCase()}
                </Text>
              </View>
              <Text style={styles.meta}>
                Assigned: {item.assignedTeam} · updated:{' '}
                {new Date(item.updatedAt).toLocaleTimeString()}
              </Text>
              {item.lastError ? <Text style={styles.errorDetail}>{item.lastError}</Text> : null}
              {item.state === 'failed' || item.state === 'queued' ? (
                <TouchableOpacity
                  style={styles.retryButton}
                  onPress={() => handleRetry(item.id)}
                  disabled={retryingId === item.id}
                >
                  {retryingId === item.id ? (
                    <ActivityIndicator color="#fff" size="small" />
                  ) : (
                    <Text style={styles.retryButtonText}>Retry Dispatch</Text>
                  )}
                </TouchableOpacity>
              ) : null}
            </View>
          )}
        />
      )}
      <Text style={styles.note}>
        Consequential actions remain approval-gated and server-authoritative.
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#090d16', padding: 16 },
  title: { color: '#f8fafc', fontSize: 22, fontWeight: '700' },
  subtitle: { color: '#94a3b8', fontSize: 13, marginTop: 4, marginBottom: 16 },
  feedback: {
    color: '#38bdf8',
    backgroundColor: '#0c4a6e33',
    padding: 10,
    borderRadius: 6,
    marginBottom: 12,
    fontSize: 13
  },
  card: {
    backgroundColor: '#1e293b',
    padding: 16,
    borderRadius: 10,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#334155'
  },
  row: { flexDirection: 'row', justifyContent: 'space-between', gap: 8, alignItems: 'flex-start' },
  summary: { color: '#f8fafc', fontSize: 15, fontWeight: '600', flex: 1 },
  badge: { color: '#fff', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 5, fontSize: 11, fontWeight: '700' },
  meta: { color: '#94a3b8', fontSize: 12, marginTop: 8 },
  errorDetail: { color: '#fb7185', fontSize: 12, marginTop: 6, fontStyle: 'italic' },
  retryButton: {
    backgroundColor: '#3b82f6',
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 6,
    alignSelf: 'flex-start',
    marginTop: 10
  },
  retryButtonText: { color: '#fff', fontSize: 12, fontWeight: '700' },
  error: { color: '#fb7185', marginTop: 16 },
  empty: { color: '#94a3b8', marginTop: 24, textAlign: 'center' },
  note: { color: '#64748b', fontSize: 11, marginTop: 16, textAlign: 'center' }
});
