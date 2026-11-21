// lib/payment-card.ts
// H10 · Validación de los datos de tarjeta. Son funciones puras para poder
// probarlas y para que el formulario y la Server Action usen las mismas reglas.

import { todayIso } from "@/lib/date-range";
import type { IsoDate } from "@/lib/types/common";

export const CARD_DIGITS = 16;
export const CVV_MIN = 3;
export const CVV_MAX = 4;
export const HOLDER_MIN = 3;
export const HOLDER_MAX = 100;

export function digitsOnly(value: string): string {
  return value.replace(/\D/g, "");
}

/** Deja solo dígitos y corta en 16, para el campo de número de tarjeta. */
export function formatCardNumberInput(value: string): string {
  return digitsOnly(value).slice(0, CARD_DIGITS);
}

/** Inserta la barra de `MM/YY` mientras se escribe. */
export function formatExpiryInput(value: string): string {
  const digits = digitsOnly(value).slice(0, 4);
  return digits.length <= 2 ? digits : `${digits.slice(0, 2)}/${digits.slice(2)}`;
}

export function last4Of(cardNumber: string): string | undefined {
  const digits = digitsOnly(cardNumber);
  return digits.length >= 4 ? digits.slice(-4) : undefined;
}

/** Devuelve el error del titular o `null` cuando es válido. */
export function validateHolder(value: string): string | null {
  const holder = value.trim();
  if (holder.length < HOLDER_MIN) {
    return `Escribe el nombre del titular (mínimo ${HOLDER_MIN} caracteres).`;
  }
  if (holder.length > HOLDER_MAX) {
    return `El nombre del titular admite hasta ${HOLDER_MAX} caracteres.`;
  }
  return null;
}

export function validateCardNumber(value: string): string | null {
  const digits = digitsOnly(value);
  if (!digits) return "Ingresa el número de la tarjeta.";
  if (digits.length !== CARD_DIGITS) {
    return `El número de la tarjeta debe tener ${CARD_DIGITS} dígitos.`;
  }
  return null;
}

export function validateCvv(value: string): string | null {
  const digits = digitsOnly(value);
  if (digits.length < CVV_MIN || digits.length > CVV_MAX) {
    return `El CVV debe tener entre ${CVV_MIN} y ${CVV_MAX} dígitos.`;
  }
  return null;
}

/** Convierte `MM/YY` en los números que espera `POST /api/payments/process`. */
export function parseExpiry(value: string): { month: number; year: number } | null {
  const match = /^(\d{2})\s*\/\s*(\d{2})$/.exec(value.trim());
  if (!match) return null;
  const month = Number(match[1]);
  if (month < 1 || month > 12) return null;
  return { month, year: 2000 + Number(match[2]) };
}

export function validateExpiry(value: string, today: IsoDate = todayIso()): string | null {
  if (!value.trim()) return "Ingresa el vencimiento en formato MM/YY.";
  const parsed = parseExpiry(value);
  if (!parsed) return "Usa el formato MM/YY.";

  const [yearText, monthText] = today.split("-");
  const currentYear = Number(yearText);
  const currentMonth = Number(monthText);

  if (
    parsed.year < currentYear ||
    (parsed.year === currentYear && parsed.month < currentMonth)
  ) {
    return "La tarjeta está vencida.";
  }
  return null;
}
