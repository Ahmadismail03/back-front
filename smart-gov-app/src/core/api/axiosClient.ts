import axios, { type AxiosInstance } from 'axios';
import { getSecureItem, peekSecureItem } from '../storage/secureStorage';
import { StorageKeys } from '../storage/keys';
import { mockAdapter } from '../../mocks/mockAdapter';
import { getCurrentLanguage } from '../i18n/init';
import { getSessionToken } from '../auth/session';

let realClient: AxiosInstance | null = null;
let mockClient: AxiosInstance | null = null;

function getApiBaseUrl(): string {
  // Expo: define in app env as EXPO_PUBLIC_API_BASE_URL
  // Examples:
  // - Android emulator: http://10.0.2.2:4000
  // - iOS simulator: http://localhost:4000
  // - Physical device: http://<your-lan-ip>:4000
  return process.env.EXPO_PUBLIC_API_BASE_URL ?? 'http://localhost:4000';
}

function attachRequestInterceptors(client: AxiosInstance): void {
  client.interceptors.request.use(async (config) => {
    const token =
      getSessionToken() ??
      peekSecureItem(StorageKeys.authToken) ??
      (await getSecureItem(StorageKeys.authToken));
    (config.headers as any) = config.headers ?? {};
    (config.headers as any)['x-locale'] = getCurrentLanguage();
    if (token) {
      (config.headers as any).Authorization = `Bearer ${token}`;
    }
    return config;
  });
}

export function getApiClient(): AxiosInstance {
  if (realClient) return realClient;

  realClient = axios.create({
    baseURL: getApiBaseUrl(),
    timeout: 15000,
  });

  attachRequestInterceptors(realClient);
  return realClient;
}

export function getMockApiClient(): AxiosInstance {
  if (mockClient) return mockClient;

  mockClient = axios.create({
    baseURL: 'https://mock.smartgov.local',
    timeout: 15000,
    adapter: mockAdapter,
  });

  attachRequestInterceptors(mockClient);
  return mockClient;
}
