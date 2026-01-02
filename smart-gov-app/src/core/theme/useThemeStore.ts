import { create } from 'zustand';
import { StorageKeys } from '../storage/keys';
import { getSecureItem, setSecureItem } from '../storage/secureStorage';

export type ThemeMode = 'light' | 'dark';

type ThemeState = {
  mode: ThemeMode;
  hasBootstrapped: boolean;
  bootstrap: () => Promise<void>;
  setMode: (mode: ThemeMode) => Promise<void>;
  toggle: () => Promise<void>;
};

export const useThemeStore = create<ThemeState>((set, get) => ({
  mode: 'light',
  hasBootstrapped: false,

  bootstrap: async () => {
    const saved = await getSecureItem(StorageKeys.themeMode);
    const mode: ThemeMode = saved === 'dark' ? 'dark' : 'light';
    set({ mode, hasBootstrapped: true });
  },

  setMode: async (mode) => {
    set({ mode });
    await setSecureItem(StorageKeys.themeMode, mode);
  },

  toggle: async () => {
    const next: ThemeMode = get().mode === 'dark' ? 'light' : 'dark';
    await get().setMode(next);
  },
}));
