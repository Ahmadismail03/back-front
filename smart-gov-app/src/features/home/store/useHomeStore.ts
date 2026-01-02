import { create } from 'zustand';
import type { HomePayload } from '../../../core/domain/home';
import * as repo from '../api/homeRepository';
import i18n from '../../../core/i18n/init';

type HomeState = {
  home: HomePayload | null;
  isLoading: boolean;
  error: string | null;
  load: () => Promise<void>;
};

export const useHomeStore = create<HomeState>((set) => ({
  home: null,
  isLoading: false,
  error: null,

  load: async () => {
    set({ isLoading: true, error: null });
    try {
      const home = await repo.getHome();
      set({ home, isLoading: false });
    } catch (e: any) {
      set({ isLoading: false, error: e?.message ?? i18n.t('common.errorDesc') });
    }
  },
}));
