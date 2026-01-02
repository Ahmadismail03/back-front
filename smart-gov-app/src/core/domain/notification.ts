export type NotificationCategory = 'APPOINTMENT' | 'SERVICE' | 'SYSTEM';

export type Notification = {
  id: string;
  title: string;
  body: string;
  category: NotificationCategory;
  createdAt: number; // epoch ms
  isRead: boolean;
};
