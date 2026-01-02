import { StorageKeys } from '../../../core/storage/keys';
import { getSecureItem, setSecureItem } from '../../../core/storage/secureStorage';

function normalizeNationalId(value: string): string {
  return String(value ?? '').trim();
}

async function loadTrustedIds(): Promise<Set<string>> {
  const raw = await getSecureItem(StorageKeys.authTrustedNationalIds);
  if (!raw) return new Set();
  try {
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return new Set();
    const ids = parsed.filter((x) => typeof x === 'string').map((x) => normalizeNationalId(x)).filter(Boolean);
    return new Set(ids);
  } catch {
    return new Set();
  }
}

async function saveTrustedIds(ids: Set<string>): Promise<void> {
  await setSecureItem(StorageKeys.authTrustedNationalIds, JSON.stringify(Array.from(ids)));
}

export async function isTrustedDeviceForNationalId(nationalId: string): Promise<boolean> {
  const nid = normalizeNationalId(nationalId);
  if (!nid) return false;
  const ids = await loadTrustedIds();
  return ids.has(nid);
}

export async function trustThisDeviceForNationalId(nationalId: string): Promise<void> {
  const nid = normalizeNationalId(nationalId);
  if (!nid) return;
  const ids = await loadTrustedIds();
  ids.add(nid);
  await saveTrustedIds(ids);
}
