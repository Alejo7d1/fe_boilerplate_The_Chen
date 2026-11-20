// lib/api/trainers.ts
// Entrenadores. H6 los necesita para el formulario de clases; H7 los usa para
// la disponibilidad y H8 para el agendamiento de sesión personal.

import { apiFetch } from "@/lib/api";
import { API_ROUTES } from "@/lib/api-routes";
import {
  asRecord,
  readArray,
  readIsoDate,
  readIsoTime,
  readOptionalBoolean,
  readOptionalIsoTime,
  readString,
} from "@/lib/api/normalize";
import type {
  BookPersonalSessionRequest,
  CreateAvailabilityRequest,
  TrainerAvailabilitySlot,
  TrainerSummary,
} from "@/lib/types/trainers";

/** Acepta el entrenador anidado (`trainer`) o aplanado en la sesión de clase. */
export function normalizeTrainer(raw: unknown, context = "entrenador"): TrainerSummary {
  const outer = asRecord(raw, context);
  const nested = outer.trainer ?? outer.entrenador;
  const record = nested ? asRecord(nested, `${context}.trainer`) : outer;

  return {
    id: readString(record, context, ["id", "_id", "trainerId", "userId"]),
    name: readString(record, context, ["name", "nombre", "fullName", "nombreCompleto"]),
  };
}

/** Lee el entrenador de una sesión de clase (anidado o por columnas planas). */
export function normalizeSessionTrainer(
  session: Record<string, unknown>,
  context: string
): TrainerSummary {
  const nested = session.trainer ?? session.entrenador;
  if (nested && typeof nested === "object") {
    return normalizeTrainer(nested, `${context}.trainer`);
  }
  return {
    id: readString(session, context, ["trainerId", "trainer_id", "entrenadorId"]),
    name: readString(session, context, [
      "trainerName",
      "nombreEntrenador",
      "trainerFullName",
    ]),
  };
}

export async function listTrainers(): Promise<TrainerSummary[]> {
  const payload = await apiFetch<unknown>(API_ROUTES.trainers.list);
  return readArray(payload, "entrenadores").map((item, index) =>
    normalizeTrainer(item, `entrenadores[${index}]`)
  );
}

/**
 * H7 · Bloque de disponibilidad. El contrato no está confirmado, por lo que se
 * aceptan los nombres de campo habituales del backend. Si falta `slotId`,
 * `date` o `startTime` se lanza `ContractError`; `isBooked` es opcional y se
 * representa como `null` («no informado»), nunca como bloque libre.
 */
export function normalizeAvailabilitySlot(
  raw: unknown,
  context = "bloque"
): TrainerAvailabilitySlot {
  const record = asRecord(raw, context);

  return {
    slotId: readString(record, context, [
      "slotId",
      "id",
      "_id",
      "availabilityId",
      "blockId",
    ]),
    date: readIsoDate(record, context, ["date", "fecha", "day"]),
    startTime: readIsoTime(record, context, [
      "startTime",
      "horaInicio",
      "start",
      "from",
    ]),
    // `endTime` no es fiable en el backend de pruebas (siempre devuelve 11:00):
    // la UI pinta el rango con la regla documentada de 60 minutos.
    endTime:
      readOptionalIsoTime(record, ["endTime", "horaFin", "end", "to"]) ?? null,
    isBooked:
      readOptionalBoolean(record, ["isBooked", "booked", "reservado", "isReserved"]) ??
      null,
  };
}

/** H7/H8 · `GET /api/trainers/:id/availability`. */
export async function listTrainerAvailability(
  trainerId: string
): Promise<TrainerAvailabilitySlot[]> {
  const payload = await apiFetch<unknown>(API_ROUTES.trainers.availability(trainerId));
  return readArray(payload, "disponibilidad").map((item, index) =>
    normalizeAvailabilitySlot(item, `disponibilidad[${index}]`)
  );
}

/**
 * H7 · `POST /api/trainer-availability` con `{ date, startTime }`; el backend
 * calcula el fin del bloque.
 *
 * TODO(contract): no se leen campos de la respuesta. La pantalla se refresca
 * desde el servidor, igual que en la compra de membresía.
 */
export async function createAvailability(
  input: CreateAvailabilityRequest
): Promise<void> {
  await apiFetch<unknown>(API_ROUTES.trainers.createAvailability, {
    method: "POST",
    body: JSON.stringify({
      date: input.date,
      startTime: input.startTime,
    } satisfies CreateAvailabilityRequest),
  });
}

/**
 * H7 · `DELETE /api/trainer-availability/:id` (subtarea `BE-7.3`). El backend
 * responde `204`; respuestas con cuerpo también se ignoran.
 */
export async function deleteAvailability(slotId: string): Promise<void> {
  await apiFetch<unknown>(API_ROUTES.trainers.removeAvailability(slotId), {
    method: "DELETE",
  });
}

/**
 * H8 · `POST /api/personal-sessions`.
 *
 * TODO(contract): no se leen campos de la respuesta; la cuadrícula se refresca
 * desde el servidor y los errores `403`/`409` se muestran tal cual llegan.
 */
export async function bookPersonalSession(
  input: BookPersonalSessionRequest
): Promise<void> {
  await apiFetch<unknown>(API_ROUTES.trainers.bookPersonalSession, {
    method: "POST",
    body: JSON.stringify({
      trainerId: input.trainerId,
      slotId: input.slotId,
    } satisfies BookPersonalSessionRequest),
  });
}
