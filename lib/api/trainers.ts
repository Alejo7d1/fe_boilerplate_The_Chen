// lib/api/trainers.ts
// Entrenadores. H6 los necesita para el formulario de clases; H7/H8 los usan después.

import { apiFetch } from "@/lib/api";
import { API_ROUTES } from "@/lib/api-routes";
import { asRecord, readArray, readString } from "@/lib/api/normalize";
import type { TrainerSummary } from "@/lib/types/trainers";

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
