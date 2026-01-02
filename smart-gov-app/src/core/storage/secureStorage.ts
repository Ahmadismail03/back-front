import * as SecureStore from 'expo-secure-store';
import AsyncStorage from '@react-native-async-storage/async-storage';
import type { StorageKey } from './keys';

type PersistentStorageStatus = 'unknown' | 'available' | 'unavailable';

const memory = new Map<StorageKey, string>();
let persistentStatus: PersistentStorageStatus = 'unknown';

export function peekSecureItem(key: StorageKey): string | null {
  return memory.get(key) ?? null;
}

export function getPersistentStorageStatus(): PersistentStorageStatus {
  return persistentStatus;
}

export async function setSecureItem(key: StorageKey, value: string): Promise<void> {
  // Always keep an in-memory copy so auth works even if persistence fails.
  memory.set(key, value);

  try {
    await SecureStore.setItemAsync(key, value);
    persistentStatus = 'available';
    return;
  } catch {
    // fall through to AsyncStorage
  }

  try {
    await AsyncStorage.setItem(key, value);
    persistentStatus = 'available';
  } catch {
    persistentStatus = 'unavailable';
  }
}

export async function getSecureItem(key: StorageKey): Promise<string | null> {
  const cached = memory.get(key);
  if (typeof cached === 'string') return cached;

  try {
    const v = await SecureStore.getItemAsync(key);
    if (typeof v === 'string') memory.set(key, v);
    persistentStatus = 'available';
    return v;
  } catch {
    // fall through to AsyncStorage
  }

  try {
    const v = await AsyncStorage.getItem(key);
    if (typeof v === 'string') memory.set(key, v);
    persistentStatus = 'available';
    return v;
  } catch {
    persistentStatus = 'unavailable';
    return null;
  }
}

export async function removeSecureItem(key: StorageKey): Promise<void> {
  memory.delete(key);

  try {
    await SecureStore.deleteItemAsync(key);
    persistentStatus = 'available';
    return;
  } catch {
    // fall through to AsyncStorage
  }

  try {
    await AsyncStorage.removeItem(key);
    persistentStatus = 'available';
  } catch {
    persistentStatus = 'unavailable';
  }
}
