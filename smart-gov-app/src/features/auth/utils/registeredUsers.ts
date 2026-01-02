import { StorageKeys } from '../../../core/storage/keys';
import { getSecureItem, setSecureItem } from '../../../core/storage/secureStorage';

export type RegisteredUser = {
  nationalId: string;
  phoneNumber: string;
  fullName: string;
};

function normalizeNationalId(value: string): string {
  return value.trim();
}

function normalizePhoneNumber(value: string): string {
  return value.trim();
}

async function loadAll(): Promise<RegisteredUser[]> {
  const raw = await getSecureItem(StorageKeys.authRegisteredUsers);
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed
      .filter(
        (u) => typeof u?.nationalId === 'string' && typeof u?.phoneNumber === 'string' && typeof u?.fullName === 'string'
      )
      .map((u) => ({
        nationalId: normalizeNationalId(u.nationalId),
        phoneNumber: normalizePhoneNumber(u.phoneNumber),
        fullName: u.fullName.trim(),
      }));
  } catch {
    return [];
  }
}

async function saveAll(users: RegisteredUser[]): Promise<void> {
  await setSecureItem(StorageKeys.authRegisteredUsers, JSON.stringify(users));
}

export async function findRegisteredUser(nationalId: string): Promise<RegisteredUser | null> {
  const nid = normalizeNationalId(nationalId);
  if (!nid) return null;
  const users = await loadAll();
  return users.find((u) => u.nationalId === nid) ?? null;
}

export async function upsertRegisteredUser(user: RegisteredUser): Promise<void> {
  const next: RegisteredUser = {
    nationalId: normalizeNationalId(user.nationalId),
    phoneNumber: normalizePhoneNumber(user.phoneNumber),
    fullName: user.fullName.trim(),
  };
  if (!next.nationalId || !next.phoneNumber) return;
  const users = await loadAll();
  const existingIndex = users.findIndex((u) => u.nationalId === next.nationalId);
  if (existingIndex >= 0) users[existingIndex] = next;
  else users.push(next);
  await saveAll(users);
}

export async function updateRegisteredUserPhone(nationalId: string, newPhoneNumber: string): Promise<RegisteredUser | null> {
  const nid = normalizeNationalId(nationalId);
  const phoneNumber = normalizePhoneNumber(newPhoneNumber);
  if (!nid || !phoneNumber) return null;
  const users = await loadAll();
  const idx = users.findIndex((u) => u.nationalId === nid);
  if (idx < 0) return null;
  const updated: RegisteredUser = { ...users[idx], phoneNumber };
  users[idx] = updated;
  await saveAll(users);
  return updated;
}
