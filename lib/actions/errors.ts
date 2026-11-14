// lib/actions/errors.ts
// Traducción uniforme de fallos de API/contrato a mensajes de UI.

import { ApiError } from "@/lib/api";
import { ContractError } from "@/lib/api/normalize";

const CONTRACT_MESSAGE =
  "El backend devolvió un formato inesperado. Revisa la consola para el detalle del contrato.";

/** Texto sintético de `ApiError` cuando el backend responde sin cuerpo. */
const GENERIC_HTTP_MESSAGE = /^Error HTTP \d{3}$/;

/** Mensaje por estado cuando el backend no envía uno propio. */
function statusFallback(status: number): string | null {
  if (status === 403) {
    return "No tienes permiso para esta acción o tu membresía no está vigente.";
  }
  if (status === 404) return "El recurso ya no está disponible.";
  if (status === 409) {
    return "La operación entra en conflicto con el estado actual. Actualiza e inténtalo de nuevo.";
  }
  if (status === 400) return "Los datos enviados no son válidos.";
  return null;
}

export function logActionError(scope: string, error: unknown): void {
  console.error(`[${scope}]`, error);
}

/**
 * Mantiene el mensaje del backend cuando existe (regla de docs/testing-strategy.md)
 * y solo usa el texto genérico como último recurso. Cuando la respuesta no trae
 * cuerpo, `ApiError` sintetiza «Error HTTP 409»; en ese caso se usa una copy por
 * estado para no mostrar códigos crudos al usuario.
 */
export function describeApiError(error: unknown, fallback: string): string {
  if (error instanceof ApiError) {
    if (error.status === 401) return "Tu sesión expiró. Vuelve a iniciar sesión.";
    const message = error.message?.trim();
    if (message && !GENERIC_HTTP_MESSAGE.test(message)) return message;
    return statusFallback(error.status) ?? fallback;
  }
  if (error instanceof ContractError) return CONTRACT_MESSAGE;
  return fallback;
}

/** Mensaje específico para conflictos de cupo/horario que conviene refrescar en pantalla. */
export function isConflict(error: unknown): boolean {
  return error instanceof ApiError && error.status === 409;
}

export function isNotFound(error: unknown): boolean {
  return error instanceof ApiError && error.status === 404;
}

export function isForbidden(error: unknown): boolean {
  return error instanceof ApiError && error.status === 403;
}

/** Clasificación del fallo para que la UI decida si ofrece una acción adicional. */
export function errorCode(
  error: unknown
): "forbidden" | "conflict" | "not-found" | undefined {
  if (isForbidden(error)) return "forbidden";
  if (isConflict(error)) return "conflict";
  if (isNotFound(error)) return "not-found";
  return undefined;
}
