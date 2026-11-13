// lib/api/normalize.ts
// Adaptadores de contrato: toleran nombres de campo alternativos (camelCase,
// snake_case, español) que el backend puede devolver, pero NUNCA inventan un
// valor. Si un campo obligatorio no viene, se lanza `ContractError` para que la
// pantalla muestre un error en lugar de un dato falso.

import type { IsoDate, IsoTime } from "@/lib/types/common";

export class ContractError extends Error {
  constructor(
    public readonly field: string,
    detail: string
  ) {
    super(detail);
    this.name = "ContractError";
  }
}

type Recordish = Record<string, unknown>;

const DATE_PREFIX = /^(\d{4})-(\d{2})-(\d{2})/;
const TIME_PREFIX = /^(\d{1,2}):(\d{2})/;

export function asRecord(value: unknown, context: string): Recordish {
  if (value && typeof value === "object" && !Array.isArray(value)) {
    return value as Recordish;
  }
  throw new ContractError(context, `La respuesta de ${context} no es un objeto.`);
}

function pick(source: Recordish, keys: readonly string[]): unknown {
  for (const key of keys) {
    const value = source[key];
    if (value !== undefined && value !== null && value !== "") return value;
  }
  return undefined;
}

/** Devuelve el primer campo presente aunque su valor sea `null` o `""`. */
function rawPick(source: Recordish, keys: readonly string[]): unknown {
  for (const key of keys) {
    if (Object.prototype.hasOwnProperty.call(source, key)) return source[key];
  }
  return undefined;
}

function missing(context: string, keys: readonly string[]): ContractError {
  return new ContractError(
    `${context}.${keys[0]}`,
    `La respuesta de ${context} no incluye el campo "${keys.join(" / ")}".`
  );
}

export function readString(
  source: Recordish,
  context: string,
  keys: readonly string[]
): string {
  const value = pick(source, keys);
  if (typeof value === "string" && value.trim()) return value.trim();
  if (typeof value === "number") return String(value);
  throw missing(context, keys);
}

export function readOptionalString(
  source: Recordish,
  keys: readonly string[]
): string | undefined {
  const value = pick(source, keys);
  if (typeof value === "string" && value.trim()) return value.trim();
  if (typeof value === "number") return String(value);
  return undefined;
}

export function readNumber(
  source: Recordish,
  context: string,
  keys: readonly string[]
): number {
  const value = pick(source, keys);
  const parsed =
    typeof value === "number" ? value : typeof value === "string" ? Number(value) : NaN;
  const result = Number.isFinite(parsed) ? parsed : typeof value === "string" ? parseFloat(value) : NaN;
  if (!Number.isFinite(result)) throw missing(context, keys);
  return result;
}

export function readNullableNumber(
  source: Recordish,
  context: string,
  keys: readonly string[]
): number | null {
  const value = rawPick(source, keys);

  // `null` explícito o un texto que declara el plan como ilimitado.
  if (value === null) return null;
  if (typeof value === "string") {
    if (!value.trim()) throw missing(context, keys);
    if (/ilimitad|unlimited/i.test(value)) return null;
  }
  // Campo ausente: se reporta como hueco de contrato, no como «ilimitado».
  if (value === undefined) throw missing(context, keys);

  return readNumber(source, context, keys);
}

/** Número opcional: `undefined` cuando el campo no viene, sin lanzar error. */
export function readOptionalNumber(
  source: Recordish,
  keys: readonly string[]
): number | undefined {
  const value = rawPick(source, keys);
  if (value === undefined || value === null || value === "") return undefined;
  const parsed = typeof value === "number" ? value : Number(value);
  return Number.isFinite(parsed) ? parsed : undefined;
}

export function readBoolean(
  source: Recordish,
  context: string,
  keys: readonly string[]
): boolean {
  const value = pick(source, keys);
  if (typeof value === "boolean") return value;
  if (typeof value === "string") {
    if (/^(true|1|si|sí)$/i.test(value)) return true;
    if (/^(false|0|no)$/i.test(value)) return false;
  }
  throw missing(context, keys);
}

/** Acepta `YYYY-MM-DD` o un ISO con hora y devuelve solo la fecha. */
export function readIsoDate(
  source: Recordish,
  context: string,
  keys: readonly string[]
): IsoDate {
  const value = pick(source, keys);
  if (typeof value === "string") {
    const match = DATE_PREFIX.exec(value);
    if (match) return `${match[1]}-${match[2]}-${match[3]}`;
  }
  throw missing(context, keys);
}

export function readOptionalIsoDate(
  source: Recordish,
  keys: readonly string[]
): IsoDate | undefined {
  const value = pick(source, keys);
  if (typeof value !== "string") return undefined;
  const match = DATE_PREFIX.exec(value);
  return match ? `${match[1]}-${match[2]}-${match[3]}` : undefined;
}

/** Acepta `HH:mm`, `H:mm` o `HH:mm:ss` y devuelve `HH:mm`. */
export function readIsoTime(
  source: Recordish,
  context: string,
  keys: readonly string[]
): IsoTime {
  const value = pick(source, keys);
  if (typeof value === "string") {
    const match = TIME_PREFIX.exec(value);
    if (match) return `${match[1].padStart(2, "0")}:${match[2]}`;
  }
  throw missing(context, keys);
}

/**
 * Listados: acepta un array directo o un envoltorio habitual
 * (`items`, `data`, `results`, `content`, `records`).
 */
export function readArray(payload: unknown, context: string): unknown[] {
  if (Array.isArray(payload)) return payload;
  if (payload && typeof payload === "object") {
    for (const key of ["items", "data", "results", "content", "records", "list"]) {
      const value = (payload as Recordish)[key];
      if (Array.isArray(value)) return value;
    }
  }
  if (payload === undefined || payload === null) return [];
  throw new ContractError(context, `La respuesta de ${context} no es una lista.`);
}
