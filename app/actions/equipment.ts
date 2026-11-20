"use server";

import { revalidatePath } from "next/cache";

import { describeApiError, logActionError } from "@/lib/actions/errors";
import type { ActionResult } from "@/lib/actions/form-state";
import { listEquipment, updateEquipmentStatus } from "@/lib/api/equipment";
import { hasAnyRole } from "@/lib/auth-guard";
import {
  isEquipmentStatus,
  type Equipment,
  type EquipmentStatus,
} from "@/lib/types/equipment";

const FORBIDDEN = "Solo recepción/administración puede cambiar el estado de las máquinas.";
const MIN_REASON = 5;
const MAX_REASON = 200;

/**
 * H15 · Listado para la vista de consulta. Se usa desde el cliente para
 * refrescar el inventario sin recargar la página.
 */
export async function listEquipmentAction(
  status?: string
): Promise<
  { ok: true; equipment: Equipment[] } | { ok: false; message: string; code?: "forbidden" }
> {
  if (!(await hasAnyRole(["MIEMBRO", "ENTRENADOR", "RECEPCION_ADMIN"]))) {
    return { ok: false, message: "Inicia sesión para consultar las máquinas.", code: "forbidden" };
  }
  if (status && !isEquipmentStatus(status)) {
    return { ok: false, message: "Selecciona un estado válido." };
  }
  const filter = status as EquipmentStatus | undefined;

  try {
    return { ok: true, equipment: await listEquipment(filter) };
  } catch (cause) {
    logActionError("equipment.list", cause);
    return {
      ok: false,
      message: describeApiError(cause, "No pudimos actualizar el estado de las máquinas."),
    };
  }
}

/**
 * H14 · Cambia el estado de una máquina.
 * `PATCH /api/equipment/:id/status` exige motivo cuando el estado no es `Operativa`
 * y lo limpia al volver a `Operativa`.
 */
export async function updateEquipmentStatusAction(
  id: string,
  status: string,
  reason: string
): Promise<ActionResult> {
  if (!(await hasAnyRole(["RECEPCION_ADMIN"]))) {
    return { ok: false, message: FORBIDDEN, code: "forbidden" };
  }
  if (!id) return { ok: false, message: "No se indicó la máquina." };
  if (!isEquipmentStatus(status)) {
    return { ok: false, message: "Selecciona un estado válido." };
  }

  const trimmed = reason.trim();
  let normalizedReason: string | null = null;

  if (status !== "Operativa") {
    if (trimmed.length < MIN_REASON) {
      return { ok: false, message: `Indica el motivo (mínimo ${MIN_REASON} caracteres).` };
    }
    if (trimmed.length > MAX_REASON) {
      return { ok: false, message: `El motivo admite hasta ${MAX_REASON} caracteres.` };
    }
    normalizedReason = trimmed;
  }

  try {
    await updateEquipmentStatus(id, { status, reason: normalizedReason });
  } catch (cause) {
    logActionError("equipment.updateStatus", cause);
    return {
      ok: false,
      message: describeApiError(cause, "No pudimos cambiar el estado de la máquina."),
    };
  }

  revalidatePath("/admin/equipment");
  revalidatePath("/equipment");
  return { ok: true };
}
