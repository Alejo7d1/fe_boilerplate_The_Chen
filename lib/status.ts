// lib/status.ts
// Traducción de estados del backend a tonos visuales.
// Si el valor no está contemplado se devuelve `null`/`"outline"`: nunca se
// asume un estado por defecto.

export type BadgeTone = "default" | "secondary" | "destructive" | "outline";

const ACTIVE_HINTS = ["activ", "vigente", "habilitad", "enabled", "current"];
const INACTIVE_HINTS = ["inactiv", "vencid", "expirad", "cancelad", "suspendid", "disabled"];

function normalize(value: string): string {
  return value.trim().toLowerCase();
}

function matches(value: string, hints: string[]): boolean {
  return hints.some((hint) => value.includes(hint));
}

/** `true`/`false` cuando el estado se reconoce; `null` cuando es desconocido. */
export function isMembershipActive(status: string): boolean | null {
  const value = normalize(status);
  if (matches(value, ACTIVE_HINTS)) return true;
  if (matches(value, INACTIVE_HINTS)) return false;
  return null;
}

export function membershipTone(status: string): BadgeTone {
  const active = isMembershipActive(status);
  if (active === true) return "default";
  if (active === false) return "destructive";
  return "outline";
}

/** El backend expone `active: boolean` en los planes. */
export function planLabel(active: boolean): string {
  return active ? "Activo" : "Inactivo";
}

export function planTone(active: boolean): BadgeTone {
  return active ? "default" : "secondary";
}

export function reservationTone(status: string): BadgeTone {
  return normalize(status).includes("cancel") ? "secondary" : "default";
}

/** Estados de una sesión de clase: `Programada`, `Cancelada`, `Finalizada`. */
export function classTone(status: string): BadgeTone {
  const value = normalize(status);
  if (value.includes("cancel")) return "destructive";
  if (value.includes("finaliz")) return "secondary";
  return "default";
}

/**
 * Estado de un bloque de disponibilidad. `null` significa que el backend no
 * informó el dato: se muestra «—» y no se asume que esté libre.
 */
export function availabilityLabel(isBooked: boolean | null): string {
  if (isBooked === true) return "Reservado";
  if (isBooked === false) return "Libre";
  return "—";
}

export function availabilityTone(isBooked: boolean | null): BadgeTone {
  if (isBooked === true) return "secondary";
  if (isBooked === false) return "default";
  return "outline";
}
