import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Image,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { apiFetch } from '../../src/api';
import { colors } from '../../src/theme';

type DeviceOption = {
  id: string;
  roomId: string;
  name: string;
  model: string;
  room: { id: string; name: string };
};

export default function NewRunScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ deviceId?: string; roomId?: string }>();
  const [devices, setDevices] = useState<DeviceOption[]>([]);
  const [selectedDeviceId, setSelectedDeviceId] = useState(params.deviceId ?? '');
  const [selectedRoomId, setSelectedRoomId] = useState(params.roomId ?? '');
  const [question, setQuestion] = useState(
    'The wall display is offline after a power interruption. What should I check?'
  );
  const [imageUri, setImageUri] = useState<string | null>(null);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [loadingDevices, setLoadingDevices] = useState(false);

  useEffect(() => {
    if (params.deviceId) setSelectedDeviceId(params.deviceId);
    if (params.roomId) setSelectedRoomId(params.roomId);
  }, [params.deviceId, params.roomId]);

  useEffect(() => {
    setLoadingDevices(true);
    apiFetch('/api/v1/devices')
      .then(async (response) => {
        if (!response.ok) return;
        const body = (await response.json()) as { devices: DeviceOption[] };
        setDevices(body.devices);
        if (!selectedDeviceId && body.devices.length > 0) {
          const first = body.devices[0];
          if (first) {
            setSelectedDeviceId(first.id);
            setSelectedRoomId(first.roomId);
          }
        }
      })
      .catch(() => undefined)
      .finally(() => setLoadingDevices(false));
  }, [selectedDeviceId]);

  function handleDeviceSelect(device: DeviceOption) {
    setSelectedDeviceId(device.id);
    setSelectedRoomId(device.roomId);
  }

  async function handleCamera() {
    try {
      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        quality: 0.8,
      });

      if (!result.canceled) {
        setImageUri(result.assets[0].uri);
      }
    } catch (e) {
      setError('Camera error: ' + (e as Error).message);
    }
  }

  function handleVoice() {
    Alert.alert('Coming Soon', 'Voice recording coming soon');
  }

  async function submit() {
    if (!selectedRoomId || !selectedDeviceId) {
      setError('Select a device before starting a diagnosis.');
      return;
    }
    if (!question.trim()) {
      setError('Please provide a symptom description or question.');
      return;
    }
    setBusy(true);
    setError('');
    try {
      const response = await apiFetch('/api/v1/runs', {
        method: 'POST',
        headers: { 'idempotency-key': `mobile-${Date.now()}` },
        body: JSON.stringify({
          roomId: selectedRoomId,
          deviceId: selectedDeviceId,
          question,
          mediaIds: [],
          ...(imageUri ? { mediaUri: imageUri } : {})
        })
      });
      const body = await response.json();
      if (!response.ok) throw new Error(body.detail ?? 'Run could not be queued');
      router.push(`/runs/${body.runId}`);
    } catch (value) {
      setError(value instanceof Error ? value.message : 'Run failed');
    } finally {
      setBusy(false);
    }
  }

  const selectedDevice = devices.find((d) => d.id === selectedDeviceId);

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.title}>Ask the copilot</Text>
      <Text style={styles.context}>
        {selectedDevice
          ? `Target: ${selectedDevice.name} (${selectedDevice.model}) in ${selectedDevice.room.name}`
          : 'Select target device context for grounded diagnosis:'}
      </Text>

      {loadingDevices ? (
        <ActivityIndicator color={colors.accent} style={{ marginVertical: 12 }} />
      ) : devices.length > 0 ? (
        <View style={styles.deviceChips}>
          {devices.map((d) => {
            const active = d.id === selectedDeviceId;
            return (
              <TouchableOpacity
                key={d.id}
                style={[styles.chip, active && styles.chipActive]}
                onPress={() => handleDeviceSelect(d)}
              >
                <Text style={[styles.chipText, active && styles.chipTextActive]}>
                  {d.name} · {d.room.name}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>
      ) : null}

      <Text style={styles.label}>Observed symptom or question</Text>
      <TextInput
        style={styles.textArea}
        multiline
        value={question}
        onChangeText={setQuestion}
        placeholder="Describe the symptom or issue"
        placeholderTextColor={colors.muted}
      />

      {imageUri ? (
        <Image source={{ uri: imageUri }} style={styles.thumbnail} />
      ) : null}

      <View style={styles.mediaButtonsRow}>
        <TouchableOpacity style={styles.mediaButton} onPress={handleCamera}>
          <Text style={styles.mediaButtonText}>📷 Camera</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.mediaButton} onPress={handleVoice}>
          <Text style={styles.mediaButtonText}>🎤 Voice</Text>
        </TouchableOpacity>
      </View>

      <Text style={styles.note}>
        Diagnostics use server-retrieved manual evidence and tenant-scoped policies.
      </Text>

      {error ? <Text style={styles.error}>{error}</Text> : null}

      <TouchableOpacity
        style={[styles.button, (!selectedRoomId || !selectedDeviceId) && styles.disabledButton]}
        onPress={submit}
        disabled={busy || !selectedRoomId || !selectedDeviceId}
      >
        {busy ? (
          <ActivityIndicator color={colors.white} />
        ) : (
          <Text style={styles.buttonText}>Queue diagnosis</Text>
        )}
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background, padding: 16 },
  title: { color: colors.textPrimary, fontSize: 24, fontWeight: '700' },
  context: { color: colors.textSecondary, marginVertical: 10, fontSize: 13 },
  deviceChips: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 14 },
  chip: {
    backgroundColor: colors.surface,
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: colors.border
  },
  chipActive: {
    backgroundColor: colors.chipActive,
    borderColor: colors.accent
  },
  chipText: { color: colors.textSecondary, fontSize: 12 },
  chipTextActive: { color: colors.textPrimary, fontWeight: '700' },
  label: { color: colors.textMuted, fontSize: 13, fontWeight: '600', marginBottom: 6, marginTop: 4 },
  textArea: {
    minHeight: 120,
    backgroundColor: colors.surface,
    color: colors.textPrimary,
    borderRadius: 8,
    padding: 14,
    textAlignVertical: 'top',
    borderWidth: 1,
    borderColor: colors.border
  },
  thumbnail: { width: 100, height: 100, borderRadius: 8, marginTop: 12, borderWidth: 1, borderColor: colors.border },
  mediaButtonsRow: { flexDirection: 'row', gap: 12, marginTop: 12 },
  mediaButton: { backgroundColor: colors.surface, padding: 10, borderRadius: 8, borderWidth: 1, borderColor: colors.border, flex: 1, alignItems: 'center' },
  mediaButtonText: { color: colors.textPrimary, fontSize: 14, fontWeight: '600' },
  note: { color: colors.muted, fontSize: 11, marginVertical: 12 },
  button: {
    backgroundColor: colors.buttonPrimary,
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
    marginBottom: 32
  },
  disabledButton: { opacity: 0.5 },
  buttonText: { color: colors.white, fontWeight: '700' },
  error: { color: colors.errorText, marginBottom: 12 }
});
