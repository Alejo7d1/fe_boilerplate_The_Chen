// lib/api/training.ts
// H12 · Asignación de rutinas.
// H13 · Registro y consulta del progreso físico.
// Único lugar donde se conoce el contrato de /api/routines y /api/progress.

import { apiFetch } from "@/lib/api";
import { API_ROUTES } from "@/lib/api-routes";
import {
  asRecord,
  readArray,
  readIsoDate,
  readNumber,
  readOptionalString,
  readString,
} from "@/lib/api/normalize";
import type {
  AssignRoutineRequest,
  ProgressEntry,
  RecordProgressRequest,
  Routine,
} from "@/lib/types/training";

export function normalizeRoutine(raw: unknown, context = "rutina"): Routine {
  const record = asRecord(raw, context);
  return {
    id: readString(record, context, ["routineId", "id", "_id"]),
    memberId: readString(record, context, ["memberId", "member_id", "userId"]),
    updatedAt: readOptionalString(record, ["updatedAt", "updated_at"]),
  };
}

/** El backend solo confirma el alta; el resto se toma de lo enviado. */
export function normalizeCreatedProgress(
  raw: unknown,
  input: RecordProgressRequest
): ProgressEntry {
  const record = asRecord(raw, "progreso");
  return {
    id: readString(record, "progreso", ["progressId", "id", "_id"]),
    memberId: readOptionalString(record, ["memberId", "member_id", "userId"]),
    date: readIsoDate({ date: input.date, ...record }, "progreso", ["date", "fecha"]),
    weight: input.weight,
    waist: input.waist,
    chest: input.chest,
    strengthMarks: input.strengthMarks ?? [],
  };
}

/**
 * Historial (no existe todavía en el backend de pruebas: responde `404`).
 * La pantalla trata ese caso como «sin historial», no como error de contrato.
 */
export function normalizeProgressEntry(raw: unknown, context = "progreso"): ProgressEntry {
  const record = asRecord(raw, context);
  const marks = Array.isArray(record.strengthMarks)
    ? record.strengthMarks.filter((mark): mark is string => typeof mark === "string")
    : [];

  return {
    id: readString(record, context, ["progressId", "id", "_id"]),
    memberId: readOptionalString(record, ["memberId", "member_id", "userId"]),
    date: readIsoDate(record, context, ["date", "fecha"]),
    weight: readNumber(record, context, ["weight", "peso"]),
    waist: readNumber(record, context, ["waist", "cintura"]),
    chest: readNumber(record, context, ["chest", "pecho"]),
    strengthMarks: marks,
  };
}

/** `POST /api/routines` con `{ memberId, exercises }`. */
export async function assignRoutine(input: AssignRoutineRequest): Promise<Routine> {
  const payload = await apiFetch<unknown>(API_ROUTES.training.assignRoutine, {
    method: "POST",
    body: JSON.stringify(input),
  });
  return normalizeRoutine(payload);
}

/** `POST /api/progress` con `{ date, weight, waist, chest, strengthMarks? }`. */
export async function recordProgress(
  input: RecordProgressRequest
): Promise<ProgressEntry> {
  const payload = await apiFetch<unknown>(API_ROUTES.training.recordProgress, {
    method: "POST",
    body: JSON.stringify(input),
  });
  return normalizeCreatedProgress(payload, input);
}

/**
 * `GET /api/progress`. Hoy responde `404` («Endpoint no encontrado»); se
 * mantiene el adaptador listo para cuando el backend lo publique.
 */
export async function listProgressHistory(): Promise<ProgressEntry[]> {
  const payload = await apiFetch<unknown>(API_ROUTES.training.recordProgress);
  return readArray(payload, "progreso").map((item, index) =>
    normalizeProgressEntry(item, `progreso[${index}]`)
  );
}
