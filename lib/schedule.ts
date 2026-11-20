// lib/schedule.ts
// Horario de operación del club. Lo comparten la agenda de clases (H6) y los
// bloques de disponibilidad del entrenador (H7).

import type { IsoTime } from "@/lib/types/common";

export const CLUB_OPEN_TIME: IsoTime = "06:00";
export const CLUB_CLOSE_TIME: IsoTime = "21:00";

/** BE-7.1: cada bloque de disponibilidad dura 60 minutos. */
export const AVAILABILITY_SLOT_MINUTES = 60;

export function toMinutes(time: IsoTime): number {
  const [hours, minutes] = time.split(":").map(Number);
  return hours * 60 + minutes;
}

export function fromMinutes(totalMinutes: number): IsoTime {
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  return `${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}`;
}

export function addMinutes(time: IsoTime, minutes: number): IsoTime {
  return fromMinutes(toMinutes(time) + minutes);
}

/** Horas de inicio entre apertura y cierre (`stepMinutes`); el cierre es exclusivo. */
export function timeOptions(stepMinutes: number): IsoTime[] {
  const open = toMinutes(CLUB_OPEN_TIME);
  const close = toMinutes(CLUB_CLOSE_TIME);
  const options: IsoTime[] = [];
  for (let minute = open; minute < close; minute += stepMinutes) {
    options.push(fromMinutes(minute));
  }
  return options;
}

/** Bloques de 60 minutos: 06:00, 07:00, …, 20:00. */
export const AVAILABILITY_START_OPTIONS = timeOptions(AVAILABILITY_SLOT_MINUTES);

/**
 * Un bloque debe empezar y terminar dentro del horario del club. Se usa tanto
 * en la UI como en la validación de la Server Action.
 */
export function isAvailabilityStartTime(time: IsoTime): boolean {
  if (!AVAILABILITY_START_OPTIONS.includes(time)) return false;
  return toMinutes(time) + AVAILABILITY_SLOT_MINUTES <= toMinutes(CLUB_CLOSE_TIME);
}

/** Etiqueta del bloque: «06:00 – 07:00». */
export function formatTimeRange(start: IsoTime, end: IsoTime): string {
  return `${start} – ${end}`;
}

/**
 * Rango de un bloque de disponibilidad derivado de `startTime`.
 * No se usa el `endTime` del backend porque el de pruebas lo devuelve fijo
 * en `11:00`; la regla documentada es de 60 minutos.
 */
export function formatAvailabilityRange(start: IsoTime): string {
  return formatTimeRange(start, addMinutes(start, AVAILABILITY_SLOT_MINUTES));
}
