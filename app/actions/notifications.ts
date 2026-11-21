"use server";

import { hasAnyRole } from "@/lib/auth-guard";
import { searchMembers } from "@/lib/api/members";
import {
  listMyNotifications,
  markNotificationAsRead,
  sendNotification,
} from "@/lib/api/notifications";
import {
  describeApiError,
  errorCode,
  logActionError,
} from "@/lib/actions/errors";
import type { ActionErrorCode } from "@/lib/actions/form-state";
import {
  NOTIFICATION_MESSAGE_MAX,
  NOTIFICATION_RECIPIENTS_MAX,
  NOTIFICATION_SOURCES,
  NOTIFICATION_TITLE_MAX,
  type Notification,
  type NotificationPage,
  type NotificationRecipient,
  type SendNotificationInput,
} from "@/lib/types/notifications";

const ROLES = ["MIEMBRO", "ENTRENADOR", "RECEPCION_ADMIN"] as const;
const SENDER_ROLES = ["RECEPCION_ADMIN", "ENTRENADOR"] as const;

export async function listNotificationsAction(
  page = 1
): Promise<{ ok: true; data: NotificationPage } | { ok: false; message: string }> {
  if (!(await hasAnyRole([...ROLES]))) {
    return { ok: false, message: "Inicia sesión para consultar tus notificaciones." };
  }
  if (!Number.isInteger(page) || page < 1) {
    return { ok: false, message: "La página solicitada no es válida." };
  }

  try {
    return { ok: true, data: await listMyNotifications(page) };
  } catch (cause) {
    logActionError("notifications.list", cause);
    return {
      ok: false,
      message: describeApiError(cause, "No pudimos cargar tus notificaciones."),
    };
  }
}

export async function markNotificationAsReadAction(
  id: string
): Promise<{ ok: true; notification: Notification } | { ok: false; message: string }> {
  if (!(await hasAnyRole([...ROLES]))) {
    return { ok: false, message: "No tienes permiso para actualizar notificaciones." };
  }
  if (!id.trim()) return { ok: false, message: "No se indicó la notificación." };

  try {
    return { ok: true, notification: await markNotificationAsRead(id) };
  } catch (cause) {
    logActionError("notifications.markAsRead", cause);
    return {
      ok: false,
      message: describeApiError(cause, "No pudimos marcar la notificación."),
    };
  }
}

export type NotificationRecipientsResult =
  | { ok: true; recipients: NotificationRecipient[] }
  | { ok: false; message: string };

/** Destinatarios del despacho. `ENTRENADOR` recibe solo sus miembros. */
export async function searchNotificationRecipientsAction(
  query = ""
): Promise<NotificationRecipientsResult> {
  if (!(await hasAnyRole([...SENDER_ROLES]))) {
    return { ok: false, message: "No tienes permiso para enviar avisos." };
  }

  try {
    const members = await searchMembers(query);
    return {
      ok: true,
      recipients: members.map((member) => ({
        id: member.id,
        name: member.name || member.cardNumber || member.email || member.id,
        email: member.email,
        cardNumber: member.cardNumber,
      })),
    };
  } catch (cause) {
    logActionError("GET /api/users (destinatarios)", cause);
    return {
      ok: false,
      message: describeApiError(cause, "No pudimos cargar los destinatarios."),
    };
  }
}

export type SendNotificationResult =
  | { ok: true; sent: number; message: string }
  | { ok: false; message: string; code?: ActionErrorCode };

/**
 * `POST /api/notifications/send`.
 * La acción es alcanzable por POST directo, así que valida rol, destinatarios
 * y longitudes además de la validación del formulario.
 */
export async function sendNotificationAction(
  input: SendNotificationInput
): Promise<SendNotificationResult> {
  if (!(await hasAnyRole([...SENDER_ROLES]))) {
    return { ok: false, message: "No tienes permiso para enviar avisos", code: "forbidden" };
  }

  const recipientIds = [
    ...new Set(
      (Array.isArray(input.recipientIds) ? input.recipientIds : [])
        .map((id) => id.trim())
        .filter(Boolean)
    ),
  ];
  const title = input.title?.trim() ?? "";
  const message = input.message?.trim() ?? "";
  const referenceId = input.referenceId?.trim() ?? "";

  if (recipientIds.length === 0) {
    return { ok: false, message: "Selecciona al menos un destinatario." };
  }
  if (recipientIds.length > NOTIFICATION_RECIPIENTS_MAX) {
    return {
      ok: false,
      message: `Puedes enviar a un máximo de ${NOTIFICATION_RECIPIENTS_MAX} personas por aviso.`,
    };
  }
  if (!title) return { ok: false, message: "El título es obligatorio." };
  if (title.length > NOTIFICATION_TITLE_MAX) {
    return {
      ok: false,
      message: `El título admite un máximo de ${NOTIFICATION_TITLE_MAX} caracteres.`,
    };
  }
  if (!message) return { ok: false, message: "El mensaje es obligatorio." };
  if (message.length > NOTIFICATION_MESSAGE_MAX) {
    return {
      ok: false,
      message: `El mensaje admite un máximo de ${NOTIFICATION_MESSAGE_MAX} caracteres.`,
    };
  }
  if (referenceId.length > 100) {
    return { ok: false, message: "La referencia admite un máximo de 100 caracteres." };
  }
  if (!NOTIFICATION_SOURCES.includes(input.sourceModule)) {
    return { ok: false, message: "Selecciona un módulo válido." };
  }

  try {
    const result = await sendNotification({
      recipientIds,
      title,
      message,
      sourceModule: input.sourceModule,
      referenceId,
    });
    return {
      ok: true,
      sent: result.sent,
      message: `Aviso enviado a ${result.sent} ${
        result.sent === 1 ? "persona" : "personas"
      }.`,
    };
  } catch (cause) {
    logActionError("POST /api/notifications/send", cause);
    return {
      ok: false,
      message: describeApiError(cause, "No pudimos enviar el aviso."),
      code: errorCode(cause),
    };
  }
}
