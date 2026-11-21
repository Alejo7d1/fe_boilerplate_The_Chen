// lib/dashboard.ts
// Lectura tolerante y cálculos de presentación del panel.
// Solo filtra, ordena y deriva cifras de lo que devuelve la API: no agrega datos.

import { describeApiError, logActionError } from "@/lib/actions/errors";
import { todayIso } from "@/lib/date-range";
import type { ClassReservation, ClassSession } from "@/lib/types/classes";
import type { IsoDate, IsoTime } from "@/lib/types/common";
import type { TrainerAvailabilitySlot } from "@/lib/types/trainers";

export interface SettledData<T> {
  data: T | null;
  error: string | null;
}

/**
 * Convierte un `PromiseSettledResult` en datos + mensaje para la UI, de modo
 * que un endpoint caído no arrastre al resto de las tarjetas del panel.
 */
export function readSettled<T>(
  result: PromiseSettledResult<T>,
  scope: string,
  fallback: string
): SettledData<T> {
  if (result.status === "fulfilled") return { data: result.value, error: null };
  logActionError(scope, result.reason);
  return { data: null, error: describeApiError(result.reason, fallback) };
}

interface Scheduled {
  date: IsoDate;
  startTime: IsoTime;
}

function byDateTime(a: Scheduled, b: Scheduled): number {
  return `${a.date}T${a.startTime}`.localeCompare(`${b.date}T${b.startTime}`);
}

function isCancelledStatus(status: string): boolean {
  return status.trim().toLowerCase().includes("cancel");
}

/** Reservas vigentes desde hoy, ordenadas por fecha y hora. */
export function upcomingReservations(
  reservations: readonly ClassReservation[],
  limit?: number
): ClassReservation[] {
  const today = todayIso();
  const result = reservations
    .filter(
      (reservation) => reservation.status === "Activa" && reservation.date >= today
    )
    .sort(byDateTime);
  return limit === undefined ? result : result.slice(0, limit);
}

/** Sesiones no canceladas desde hoy, ordenadas por fecha y hora. */
export function upcomingSessions(
  sessions: readonly ClassSession[],
  limit?: number
): ClassSession[] {
  const today = todayIso();
  const result = sessions
    .filter((session) => !isCancelledStatus(session.status) && session.date >= today)
    .sort(byDateTime);
  return limit === undefined ? result : result.slice(0, limit);
}

/** Cupos ocupados derivados del cupo máximo y los disponibles. */
export function occupiedSeats(session: ClassSession): number {
  return Math.max(0, session.maxCapacity - Math.max(0, session.availableSpots));
}

export function sumOccupancy(sessions: readonly ClassSession[]): {
  occupied: number;
  capacity: number;
} {
  return sessions.reduce(
    (accumulator, session) => ({
      occupied: accumulator.occupied + occupiedSeats(session),
      capacity: accumulator.capacity + Math.max(0, session.maxCapacity),
    }),
    { occupied: 0, capacity: 0 }
  );
}

/** Bloques de disponibilidad desde hoy, ordenados por fecha y hora. */
export function upcomingSlots(
  slots: readonly TrainerAvailabilitySlot[],
  limit?: number
): TrainerAvailabilitySlot[] {
  const today = todayIso();
  const result = slots
    .filter((slot) => slot.date >= today)
    .sort(byDateTime);
  return limit === undefined ? result : result.slice(0, limit);
}

export interface SlotTally {
  total: number;
  free: number;
  booked: number;
  unknown: number;
}

export function tallySlots(slots: readonly TrainerAvailabilitySlot[]): SlotTally {
  return {
    total: slots.length,
    free: slots.filter((slot) => slot.isBooked === false).length,
    booked: slots.filter((slot) => slot.isBooked === true).length,
    unknown: slots.filter((slot) => slot.isBooked === null).length,
  };
}
