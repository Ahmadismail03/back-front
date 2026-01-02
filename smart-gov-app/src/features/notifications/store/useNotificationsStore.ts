import { create } from 'zustand';
import type { Notification } from '../../../core/domain/notification';
import * as repo from '../api/notificationsRepository';
import i18n from '../../../core/i18n/init';

type NotificationsState = {
  notifications: Notification[];
  isLoading: boolean;
  error: string | null;
  load: () => Promise<void>;
  markRead: (notificationId: string) => Promise<void>;
  clearAll: () => Promise<void>;
};

export const useNotificationsStore = create<NotificationsState>((set, get) => ({
  notifications: [],
  isLoading: false,
  error: null,

  load: async () => {
    set({ isLoading: true, error: null });
    try {
      const notifications = await repo.getNotifications();
      notifications.sort((a, b) => b.createdAt - a.createdAt);
      set({ notifications, isLoading: false });
    } catch (e: any) {
      set({ isLoading: false, error: e?.message ?? i18n.t('common.errorDesc') });
    }
  },

  markRead: async (notificationId) => {
    try {
      const updated = await repo.markNotificationRead(notificationId);
      set({
        notifications: get().notifications.map((n) => (n.id === notificationId ? updated : n)),
      });
    } catch (e: any) {
      set({ error: e?.message ?? i18n.t('common.errorDesc') });
      throw e;
    }
  },

  clearAll: async () => {
    set({ isLoading: true, error: null });
    try {
      await repo.clearNotifications();
      set({ notifications: [], isLoading: false });
    } catch (e: any) {
      set({ isLoading: false, error: e?.message ?? i18n.t('common.errorDesc') });
      throw e;
    }
  },
}));
