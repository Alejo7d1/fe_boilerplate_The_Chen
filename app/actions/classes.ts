"use server";

import { revalidatePath } from "next/cache";

import { hasAnyRole } from "@/lib/auth-guard";
import { cancelClass, createClass, reserveSeat, updateClass } from "@/lib/api/classes";
import {
  describeApiError,
  errorCode,
  logActionError,
} from "@/lib/actions/errors";
import type { ActionResult, FormState } from "@/lib/actions/form-state";
import type { CreateClassRequest } from "@/lib/types/classes";
import { isBeforeToday } from "@/lib/date-range";

const FORBIDDEN = "No tienes permisos para esta acción.";

const TIME_REGEX = /^([01]\d|2[0-3]):[0-5]\d$/;

/** H4 · Reserva un cupo en la sesión indicada. */
export async function reserveSeatAction(sessionId: string): Promise<ActionResult> {
  if (!(await hasAnyRole(["MIEMBRO"]))) {
    return {
      ok: false,
      message: "Solo los miembros pueden reservar cupos.",
      code: "forbidden",
    };
  }
  if (!sessionId) return { ok: false, message: "No se indicó la clase a reservar." };

  try {
    await reserveSeat(sessionId);
  } catch (cause) {
    logActionError("POST /api/class-sessions/:id/reserve", cause);
    return {
      ok: false,
      message: describeApiError(cause, "No pudimos reservar el cupo."),
      code: errorCode(cause),
    };
  }

  revalidatePath("/classes/book");
  revalidatePath("/my-reservations");
  return { ok: true };
}

function parseClassForm(
  formData: FormData
): { input: CreateClassRequest; fieldErrors?: never } | { input?: never; fieldErrors: Record<string, string> } {
  const name = String(formData.get("name") ?? "").trim();
  const trainerId = String(formData.get("trainerId") ?? "").trim();
  const date = String(formData.get("date") ?? "").trim();
  const startTime = String(formData.get("startTime") ?? "").trim();
  const durationRaw = String(formData.get("durationMinutes") ?? "").trim();
  const capacityRaw = String(formData.get("maxCapacity") ?? "").trim();

  const fieldErrors: Record<string, string> = {};

  if (!name) fieldErrors.name = "El nombre es obligatorio.";
  else if (name.length > 60) fieldErrors.name = "Máximo 60 caracteres.";

  if (!trainerId) fieldErrors.trainerId = "Selecciona un entrenador.";

  if (!date) fieldErrors.date = "Selecciona la fecha.";
  else if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) fieldErrors.date = "Fecha inválida.";
  else if (isBeforeToday(date)) fieldErrors.date = "La fecha no puede ser anterior a hoy.";

  if (!startTime) fieldErrors.startTime = "Selecciona la hora de inicio.";
  else if (!TIME_REGEX.test(startTime)) fieldErrors.startTime = "Hora inválida.";

  const durationMinutes = Number(durationRaw);
  if (!durationRaw) fieldErrors.durationMinutes = "Indica la duración.";
  else if (!Number.isInteger(durationMinutes) || durationMinutes < 15)
    fieldErrors.durationMinutes = "La duración mínima es de 15 minutos.";

  const maxCapacity = Number(capacityRaw);
  if (!capacityRaw) fieldErrors.maxCapacity = "Indica el cupo máximo.";
  else if (!Number.isInteger(maxCapacity) || maxCapacity < 1)
    fieldErrors.maxCapacity = "El cupo debe ser un entero mayor que 0.";

  if (Object.keys(fieldErrors).length > 0) return { fieldErrors };
  return {
    input: { name, trainerId, date, startTime, durationMinutes, maxCapacity },
  };
}

/** H6 · Crea o edita una clase. El `id` viaja en un campo oculto (edición por `PUT`). */
export async function saveClassAction(
  _prevState: FormState,
  formData: FormData
): Promise<FormState> {
  if (!(await hasAnyRole(["RECEPCION_ADMIN"]))) return { error: FORBIDDEN };

  const id = String(formData.get("id") ?? "").trim();
  const parsed = parseClassForm(formData);
  if (parsed.fieldErrors) {
    return { error: "Revisa los campos marcados.", fieldErrors: parsed.fieldErrors };
  }

  try {
    if (id) {
      await updateClass(id, parsed.input);
    } else {
      await createClass(parsed.input);
    }
  } catch (cause) {
    logActionError("classes.save", cause);
    return {
      error: describeApiError(cause, "No pudimos guardar la clase."),
    };
  }

  revalidatePath("/admin/classes");
  revalidatePath("/classes/book");
  return { success: true };
}

/** H6 · Cancela una clase registrando el motivo. */
export async function cancelClassAction(
  id: string,
  reason: string
): Promise<ActionResult> {
  if (!(await hasAnyRole(["RECEPCION_ADMIN"]))) {
    return { ok: false, message: FORBIDDEN, code: "forbidden" };
  }

  const trimmed = reason.trim();
  if (!id) return { ok: false, message: "No se indicó la clase a cancelar." };
  if (!trimmed) {
    return { ok: false, message: "Indica el motivo de la cancelación." };
  }

  try {
    await cancelClass(id, { reason: trimmed });
  } catch (cause) {
    logActionError("PATCH /api/classes/:id/cancel", cause);
    return {
      ok: false,
      message: describeApiError(cause, "No pudimos cancelar la clase."),
      code: errorCode(cause),
    };
  }

  revalidatePath("/admin/classes");
  revalidatePath("/classes/book");
  revalidatePath("/my-reservations");
  return { ok: true };
}
