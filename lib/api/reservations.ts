// lib/api/reservations.ts
// H5 · Reservas del miembro autenticado y su cancelación.

import { apiFetch } from "@/lib/api";
import { API_ROUTES } from "@/lib/api-routes";
import {
  asRecord,
  readArray,
  readIsoDate,
  readIsoTime,
  readOptionalIsoDate,
  readString,
} from "@/lib/api/normalize";
import type { ClassReservation, ReservationStatus } from "@/lib/types/classes";

function normalizeReservationStatus(value: string, context: string): ReservationStatus {
  const normalized = value.trim().toLowerCase();
  if (normalized.includes("cancel")) return "Cancelada";
  if (normalized.includes("activ")) return "Activa";
  throw new Error(
    `El estado de ${context} ("${value}") no está contemplado por el contrato: anota el valor en docs/api-contracts.md.`
  );
}

export function normalizeReservation(raw: unknown, context = "reserva"): ClassReservation {
  const record = asRecord(raw, context);

  return {
    id: readString(record, context, ["id", "reservationId"]),
    classId: readString(record, context, ["classId", "classSessionId"]),
    name: readString(record, context, ["name", "className", "nombre"]),
    date: readIsoDate(record, context, ["date", "fecha"]),
    startTime: readIsoTime(record, context, ["startTime", "horaInicio"]),
    status: normalizeReservationStatus(
      readString(record, context, ["status", "estado"]),
      context
    ),
    cancelledAt: readOptionalIsoDate(record, ["cancelledAt", "fechaCancelacion"]),
  };
}

export async function listMyReservations(): Promise<ClassReservation[]> {
  const payload = await apiFetch<unknown>(API_ROUTES.reservations.me);
  return readArray(payload, "reservas").map((item, index) =>
    normalizeReservation(item, `reservas[${index}]`)
  );
}

/** TODO(contract): el cuerpo y la respuesta de la cancelación no están documentados. */
export async function cancelReservation(id: string): Promise<void> {
  await apiFetch<unknown>(API_ROUTES.reservations.cancel(id), { method: "DELETE" });
}
