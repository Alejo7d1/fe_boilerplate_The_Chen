"use server";

import { describeApiError, isConflict, isForbidden, isNotFound, logActionError } from "@/lib/actions/errors";
import { checkIn } from "@/lib/api/access";
import { hasAnyRole } from "@/lib/auth-guard";
import type { CheckInResult } from "@/lib/types/access";

const FORBIDDEN = "Solo recepción/administración puede registrar ingresos.";

export interface CheckInState {
  error?: string;
  fieldErrors?: Record<string, string>;
  /** `forbidden` habilita el switch de excepción para reintentar. */
  code?: "forbidden" | "not-found" | "conflict" | "invalid" | "unauthorized";
  outcome?: CheckInResult;
}

/**
 * H9 · Registra el ingreso.
 * El switch «Autorizar por Excepción» solo aplica cuando el backend responde
 * `403` por membresía vencida; por eso el código viaja en el estado.
 */
export async function checkInAction(
  _prevState: CheckInState,
  formData: FormData
): Promise<CheckInState> {
  if (!(await hasAnyRole(["RECEPCION_ADMIN"]))) {
    return { error: FORBIDDEN, code: "unauthorized" };
  }

  const cardNumber = String(formData.get("cardNumber") ?? "").trim();
  const allowException = formData.get("allowException") === "true";

  if (!cardNumber) {
    return {
      error: "Revisa los campos marcados.",
      fieldErrors: { cardNumber: "Ingresa el carné o el nombre del miembro." },
    };
  }

  try {
    const outcome = await checkIn({ cardNumber, allowException });
    return { outcome };
  } catch (cause) {
    logActionError("access.checkIn", cause);
    return {
      error: describeApiError(cause, "No pudimos registrar el ingreso."),
      code: isForbidden(cause)
        ? "forbidden"
        : isNotFound(cause)
          ? "not-found"
          : isConflict(cause)
            ? "conflict"
            : undefined,
    };
  }
}
