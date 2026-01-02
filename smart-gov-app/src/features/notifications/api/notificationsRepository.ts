import { getApiClient, getMockApiClient } from '../../../core/api/axiosClient';
import type { Notification } from '../../../core/domain/notification';

type BackendNotificationItem = {
  id: string;
  type: string;
  content: string;
  sentAt: string;
};

export async function getNotifications(): Promise<Notification[]> {
  const res = await getApiClient().get<{ items: BackendNotificationItem[] }>('/me/notifications');
  const items = res.data.items ?? [];

  return items.map((n) => ({
    id: n.id,
    title: n.type,
    body: n.content,
    category: 'SYSTEM',
    createdAt: new Date(n.sentAt).getTime(),
    isRead: false,
  }));
}

export async function markNotificationRead(notificationId: string): Promise<Notification> {
  // TODO(backend): Replace with real API endpoint.
  const res = await getMockApiClient().patch<Notification>(`/notifications/${notificationId}/read`);
  return res.data;
}

export async function clearNotifications(): Promise<void> {
  // TODO(backend): Replace with real API endpoint.
  await getMockApiClient().post('/notifications/clear');
}
