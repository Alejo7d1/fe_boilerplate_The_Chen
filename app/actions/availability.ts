"use server";

import { revalidatePath } from "next/cache";

import { describeApiError, errorCode, logActionError } from "@/lib/actions/errors";
import type { ActionResult, FormState } from "@/lib/actions/form-state";
import { createAvailability, deleteAvailability } from "@/lib/api/trainers";
import { hasAnyRole } from "@/lib/auth-guard";
import { isBeforeToday } from "@/lib/date-range";
import { isAvailabilityStartTime } from "@/lib/schedule";
import type { CreateAvailabilityRequest } from "@/lib/types/trainers";

const FORBIDDEN = "Solo los entrenadores pueden administrar su disponibilidad.";

const DATE_REGEX = /^(\d{4})-(\d{2})-(\d{2})$/;

type ParsedBlock =
  | { input: CreateAvailabilityRequest; fieldErrors?: never }
  | { input?: never; fieldErrors: Record<string, string> };

function parseBlockForm(formData: FormData): ParsedBlock {
  const date = String(formData.get("date") ?? "").trim();
  const startTime = String(formData.get("startTime") ?? "").trim();

  const fieldErrors: Record<string, string> = {};

  if (!date) fieldErrors.date = "Selecciona la fecha del bloque.";
  else if (!DATE_REGEX.test(date)) fieldErrors.date = "Fecha inválida.";
  else if (isBeforeToday(date)) fieldErrors.date = "La fecha no puede ser anterior a hoy.";

  if (!startTime) fieldErrors.startTime = "Selecciona la hora de inicio.";
  else if (!isAvailabilityStartTime(startTime))
    fieldErrors.startTime = "Elige una hora entre 06:00 y 20:00.";

  if (Object.keys(fieldErrors).length > 0) return { fieldErrors };
  return { input: { date, startTime } };
}

/** H7 · Registra un bloque de 60 minutos en la fecha y hora indicadas. */
export async function createAvailabilityAction(
  _prevState: FormState,
  formData: FormData
): Promise<FormState> {
  if (!(await hasAnyRole(["ENTRENADOR"]))) return { error: FORBIDDEN };

  const parsed = parseBlockForm(formData);
  if (parsed.fieldErrors) {
    return { error: "Revisa los campos marcados.", fieldErrors: parsed.fieldErrors };
  }

  try {
    await createAvailability(parsed.input);
  } catch (cause) {
    logActionError("POST /api/trainer-availability", cause);
    return { error: describeApiError(cause, "No pudimos registrar el bloque.") };
  }

  revalidatePath("/trainer/availability");
  revalidatePath("/trainers/book");
  return { success: true };
}

/** H7 · Elimina un bloque propio. El backend valida propiedad y estado. */
export async function deleteAvailabilityAction(
  slotId: string
): Promise<ActionResult> {
  if (!(await hasAnyRole(["ENTRENADOR"]))) {
    return { ok: false, message: FORBIDDEN, code: "forbidden" };
  }
  if (!slotId) return { ok: false, message: "No se indicó el bloque a eliminar." };

  try {
    await deleteAvailability(slotId);
  } catch (cause) {
    logActionError("DELETE /api/trainer-availability/:id", cause);
    return {
      ok: false,
      message: describeApiError(cause, "No pudimos eliminar el bloque."),
      code: errorCode(cause),
    };
  }

  revalidatePath("/trainer/availability");
  revalidatePath("/trainers/book");
  return { ok: true };
}
