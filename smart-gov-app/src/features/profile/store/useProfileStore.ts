import { create } from 'zustand';
import { StorageKeys } from '../../../core/storage/keys';
import { getSecureItem, removeSecureItem, setSecureItem } from '../../../core/storage/secureStorage';

type ProfileDetails = {
  firstName: string;
  secondName: string;
  thirdName: string;
  lastName: string;
  username: string;
  password: string;
  email: string;
  birthDate: string;
  gender: string;
  birthPlace: string;
  motherName: string;
  address: string;
  idDocumentUri: string | null;
  passportDocumentUri: string | null;
  birthCertificateUri: string | null;
};

type State = {
  hasBootstrapped: boolean;
  isLoading: boolean;
  error: string | null;
  fullName: string;
  photoUri: string | null;
  details: ProfileDetails;
  bootstrap: () => Promise<void>;
  setFullName: (fullName: string) => Promise<void>;
  setPhotoUri: (photoUri: string | null) => Promise<void>;
  setDetails: (partial: Partial<ProfileDetails>) => Promise<void>;
  clear: () => Promise<void>;
};

const emptyDetails: ProfileDetails = {
  firstName: '',
  secondName: '',
  thirdName: '',
  lastName: '',
  username: '',
  password: '',
  email: '',
  birthDate: '',
  gender: '',
  birthPlace: '',
  motherName: '',
  address: '',
   idDocumentUri: null,
   passportDocumentUri: null,
   birthCertificateUri: null,
};

export const useProfileStore = create<State>((set, get) => ({
  hasBootstrapped: false,
  isLoading: false,
  error: null,
  fullName: '',
  photoUri: null,
  details: emptyDetails,

  bootstrap: async () => {
    if (get().hasBootstrapped) return;
    set({ isLoading: true, error: null });
    try {
      const [fullName, photoUri, rawDetails] = await Promise.all([
        getSecureItem(StorageKeys.profileFullName),
        getSecureItem(StorageKeys.profilePhotoUri),
        getSecureItem(StorageKeys.profileDetails),
      ]);

      let parsedDetails: ProfileDetails = emptyDetails;
      if (rawDetails) {
        try {
          parsedDetails = { ...emptyDetails, ...(JSON.parse(rawDetails) as Partial<ProfileDetails>) };
        } catch {
          parsedDetails = emptyDetails;
        }
      }

      set({
        fullName: fullName ?? '',
        photoUri: photoUri ?? null,
        details: parsedDetails,
        isLoading: false,
        hasBootstrapped: true,
      });
    } catch (e: any) {
      set({
        isLoading: false,
        error: e?.message ?? 'Storage unavailable',
        hasBootstrapped: true,
      });
    }
  },

  setFullName: async (fullName) => {
    set({ fullName });
    try {
      await setSecureItem(StorageKeys.profileFullName, fullName);
    } catch {
      // Non-fatal; we still keep it in memory.
    }
  },

  setPhotoUri: async (photoUri) => {
    set({ photoUri });
    try {
      if (photoUri) await setSecureItem(StorageKeys.profilePhotoUri, photoUri);
      else await removeSecureItem(StorageKeys.profilePhotoUri);
    } catch {
      // Non-fatal; we still keep it in memory.
    }
  },

  setDetails: async (partial) => {
    const current = get().details;
    const next: ProfileDetails = { ...current, ...partial };
    set({ details: next });
    try {
      await setSecureItem(StorageKeys.profileDetails, JSON.stringify(next));
    } catch {
      // Non-fatal; we still keep it in memory.
    }
  },

  clear: async () => {
    set({ fullName: '', photoUri: null, details: emptyDetails });
    try {
      await Promise.all([
        removeSecureItem(StorageKeys.profileFullName),
        removeSecureItem(StorageKeys.profilePhotoUri),
        removeSecureItem(StorageKeys.profileDetails),
      ]);
    } catch {
      // ignore
    }
  },
}));
