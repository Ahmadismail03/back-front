import { create } from 'zustand';
import type { ReminderChannel, ReminderPreference, ReminderLeadTimeHours } from '../../../core/domain/reminderPreference';
import { StorageKeys } from '../../../core/storage/keys';
import { getSecureItem, setSecureItem } from '../../../core/storage/secureStorage';
import * as repo from '../api/preferencesRepository';
import i18n from '../../../core/i18n/init';

const defaultPref: ReminderPreference = { enabled: true, leadTimeHours: 24, channel: 'sms', email: '' };

async function loadFromStorage(): Promise<ReminderPreference | null> {
  const raw = await getSecureItem(StorageKeys.reminderPreference);
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw);
    if (typeof parsed?.enabled !== 'boolean') return null;
    if (parsed?.leadTimeHours !== 48 && parsed?.leadTimeHours !== 24 && parsed?.leadTimeHours !== 2) return null;
    const channel: ReminderChannel = ['none', 'sms', 'email', 'both'].includes(parsed?.channel) ? parsed.channel : 'none';
    const email = typeof parsed?.email === 'string' ? parsed.email : '';
    return {
      enabled: parsed.enabled,
      leadTimeHours: parsed.leadTimeHours,
      channel: parsed.enabled ? channel : 'none',
      email: parsed.enabled ? email : '',
    };
  } catch {
    return null;
  }
}

async function saveToStorage(pref: ReminderPreference): Promise<void> {
  await setSecureItem(StorageKeys.reminderPreference, JSON.stringify(pref));
}

type State = {
  pref: ReminderPreference;
  isLoading: boolean;
  error: string | null;
  load: () => Promise<void>;
  setEnabled: (enabled: boolean) => Promise<void>;
  setLeadTimeHours: (hours: ReminderLeadTimeHours) => Promise<void>;
  setChannel: (channel: ReminderChannel) => Promise<void>;
  setEmail: (email: string) => Promise<void>;
};

export const useReminderPreferencesStore = create<State>((set, get) => ({
  pref: defaultPref,
  isLoading: false,
  error: null,

  load: async () => {
    set({ isLoading: true, error: null });
    try {
      const local = await loadFromStorage();
      if (local) set({ pref: local });

      // Attempt server sync (mock requires auth; caller should ensure token).
      const remote = await repo.getReminderPreference();
      set({ pref: remote, isLoading: false });
      await saveToStorage(remote);
    } catch (e: any) {
      // Keep local/default pref; surface error.
      set({ isLoading: false, error: e?.message ?? i18n.t('common.errorDesc') });
    }
  },

  setEnabled: async (enabled) => {
    const current = get().pref;
    const next: ReminderPreference = {
      ...current,
      enabled,
      channel: enabled ? (current.channel === 'none' ? 'sms' : current.channel) : 'none',
      email: enabled ? current.email : '',
    };
    set({ pref: next, error: null });
    await saveToStorage(next);
    try {
      const saved = await repo.setReminderPreference(next);
      set({ pref: saved });
      await saveToStorage(saved);
    } catch (e: any) {
      set({ error: e?.message ?? i18n.t('common.errorDesc') });
    }
  },

  setLeadTimeHours: async (hours) => {
    const next: ReminderPreference = { ...get().pref, leadTimeHours: hours };
    set({ pref: next, error: null });
    await saveToStorage(next);
    try {
      const saved = await repo.setReminderPreference(next);
      set({ pref: saved });
      await saveToStorage(saved);
    } catch (e: any) {
      set({ error: e?.message ?? i18n.t('common.errorDesc') });
    }
  },

  setChannel: async (channel) => {
    const current = get().pref;
    const next: ReminderPreference = {
      ...current,
      enabled: channel === 'none' ? false : true,
      channel,
    };
    set({ pref: next, error: null });
    await saveToStorage(next);
    try {
      const saved = await repo.setReminderPreference(next);
      set({ pref: saved });
      await saveToStorage(saved);
    } catch (e: any) {
      set({ error: e?.message ?? i18n.t('common.errorDesc') });
    }
  },

  setEmail: async (email) => {
    const next: ReminderPreference = { ...get().pref, email };
    set({ pref: next, error: null });
    await saveToStorage(next);
    try {
      const saved = await repo.setReminderPreference(next);
      set({ pref: saved });
      await saveToStorage(saved);
    } catch (e: any) {
      set({ error: e?.message ?? i18n.t('common.errorDesc') });
    }
  },
}));
