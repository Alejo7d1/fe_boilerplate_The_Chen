"use server";

import { hasAnyRole } from "@/lib/auth-guard";
import {
  listMyNotifications,
  markNotificationAsRead,
} from "@/lib/api/notifications";
import { describeApiError, logActionError } from "@/lib/actions/errors";
import type { Notification, NotificationPage } from "@/lib/types/notifications";

const ROLES = ["MIEMBRO", "ENTRENADOR", "RECEPCION_ADMIN"] as const;

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
