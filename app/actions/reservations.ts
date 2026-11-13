"use server";

import { revalidatePath } from "next/cache";

import { hasAnyRole } from "@/lib/auth-guard";
import { cancelReservation } from "@/lib/api/reservations";
import { describeApiError, errorCode, logActionError } from "@/lib/actions/errors";
import type { ActionResult } from "@/lib/actions/form-state";

/** H5 · Cancela una reserva del miembro autenticado. */
export async function cancelReservationAction(id: string): Promise<ActionResult> {
  if (!(await hasAnyRole(["MIEMBRO"]))) {
    return {
      ok: false,
      message: "Solo los miembros pueden cancelar sus reservas.",
      code: "forbidden",
    };
  }
  if (!id) return { ok: false, message: "No se indicó la reserva a cancelar." };

  try {
    await cancelReservation(id);
  } catch (cause) {
    logActionError("DELETE /api/reservations/:id", cause);
    return {
      ok: false,
      message: describeApiError(cause, "No pudimos cancelar la reserva."),
      code: errorCode(cause),
    };
  }

  revalidatePath("/my-reservations");
  revalidatePath("/classes/book");
  return { ok: true };
}
