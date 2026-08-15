import React, { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  RefreshControl,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View
} from 'react-native';
import { useRouter } from 'expo-router';
import { apiFetch, saveOfflineCache } from '../../src/api';

type Device = {
  id: string;
  roomId: string;
  name: string;
  manufacturer: string;
  model: string;
  room: { id: string; name: string; location: string };
  status: { online: boolean; powerState: string; input: string | null; observedAt: string } | null;
};

export default function DevicesScreen() {
  const router = useRouter();
  const [devices, setDevices] = useState<Device[]>([]);
  const [filtered, setFiltered] = useState<Device[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');

  const fetchDevices = useCallback(async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    else setLoading(true);
    setError('');
    try {
      const response = await apiFetch('/api/v1/devices');
      if (!response.ok) throw new Error('Devices could not be loaded for this tenant.');
      const body = (await response.json()) as { devices: Device[] };
      setDevices(body.devices);
      setFiltered(
        search
          ? body.devices.filter(
              (d) =>
                d.name.toLowerCase().includes(search.toLowerCase()) ||
                d.model.toLowerCase().includes(search.toLowerCase()) ||
                d.room.name.toLowerCase().includes(search.toLowerCase())
            )
          : body.devices
      );
      void saveOfflineCache(body.devices);
    } catch (value) {
      setError(value instanceof Error ? value.message : 'Devices could not be loaded.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [search]);

  useEffect(() => {
    void fetchDevices();
  }, [fetchDevices]);

  function handleSearch(text: string) {
    setSearch(text);
    if (!text.trim()) {
      setFiltered(devices);
      return;
    }
    const q = text.toLowerCase();
    setFiltered(
      devices.filter(
        (d) =>
          d.name.toLowerCase().includes(q) ||
          d.model.toLowerCase().includes(q) ||
          d.room.name.toLowerCase().includes(q)
      )
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.header}>Authorized room and device context</Text>
      <TextInput
        style={styles.searchBar}
        value={search}
        onChangeText={handleSearch}
        placeholder="Filter by device, model, or room…"
        placeholderTextColor="#64748b"
      />
      {loading ? (
        <ActivityIndicator color="#38bdf8" style={{ marginTop: 24 }} />
      ) : error ? (
        <Text style={styles.error}>{error}</Text>
      ) : (
        <FlatList
          data={filtered}
          keyExtractor={(item) => item.id}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={() => fetchDevices(true)}
              tintColor="#38bdf8"
            />
          }
          ListEmptyComponent={
            <Text style={styles.empty}>
              {search ? 'No matching devices found.' : 'No devices are available in this tenant.'}
            </Text>
          }
          renderItem={({ item }) => {
            const current = item.status;
            const online = current?.online === true;
            return (
              <TouchableOpacity
                style={styles.card}
                onPress={() => router.push(`/(tabs)/run?deviceId=${item.id}&roomId=${item.roomId}`)}
              >
                <View style={styles.row}>
                  <Text style={styles.name}>
                    {item.name} · {item.model}
                  </Text>
                  <Text
                    style={[
                      styles.badge,
                      { backgroundColor: online ? '#166534' : '#991b1b' }
                    ]}
                  >
                    {online ? 'ONLINE' : 'OFFLINE'}
                  </Text>
                </View>
                <Text style={styles.room}>{item.room.name}</Text>
                <Text style={styles.detail}>
                  Power: {current?.powerState ?? 'unavailable'} · observed:{' '}
                  {current?.observedAt ? new Date(current.observedAt).toLocaleTimeString() : '—'}
                </Text>
              </TouchableOpacity>
            );
          }}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#090d16', padding: 16 },
  header: { fontSize: 18, fontWeight: '700', color: '#f8fafc', marginBottom: 12 },
  searchBar: {
    backgroundColor: '#1e293b',
    color: '#f8fafc',
    borderRadius: 8,
    padding: 12,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#334155'
  },
  card: {
    backgroundColor: '#1e293b',
    padding: 16,
    borderRadius: 10,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#334155'
  },
  row: { flexDirection: 'row', justifyContent: 'space-between', gap: 8, alignItems: 'center' },
  name: { color: '#f8fafc', fontSize: 16, fontWeight: '700', flex: 1 },
  badge: { color: '#fff', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 5, fontSize: 11, fontWeight: '700' },
  room: { color: '#94a3b8', marginTop: 5 },
  detail: { color: '#cbd5e1', fontSize: 12, marginTop: 10 },
  error: { color: '#fb7185', marginTop: 16 },
  empty: { color: '#94a3b8', marginTop: 16, textAlign: 'center' }
});
