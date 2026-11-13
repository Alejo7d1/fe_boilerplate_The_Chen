"use server";

import { revalidatePath } from "next/cache";

import { hasAnyRole } from "@/lib/auth-guard";
import { createPlan, setPlanStatus, updatePlan } from "@/lib/api/plans";
import { describeApiError, logActionError } from "@/lib/actions/errors";
import type { ActionResult, FormState } from "@/lib/actions/form-state";
import type { CreatePlanRequest } from "@/lib/types/plans";

const FORBIDDEN = "Solo recepción/administración puede gestionar los planes.";

function parsePlanForm(
  formData: FormData
): { input: CreatePlanRequest; fieldErrors?: never } | { input?: never; fieldErrors: Record<string, string> } {
  const name = String(formData.get("name") ?? "").trim();
  const priceRaw = String(formData.get("price") ?? "").trim();
  const durationRaw = String(formData.get("durationDays") ?? "").trim();
  const unlimited = formData.get("unlimited") === "on";
  const classesRaw = String(formData.get("classesIncluded") ?? "").trim();

  const fieldErrors: Record<string, string> = {};

  if (!name) fieldErrors.name = "El nombre es obligatorio.";
  else if (name.length > 60) fieldErrors.name = "Máximo 60 caracteres.";

  const price = Number(priceRaw.replace(",", "."));
  if (!priceRaw) fieldErrors.price = "El precio es obligatorio.";
  else if (!Number.isFinite(price) || price <= 0)
    fieldErrors.price = "Ingresa un precio mayor que 0.";

  const durationDays = Number(durationRaw);
  if (!durationRaw) fieldErrors.durationDays = "La duración es obligatoria.";
  else if (!Number.isInteger(durationDays) || durationDays <= 0)
    fieldErrors.durationDays = "La duración debe ser un número entero de días mayor que 0.";

  let classesIncluded: number | null = null;
  if (!unlimited) {
    const classes = Number(classesRaw);
    if (!classesRaw)
      fieldErrors.classesIncluded = "Indica las clases incluidas o marca «Ilimitadas».";
    else if (!Number.isInteger(classes) || classes <= 0)
      fieldErrors.classesIncluded = "Debe ser un número entero mayor que 0.";
    else classesIncluded = classes;
  }

  if (Object.keys(fieldErrors).length > 0) return { fieldErrors };
  return { input: { name, price, durationDays, classesIncluded } };
}

/** Crear o editar un plan. El `id` viaja en un campo oculto: el endpoint de edición es `PUT`. */
export async function savePlanAction(
  _prevState: FormState,
  formData: FormData
): Promise<FormState> {
  if (!(await hasAnyRole(["RECEPCION_ADMIN"]))) return { error: FORBIDDEN };

  const id = String(formData.get("id") ?? "").trim();
  const parsed = parsePlanForm(formData);
  if (parsed.fieldErrors) {
    return { error: "Revisa los campos marcados.", fieldErrors: parsed.fieldErrors };
  }

  try {
    if (id) {
      await updatePlan(id, parsed.input);
    } else {
      await createPlan(parsed.input);
    }
  } catch (cause) {
    logActionError("plans.save", cause);
    return { error: describeApiError(cause, "No pudimos guardar el plan.") };
  }

  revalidatePath("/admin/plans");
  return { success: true };
}

/**
 * Activa o desactiva un plan.
 * `PATCH /api/plans/:id/status` recibe `{ active: boolean }`.
 */
export async function setPlanStatusAction(
  id: string,
  active: boolean
): Promise<ActionResult> {
  if (!(await hasAnyRole(["RECEPCION_ADMIN"]))) {
    return { ok: false, message: FORBIDDEN };
  }
  if (!id || typeof active !== "boolean") {
    return { ok: false, message: "No se indicó el plan o el estado destino." };
  }

  try {
    await setPlanStatus(id, active);
  } catch (cause) {
    logActionError("plans.status", cause);
    return {
      ok: false,
      message: describeApiError(cause, "No pudimos cambiar el estado del plan."),
    };
  }

  revalidatePath("/admin/plans");
  return { ok: true };
}
