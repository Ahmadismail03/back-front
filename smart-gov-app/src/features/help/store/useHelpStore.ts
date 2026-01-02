import { create } from 'zustand';
import type { HelpTopic } from '../../../core/domain/helpTopic';
import * as repo from '../api/helpRepository';
import i18n from '../../../core/i18n/init';

type HelpState = {
  topics: HelpTopic[];
  isLoading: boolean;
  error: string | null;
  query: string;
  setQuery: (v: string) => void;
  search: () => Promise<void>;
};

export const useHelpStore = create<HelpState>((set, get) => ({
  topics: [],
  isLoading: false,
  error: null,
  query: '',

  setQuery: (v) => set({ query: v }),

  search: async () => {
    set({ isLoading: true, error: null });
    try {
      const topics = await repo.searchHelpTopics(get().query);
      set({ topics, isLoading: false });
    } catch (e: any) {
      set({ isLoading: false, error: e?.message ?? i18n.t('common.errorDesc') });
    }
  },
}));
