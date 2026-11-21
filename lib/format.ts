// lib/format.ts
// Formato de presentación. Cambiar idioma o moneda del club es editar estas dos constantes.

import { isoToDate, todayIso } from "@/lib/date-range";
import type { IsoDate, IsoTime } from "@/lib/types/common";

export const LOCALE = "es-GT";
export const CURRENCY = "GTQ";

const currencyFormatter = new Intl.NumberFormat(LOCALE, {
  style: "currency",
  currency: CURRENCY,
});

const dateFormatter = new Intl.DateTimeFormat(LOCALE, {
  day: "2-digit",
  month: "short",
  year: "numeric",
  timeZone: "UTC",
});

const longDateFormatter = new Intl.DateTimeFormat(LOCALE, {
  weekday: "long",
  day: "numeric",
  month: "long",
  timeZone: "UTC",
});

const weekdayFormatter = new Intl.DateTimeFormat(LOCALE, {
  weekday: "short",
  timeZone: "UTC",
});

const monthFormatter = new Intl.DateTimeFormat(LOCALE, {
  month: "short",
  timeZone: "UTC",
});

export function formatCurrency(value: number): string {
  return currencyFormatter.format(value);
}

export function formatDate(iso: IsoDate): string {
  return dateFormatter.format(isoToDate(iso));
}

export function formatLongDate(iso: IsoDate): string {
  return longDateFormatter.format(isoToDate(iso));
}

/** Etiqueta corta del día: «jue». */
export function formatWeekdayShort(iso: IsoDate): string {
  return weekdayFormatter.format(isoToDate(iso)).replace(/\.$/, "");
}

export function formatDayNumber(iso: IsoDate): string {
  return iso.slice(8, 10);
}

/** Etiqueta corta del mes: «nov». */
export function formatMonthShort(iso: IsoDate): string {
  return monthFormatter.format(isoToDate(iso)).replace(/\.$/, "");
}

export function formatTime(time: IsoTime): string {
  return time;
}

export function formatDuration(minutes: number): string {
  return `${minutes} min`;
}

export function formatClassesRemaining(remaining: number | null): string {
  return remaining === null ? "Ilimitadas" : String(remaining);
}

/** «viernes, 13 de noviembre» → «Viernes, 13 de noviembre». */
export function capitalizeSentence(value: string): string {
  return value.charAt(0).toUpperCase() + value.slice(1);
}

/**
 * Nombre corto derivado del correo de sesión: `ana.lopez@…` → «Ana Lopez».
 * Devuelve `null` cuando el correo no permite derivar nada legible.
 */
export function nameFromEmail(email?: string): string | null {
  const localPart = email?.split("@")[0];
  const words = localPart?.split(/[._-]+/).filter(Boolean) ?? [];
  if (words.length === 0) return null;
  return words
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}

export function daysUntil(iso: IsoDate): number {
  const target = isoToDate(iso).getTime();
  const today = isoToDate(todayIso()).getTime();
  return Math.round((target - today) / 86_400_000);
}

/** Texto de vencimiento: «Vencida hace 3 días», «Vence hoy», «Vence en 12 días». */
export function describeExpiry(iso: IsoDate): string {
  const days = daysUntil(iso);
  if (days === 0) return "Vence hoy";
  if (days === 1) return "Vence mañana";
  if (days > 1) return `Vence en ${days} días`;
  if (days === -1) return "Venció ayer";
  return `Venció hace ${Math.abs(days)} días`;
}
