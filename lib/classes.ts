// lib/classes.ts
// Reglas de presentación de sesiones de clase que comparten la reserva (H4),
// el panel del miembro y la administración (H6).

import { isoToLocalDate } from "@/lib/date-range";
import type { ClassReservation, ClassSession } from "@/lib/types/classes";

type SchedulableSession = Pick<
  ClassSession,
  "date" | "startTime" | "durationMinutes"
>;

function normalizeStatus(status: string): string {
  return status
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
}

export function isCancelledSession(status: string): boolean {
  return normalizeStatus(status).includes("cancel");
}

/** Estados observados: `Finalizada`; se toleran «Completada» y «Terminada». */
export function isFinishedSession(status: string): boolean {
  const value = normalizeStatus(status);
  return (
    value.includes("finaliz") ||
    value.includes("complet") ||
    value.includes("terminad")
  );
}

/** Fin de la clase en la zona horaria del club (fecha + hora + duración). */
export function sessionEndsAt(session: SchedulableSession): Date {
  const start = isoToLocalDate(session.date);
  const [hours, minutes] = session.startTime.split(":").map(Number);
  start.setHours(hours, minutes, 0, 0);
  return new Date(start.getTime() + Math.max(0, session.durationMinutes) * 60_000);
}

/**
 * Una clase se ofrece al miembro solo si sigue programada y no ha terminado.
 * Evita que las clases ya completadas aparezcan en la reserva y en el panel.
 */
export function isSessionBookable(
  session: ClassSession,
  now: Date = new Date()
): boolean {
  if (isCancelledSession(session.status) || isFinishedSession(session.status)) {
    return false;
  }
  return sessionEndsAt(session).getTime() > now.getTime();
}

/** Orden de administración: la sesión más reciente primero. */
export function compareSessionsNewestFirst(
  a: Pick<ClassSession, "date" | "startTime">,
  b: Pick<ClassSession, "date" | "startTime">
): number {
  return `${b.date}T${b.startTime}`.localeCompare(`${a.date}T${a.startTime}`);
}

/** IDs de las clases con una reserva vigente del miembro autenticado. */
export function activeReservedSessionIds(
  reservations: readonly ClassReservation[]
): Set<string> {
  return new Set(
    reservations
      .filter((reservation) => reservation.status === "Activa")
      .map((reservation) => reservation.classId)
  );
}
