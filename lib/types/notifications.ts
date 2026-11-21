// lib/types/notifications.ts
// H19 · Centro de notificaciones y despacho manual de avisos.
// Contrato de `POST /api/notifications/send` documentado en notifications-send.md.

import type { EntityId } from "@/lib/types/common";

export const NOTIFICATION_SOURCES = [
  "MEMBRESIA",
  "CLASES",
  "PAGOS",
  "EQUIPAMIENTO",
] as const;

export type NotificationSource = (typeof NOTIFICATION_SOURCES)[number];

export const NOTIFICATION_TITLE_MAX = 100;
export const NOTIFICATION_MESSAGE_MAX = 500;
export const NOTIFICATION_RECIPIENTS_MAX = 50;

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

/** Destinatario disponible para el despacho manual. */
export interface NotificationRecipient {
  id: EntityId;
  name: string;
  email?: string;
  cardNumber?: string;
}

/** El backend solo acepta exactamente estos cinco campos. */
export interface SendNotificationInput {
  recipientIds: string[];
  title: string;
  message: string;
  sourceModule: NotificationSource;
  referenceId?: string;
}

export interface SendNotificationResponse {
  sent: number;
  notificationIds: string[];
}

