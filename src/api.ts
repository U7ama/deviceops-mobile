import * as SecureStore from 'expo-secure-store';

const API_URL = (process.env.EXPO_PUBLIC_DEVICEOPS_API_URL ?? 'http://10.0.2.2:3000').replace(/\/$/, '');
const ACCESS_KEY = 'deviceops_access_token';
const REFRESH_KEY = 'deviceops_refresh_token';

export type MobileSession = { accessToken: string; refreshToken: string; user: { email: string; displayName: string; role: string; tenantId: string; tenantName: string } };

export async function login(email: string, password: string): Promise<MobileSession> {
  const response = await fetch(`${API_URL}/api/v1/auth/login`, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ email, password, client: 'mobile' }) });
  const body = await response.json();
  if (!response.ok) throw new Error(body.detail ?? 'Authentication failed');
  const session = body as MobileSession;
  await SecureStore.setItemAsync(ACCESS_KEY, session.accessToken);
  await SecureStore.setItemAsync(REFRESH_KEY, session.refreshToken);
  return session;
}

export async function accessToken(): Promise<string | null> { return SecureStore.getItemAsync(ACCESS_KEY); }

export async function apiFetch(path: string, init: RequestInit = {}): Promise<Response> {
  const token = await accessToken();
  return fetch(`${API_URL}${path}`, { ...init, headers: { ...(init.body ? { 'content-type': 'application/json' } : {}), ...(token ? { authorization: `Bearer ${token}` } : {}), ...init.headers } });
}

const OFFLINE_CACHE_KEY = 'deviceops_offline_devices_cache';

export type OfflineDeviceSnapshot = {
  id: string;
  name: string;
  model: string;
  manufacturer: string;
  roomId: string;
  roomName: string;
  online: boolean;
  powerState: string;
  input: string | null;
  observedAt: string;
};

export type OfflineCache = {
  cachedAt: string;
  devices: OfflineDeviceSnapshot[];
};

export async function saveOfflineCache(devices: any[]): Promise<void> {
  const snapshots: OfflineDeviceSnapshot[] = devices.map((d) => ({
    id: d.id,
    name: d.name,
    model: d.model,
    manufacturer: d.manufacturer,
    roomId: d.roomId,
    roomName: d.room?.name ?? 'Unknown Room',
    online: d.status?.online ?? false,
    powerState: d.status?.powerState ?? 'unknown',
    input: d.status?.input ?? null,
    observedAt: d.status?.observedAt ?? new Date().toISOString()
  }));
  const payload: OfflineCache = {
    cachedAt: new Date().toISOString(),
    devices: snapshots
  };
  await SecureStore.setItemAsync(OFFLINE_CACHE_KEY, JSON.stringify(payload));
}

export async function loadOfflineCache(): Promise<OfflineCache | null> {
  const raw = await SecureStore.getItemAsync(OFFLINE_CACHE_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as OfflineCache;
  } catch {
    return null;
  }
}

export async function clearSession(): Promise<void> {
  await SecureStore.deleteItemAsync(ACCESS_KEY);
  await SecureStore.deleteItemAsync(REFRESH_KEY);
}
