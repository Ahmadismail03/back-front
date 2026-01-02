import { create } from 'zustand';

type LanguageChangeState = {
  isChanging: boolean;
  setIsChanging: (changing: boolean) => void;
};

export const useLanguageChangeStore = create<LanguageChangeState>((set) => ({
  isChanging: false,
  setIsChanging: (changing: boolean) => set({ isChanging: changing }),
}));

