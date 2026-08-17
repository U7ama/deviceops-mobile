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
import { colors } from '../../src/theme';

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
            <ActivityIndicator color={colors.white} size="small" />
          ) : (
            <Text style={styles.syncButtonText}>Sync Now</Text>
          )}
        </TouchableOpacity>
      </View>

      {message ? <Text style={styles.feedback}>{message}</Text> : null}

      {loading ? (
        <ActivityIndicator color={colors.accent} style={{ marginTop: 24 }} />
      ) : (
        <FlatList
          data={cache?.devices ?? []}
          keyExtractor={(item) => item.id}
          refreshControl={
            <RefreshControl
              refreshing={syncing}
              onRefresh={handleSync}
              tintColor={colors.accent}
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
                    { backgroundColor: item.online ? colors.success : colors.error }
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
  container: { flex: 1, backgroundColor: colors.background, padding: 16 },
  headerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 },
  title: { color: colors.textPrimary, fontSize: 22, fontWeight: '700' },
  subtitle: { color: colors.textSecondary, fontSize: 13, marginTop: 2 },
  syncButton: {
    backgroundColor: colors.buttonSecondary,
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 6
  },
  syncButtonText: { color: colors.white, fontSize: 13, fontWeight: '700' },
  feedback: {
    color: colors.accent,
    backgroundColor: colors.feedbackBg,
    padding: 10,
    borderRadius: 6,
    marginBottom: 12,
    fontSize: 13
  },
  card: {
    backgroundColor: colors.surface,
    padding: 14,
    borderRadius: 10,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: colors.border
  },
  row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  name: { color: colors.textPrimary, fontSize: 15, fontWeight: '700', flex: 1 },
  badge: { color: colors.white, paddingHorizontal: 8, paddingVertical: 4, borderRadius: 5, fontSize: 11, fontWeight: '700' },
  room: { color: colors.textSecondary, marginTop: 4, fontSize: 13 },
  detail: { color: colors.textMuted, fontSize: 12, marginTop: 8 },
  emptyContainer: { padding: 24, alignItems: 'center' },
  emptyText: { color: colors.textMuted, fontSize: 15, fontWeight: '600', textAlign: 'center' },
  emptySubtext: { color: colors.muted, fontSize: 13, textAlign: 'center', marginTop: 8 },
  note: { color: colors.muted, fontSize: 11, marginTop: 12, textAlign: 'center' }
});
