// lib/api/classes.ts
// H4 · Sesiones de clase y reserva de cupo.
// H6 · Creación, edición y cancelación de clases.

import { apiFetch } from "@/lib/api";
import { API_ROUTES } from "@/lib/api-routes";
import {
  asRecord,
  readArray,
  readIsoDate,
  readIsoTime,
  readNumber,
  readOptionalNumber,
  readOptionalString,
  readString,
} from "@/lib/api/normalize";
import { normalizeSessionTrainer } from "@/lib/api/trainers";
import type {
  CancelClassRequest,
  ClassSession,
  CreateClassRequest,
  ReserveClassSeatResponse,
  UpdateClassRequest,
} from "@/lib/types/classes";

export function normalizeClassSession(raw: unknown, context = "clase"): ClassSession {
  const record = asRecord(raw, context);
  const trainer = normalizeSessionTrainer(record, context);
  const maxCapacity = readNumber(record, context, [
    "maxCapacity",
    "capacity",
    "cupoMaximo",
  ]);

  // El backend expone `availableSpots`; si no viniera, se deriva de `reservedCount`.
  const availableSpots =
    readOptionalNumber(record, ["availableSpots", "cuposDisponibles"]) ??
    maxCapacity -
      readNumber(record, context, [
        "reservedCount",
        "activeReservations",
        "reservasActivas",
      ]);

  return {
    id: readString(record, context, ["id", "_id", "classSessionId", "classId"]),
    name: readString(record, context, ["name", "nombre", "title"]),
    trainerId: trainer.id,
    trainerName: trainer.name,
    date: readIsoDate(record, context, ["date", "fecha"]),
    startTime: readIsoTime(record, context, ["startTime", "horaInicio", "time"]),
    durationMinutes: readNumber(record, context, [
      "durationMinutes",
      "duration",
      "duracionMinutos",
    ]),
    maxCapacity,
    availableSpots,
    status: readString(record, context, ["status", "estado"]),
  };
}

export async function listClassSessions(): Promise<ClassSession[]> {
  const payload = await apiFetch<unknown>(API_ROUTES.classes.sessions);
  return readArray(payload, "clases").map((item, index) =>
    normalizeClassSession(item, `clases[${index}]`)
  );
}

export async function createClass(
  input: CreateClassRequest
): Promise<ClassSession | null> {
  const payload = await apiFetch<unknown>(API_ROUTES.classes.create, {
    method: "POST",
    body: JSON.stringify(input),
  });
  return payload === undefined ? null : normalizeClassSession(payload, "clase creada");
}

export async function updateClass(
  id: string,
  input: UpdateClassRequest
): Promise<ClassSession | null> {
  const payload = await apiFetch<unknown>(API_ROUTES.classes.update(id), {
    method: "PUT",
    body: JSON.stringify(input),
  });
  return payload === undefined
    ? null
    : normalizeClassSession(payload, "clase actualizada");
}

export async function cancelClass(id: string, input: CancelClassRequest): Promise<void> {
  await apiFetch<unknown>(API_ROUTES.classes.cancel(id), {
    method: "PATCH",
    body: JSON.stringify(input),
  });
}

/**
 * BE-4.1 documenta `{ reservationId, status }`. Se tolera una respuesta `201` sin
 * cuerpo (el estado de la UI se refresca desde el servidor).
 */
export async function reserveSeat(
  sessionId: string
): Promise<ReserveClassSeatResponse | null> {
  const payload = await apiFetch<unknown>(API_ROUTES.classes.reserve(sessionId), {
    method: "POST",
  });
  if (payload === undefined) return null;

  const record = asRecord(payload, "reserva");
  const status = readOptionalString(record, ["status", "estado"]);
  return {
    reservationId: readString(record, "reserva", ["reservationId", "id"]),
    status: status?.toLowerCase().includes("cancel") ? "Cancelada" : "Activa",
    message: readOptionalString(record, ["message", "mensaje"]),
  };
}
