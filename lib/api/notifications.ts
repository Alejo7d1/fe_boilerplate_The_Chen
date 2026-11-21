// H19 · Centro de notificaciones del usuario autenticado y despacho manual.

import { apiFetch } from "@/lib/api";
import { API_ROUTES } from "@/lib/api-routes";
import {
  asRecord,
  ContractError,
  readArray,
  readBoolean,
  readNumber,
  readString,
} from "@/lib/api/normalize";
import type {
  Notification,
  NotificationPage,
  SendNotificationInput,
  SendNotificationResponse,
} from "@/lib/types/notifications";

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

/**
 * `POST /api/notifications/send` · 201 `{ sent, notificationIds }`.
 * El body lleva exactamente los campos del contrato: el backend rechaza
 * cualquier propiedad extra con `400`.
 */
export function normalizeSentNotification(
  raw: unknown
): SendNotificationResponse {
  const record = asRecord(raw, "envío de notificación");
  const ids = record.notificationIds;

  if (
    !Array.isArray(ids) ||
    ids.some((id) => typeof id !== "string" || !id.trim())
  ) {
    throw new ContractError(
      "envío.notificationIds",
      "La respuesta del envío no incluye el arreglo `notificationIds`."
    );
  }

  return {
    sent: readNumber(record, "envío de notificación", ["sent", "sentCount"]),
    notificationIds: ids.map((id) => (id as string).trim()),
  };
}

export async function sendNotification(
  input: SendNotificationInput
): Promise<SendNotificationResponse> {
  const referenceId = input.referenceId?.trim();
  const body: SendNotificationInput = {
    recipientIds: [
      ...new Set(input.recipientIds.map((id) => id.trim()).filter(Boolean)),
    ],
    title: input.title.trim(),
    message: input.message.trim(),
    sourceModule: input.sourceModule,
  };
  if (referenceId) body.referenceId = referenceId;

  const payload = await apiFetch<unknown>(API_ROUTES.notifications.send, {
    method: "POST",
    body: JSON.stringify(body),
  });
  return normalizeSentNotification(payload);
}
