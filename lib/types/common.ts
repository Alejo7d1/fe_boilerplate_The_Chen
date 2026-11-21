// lib/types/common.ts
// Tipos compartidos por todos los modulos de dominio.

export type EntityId = string;

/** Fecha en formato ISO `YYYY-MM-DD`. */
export type IsoDate = string;

/** Hora en formato `HH:mm` de 24 horas. */
export type IsoTime = string;

/** Cuerpo de error que `apiFetch` usa para construir un `ApiError`. */
export interface ApiErrorBody {
  message?: string;
  error?: string;
  statusCode?: number;
}
