// H19 · Centro de notificaciones del usuario autenticado.

import { apiFetch } from "@/lib/api";
import { API_ROUTES } from "@/lib/api-routes";
import {
  asRecord,
  readArray,
  readBoolean,
  readNumber,
  readString,
} from "@/lib/api/normalize";
import type { Notification, NotificationPage } from "@/lib/types/notifications";

function normalizeNotification(raw: unknown, context: string): Notification {
  const record = asRecord(raw, context);

  return {
    id: readString(record, context, ["id", "notificationId"]),
    title: readString(record, context, ["title", "subject", "titulo"]),
    message: readString(record, context, ["message", "body", "content", "mensaje"]),
    createdAt: readString(record, context, [
      "createdAt",
      "created_at",
      "date",
      "fecha",
    ]),
    isRead: readBoolean(record, context, ["isRead", "read", "leida"]),
  };
}

export async function listMyNotifications(page = 1): Promise<NotificationPage> {
  const payload = await apiFetch<unknown>(
    `${API_ROUTES.notifications.me}?page=${encodeURIComponent(page)}`
  );
  const record = asRecord(payload, "notificaciones");
  const notifications = readArray(record, "notificaciones").map((item, index) =>
    normalizeNotification(item, `notificaciones[${index}]`)
  );

  return {
    notifications,
    unreadCount: readNumber(record, "notificaciones", [
      "unreadCount",
      "unread_count",
      "noLeidas",
    ]),
  };
}

export async function markNotificationAsRead(id: string): Promise<Notification> {
  const payload = await apiFetch<unknown>(
    API_ROUTES.notifications.markAsRead(id),
    { method: "PATCH" }
  );
  return normalizeNotification(payload, "notificación actualizada");
}
