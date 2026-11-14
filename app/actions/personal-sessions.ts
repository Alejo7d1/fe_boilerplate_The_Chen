"use server";

import { revalidatePath } from "next/cache";

import { describeApiError, errorCode, logActionError } from "@/lib/actions/errors";
import type { ActionResult } from "@/lib/actions/form-state";
import { bookPersonalSession } from "@/lib/api/trainers";
import { hasAnyRole } from "@/lib/auth-guard";

/** H8 · Agenda una sesión personal en un bloque de disponibilidad libre. */
export async function bookPersonalSessionAction(
  trainerId: string,
  slotId: string
): Promise<ActionResult> {
  if (!(await hasAnyRole(["MIEMBRO"]))) {
    return {
      ok: false,
      message: "Solo los miembros pueden agendar sesiones personales.",
      code: "forbidden",
    };
  }
  if (!trainerId || !slotId) {
    return { ok: false, message: "No se indicó el bloque a agendar." };
  }

  try {
    await bookPersonalSession({ trainerId, slotId });
  } catch (cause) {
    logActionError("POST /api/personal-sessions", cause);
    return {
      ok: false,
      message: describeApiError(cause, "No pudimos agendar la sesión."),
      code: errorCode(cause),
    };
  }

  revalidatePath("/trainers/book");
  revalidatePath("/trainer/availability");
  return { ok: true };
}
