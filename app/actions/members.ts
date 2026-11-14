"use server";

import { revalidatePath } from "next/cache";

import { hasAnyRole } from "@/lib/auth-guard";
import { createMember } from "@/lib/api/members";
import { describeApiError, logActionError } from "@/lib/actions/errors";
import type { FormState } from "@/lib/actions/form-state";

const FORBIDDEN = "Solo recepción/administración puede registrar miembros.";
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const MIN_PASSWORD_LENGTH = 6;

/**
 * Alta de miembro (`POST /api/users`).
 * El backend asigna el rol `MIEMBRO` y genera el número de carné; no exige sesión,
 * por eso la acción valida el rol antes de llamar.
 */
export async function createMemberAction(
  _prevState: FormState,
  formData: FormData
): Promise<FormState> {
  if (!(await hasAnyRole(["RECEPCION_ADMIN"]))) return { error: FORBIDDEN };

  const name = String(formData.get("name") ?? "").trim();
  const email = String(formData.get("email") ?? "").trim();
  const password = String(formData.get("password") ?? "");

  const fieldErrors: Record<string, string> = {};

  if (!name) fieldErrors.name = "El nombre es obligatorio.";
  else if (name.length > 80) fieldErrors.name = "Máximo 80 caracteres.";

  if (!email) fieldErrors.email = "El correo es obligatorio.";
  else if (!EMAIL_REGEX.test(email)) fieldErrors.email = "Ingresa un correo válido.";

  if (!password) fieldErrors.password = "La contraseña es obligatoria.";
  else if (password.length < MIN_PASSWORD_LENGTH)
    fieldErrors.password = `Debe tener al menos ${MIN_PASSWORD_LENGTH} caracteres.`;

  if (Object.keys(fieldErrors).length > 0) {
    return { error: "Revisa los campos marcados.", fieldErrors };
  }

  try {
    await createMember({ name, email, password });
  } catch (cause) {
    logActionError("POST /api/users", cause);
    return {
      error: describeApiError(cause, "No pudimos registrar al miembro."),
    };
  }

  revalidatePath("/admin/members");
  revalidatePath("/membership/purchase");
  return { success: true };
}
