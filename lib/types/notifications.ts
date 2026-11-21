export interface Notification {
  id: string;
  title: string;
  message: string;
  createdAt: string;
  isRead: boolean;
}

export interface NotificationPage {
  notifications: Notification[];
  unreadCount: number;
}
