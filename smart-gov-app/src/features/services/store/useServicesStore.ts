import { create } from 'zustand';
import type { Service } from '../../../core/domain/service';
import * as repo from '../api/servicesRepository';
import i18n from '../../../core/i18n/init';

type ServicesState = {
  services: Service[];
  isLoading: boolean;
  error: string | null;
  search: string;
  category: string;
  load: () => Promise<void>;
  setSearch: (v: string) => void;
  setCategory: (v: string) => void;
};

export const useServicesStore = create<ServicesState>((set, get) => ({
  services: [],
  isLoading: false,
  error: null,
  search: '',
  category: 'ALL',

  load: async () => {
    set({ isLoading: true, error: null });
    try {
      const services = await repo.getServices();
      set({ services, isLoading: false });
    } catch (e: any) {
      set({ isLoading: false, error: e?.message ?? i18n.t('common.errorDesc') });
    }
  },

  setSearch: (v) => set({ search: v }),
  setCategory: (v) => set({ category: v }),
}));

export function selectVisibleServices(state: ServicesState): Service[] {
  const enabled = state.services.filter((s) => s.isEnabled);
  const bySearch = state.search.trim()
    ? enabled.filter((s) => s.name.toLowerCase().includes(state.search.trim().toLowerCase()))
    : enabled;
  if (state.category === 'ALL') return bySearch;
  return bySearch.filter((s) => s.category === state.category);
}
