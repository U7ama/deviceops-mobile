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
import { apiFetch, loadOfflineCache, saveOfflineCache, type OfflineCache } from '../../src/api';

export default function OfflineScreen() {
  const [cache, setCache] = useState<OfflineCache | null>(null);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [message, setMessage] = useState('');

  const readCache = useCallback(async () => {
    setLoading(true);
    try {
      const data = await loadOfflineCache();
      setCache(data);
    } catch {
      setCache(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void readCache();
  }, [readCache]);

  async function handleSync() {
    setSyncing(true);
    setMessage('');
    try {
      const response = await apiFetch('/api/v1/devices');
      if (!response.ok) throw new Error('Could not sync: server unreachable or unauthenticated');
      const body = await response.json();
      await saveOfflineCache(body.devices);
      await readCache();
      setMessage('Cache updated successfully from server.');
    } catch (value) {
      setMessage(value instanceof Error ? value.message : 'Sync failed');
    } finally {
      setSyncing(false);
    }
  }

  return (
    <View style={styles.container}>
      <View style={styles.headerRow}>
        <View style={{ flex: 1 }}>
          <Text style={styles.title}>Offline Cache</Text>
          <Text style={styles.subtitle}>
            {cache?.cachedAt
              ? `Last synced: ${new Date(cache.cachedAt).toLocaleTimeString()}`
              : 'No cached snapshots found'}
          </Text>
        </View>
        <TouchableOpacity
          style={styles.syncButton}
          onPress={handleSync}
          disabled={syncing}
        >
          {syncing ? (
            <ActivityIndicator color="#fff" size="small" />
          ) : (
            <Text style={styles.syncButtonText}>Sync Now</Text>
          )}
        </TouchableOpacity>
      </View>

      {message ? <Text style={styles.feedback}>{message}</Text> : null}

      {loading ? (
        <ActivityIndicator color="#38bdf8" style={{ marginTop: 24 }} />
      ) : (
        <FlatList
          data={cache?.devices ?? []}
          keyExtractor={(item) => item.id}
          refreshControl={
            <RefreshControl
              refreshing={syncing}
              onRefresh={handleSync}
              tintColor="#38bdf8"
            />
          }
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyText}>No device snapshots currently cached.</Text>
              <Text style={styles.emptySubtext}>
                Connect to the network and tap "Sync Now" or visit the Devices tab while online.
              </Text>
            </View>
          }
          renderItem={({ item }) => (
            <View style={styles.card}>
              <View style={styles.row}>
                <Text style={styles.name}>
                  {item.name} · {item.model}
                </Text>
                <Text
                  style={[
                    styles.badge,
                    { backgroundColor: item.online ? '#166534' : '#991b1b' }
                  ]}
                >
                  {item.online ? 'ONLINE' : 'OFFLINE'}
                </Text>
              </View>
              <Text style={styles.room}>{item.roomName}</Text>
              <Text style={styles.detail}>
                Cached Power: {item.powerState} · Input: {item.input ?? 'none'}
              </Text>
            </View>
          )}
        />
      )}

      <Text style={styles.note}>
        Raw media and consequential actions are never stored or executed offline.
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#090d16', padding: 16 },
  headerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 },
  title: { color: '#f8fafc', fontSize: 22, fontWeight: '700' },
  subtitle: { color: '#94a3b8', fontSize: 13, marginTop: 2 },
  syncButton: {
    backgroundColor: '#0284c7',
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 6
  },
  syncButtonText: { color: '#fff', fontSize: 13, fontWeight: '700' },
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
    padding: 14,
    borderRadius: 10,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#334155'
  },
  row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  name: { color: '#f8fafc', fontSize: 15, fontWeight: '700', flex: 1 },
  badge: { color: '#fff', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 5, fontSize: 11, fontWeight: '700' },
  room: { color: '#94a3b8', marginTop: 4, fontSize: 13 },
  detail: { color: '#cbd5e1', fontSize: 12, marginTop: 8 },
  emptyContainer: { padding: 24, alignItems: 'center' },
  emptyText: { color: '#cbd5e1', fontSize: 15, fontWeight: '600', textAlign: 'center' },
  emptySubtext: { color: '#64748b', fontSize: 13, textAlign: 'center', marginTop: 8 },
  note: { color: '#64748b', fontSize: 11, marginTop: 12, textAlign: 'center' }
});
