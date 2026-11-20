// lib/date-range.ts
// Utilidades de fecha para las ventanas de 7 y 14 días.
// Todas operan sobre `YYYY-MM-DD` y aritmética en UTC para no desplazar días por DST.

import type { IsoDate } from "@/lib/types/common";

const DAY_MS = 86_400_000;

export function todayIso(): IsoDate {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export function isoToDate(iso: IsoDate): Date {
  return new Date(`${iso}T00:00:00.000Z`);
}

/** Fecha local para componentes que trabajan con el calendario del navegador. */
export function isoToLocalDate(iso: IsoDate): Date {
  const [year, month, day] = iso.split("-").map(Number);
  return new Date(year, month - 1, day);
}

export function dateToIso(date: Date): IsoDate {
  return new Date(
    Date.UTC(date.getFullYear(), date.getMonth(), date.getDate())
  )
    .toISOString()
    .slice(0, 10);
}

export function addDays(iso: IsoDate, days: number): IsoDate {
  return new Date(isoToDate(iso).getTime() + days * DAY_MS).toISOString().slice(0, 10);
}

export function nextDays(count: number, from: IsoDate = todayIso()): IsoDate[] {
  return Array.from({ length: count }, (_, index) => addDays(from, index));
}

export function isBeforeToday(iso: IsoDate): boolean {
  return iso < todayIso();
}

export function groupByDate<T extends { date: IsoDate }>(items: T[]): Map<IsoDate, T[]> {
  const grouped = new Map<IsoDate, T[]>();
  for (const item of items) {
    const bucket = grouped.get(item.date);
    if (bucket) {
      bucket.push(item);
    } else {
      grouped.set(item.date, [item]);
    }
  }
  return grouped;
}
