import { create } from 'zustand';
import { StorageKeys } from '../../../core/storage/keys';
import {
  getSecureItem,
  removeSecureItem,
  setSecureItem,
} from '../../../core/storage/secureStorage';
import type { User } from '../../../core/domain/user';
import * as authRepo from '../api/authRepository';
import { setSessionToken } from '../../../core/auth/session';

export type AuthStatus = 'hydrating' | 'anonymous' | 'authenticated';

type AuthState = {
  authStatus: AuthStatus;
  token: string | null;
  user: User | null;
  isLoading: boolean;
  error: string | null;
  hasBootstrapped: boolean;
  setToken: (token: string | null) => void;
  setAuthStatus: (status: AuthStatus) => void;
  bootstrap: () => Promise<void>;
  requestLoginOtp: (nationalId: string, phoneNumber: string) => Promise<authRepo.RequestOtpResponse>;
  requestSignupOtp: (nationalId: string, phoneNumber: string, fullName: string) => Promise<authRepo.RequestOtpResponse>;
  verifyOtp: (phoneNumber: string, otp: string) => Promise<authRepo.VerifyOtpResponse>;
  signOut: () => Promise<void>;
};

export const useAuthStore = create<AuthState>((set, get) => ({
  authStatus: 'hydrating',
  token: null,
  user: null,
  isLoading: false,
  error: null,
  hasBootstrapped: false,

  setToken: (token) => {
    setSessionToken(token);
    set({ token });
  },

  setAuthStatus: (authStatus) => set({ authStatus }),

  bootstrap: async () => {
    try {
      set({ authStatus: 'hydrating', error: null });
      const token = await getSecureItem(StorageKeys.authToken);
      const userRaw = await getSecureItem(StorageKeys.authUser);
      let user: User | null = null;
      if (userRaw) {
        try {
          user = JSON.parse(userRaw) as User;
        } catch {
          user = null;
        }
      }
      setSessionToken(token ?? null);
      set({
        token: token ?? null,
        user,
        authStatus: token ? 'authenticated' : 'anonymous',
        hasBootstrapped: true,
      });
    } catch (e: any) {
      set({
        token: null,
        authStatus: 'anonymous',
        user: null,
        hasBootstrapped: true,
        error: e?.message ?? 'Storage unavailable',
      });
      setSessionToken(null);
    }
  },

  requestLoginOtp: async (nationalId, phoneNumber) => {
    set({ isLoading: true, error: null });
    try {
      const res = await authRepo.requestLoginOtp(nationalId, phoneNumber);
      set({ isLoading: false });
      return res;
    } catch (e: any) {
      set({ isLoading: false, error: e?.message ?? 'Request failed' });
      throw e;
    }
  },

  requestSignupOtp: async (nationalId, phoneNumber, fullName) => {
    set({ isLoading: true, error: null });
    try {
      const res = await authRepo.requestSignupOtp(nationalId, phoneNumber, fullName);
      set({ isLoading: false });
      return res;
    } catch (e: any) {
      set({ isLoading: false, error: e?.message ?? 'Request failed' });
      throw e;
    }
  },

  verifyOtp: async (phoneNumber, otp) => {
    set({ isLoading: true, error: null });
    try {
      const res = await authRepo.verifyOtp(phoneNumber, otp);
      await setSecureItem(StorageKeys.authToken, res.token);
      await setSecureItem(StorageKeys.authUser, JSON.stringify(res.user));
      setSessionToken(res.token);
      set({
        token: res.token,
        user: res.user,
        authStatus: 'authenticated',
        hasBootstrapped: true,
        isLoading: false,
      });
      return res;
    } catch (e: any) {
      set({ isLoading: false, error: e?.message ?? 'Verification failed' });
      throw e;
    }
  },

  signOut: async () => {
    await removeSecureItem(StorageKeys.authToken);
    await removeSecureItem(StorageKeys.authUser);
    setSessionToken(null);
    set({ token: null, user: null, authStatus: 'anonymous', hasBootstrapped: true });
  },
}));

export function isVerified(): boolean {
  return useAuthStore.getState().authStatus === 'authenticated';
}
