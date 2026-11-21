"use server";

import { revalidatePath } from "next/cache";

import {
  describeApiError,
  errorCode,
  logActionError,
} from "@/lib/actions/errors";
import type { ActionErrorCode } from "@/lib/actions/form-state";
import { listPendingCharges, processPayment } from "@/lib/api/payments";
import { searchMembers } from "@/lib/api/members";
import { hasAnyRole } from "@/lib/auth-guard";
import {
  digitsOnly,
  parseExpiry,
  validateCardNumber,
  validateCvv,
  validateExpiry,
  validateHolder,
} from "@/lib/payment-card";
import type {
  PaymentReceipt,
  PendingChargesPage,
  PendingChargesQuery,
} from "@/lib/types/payments";
import type { MemberSummary } from "@/lib/types/members";

const PENDING_FORBIDDEN =
  "Solo recepción/administración puede consultar los cobros pendientes.";
const PAY_FORBIDDEN = "Solo el miembro titular puede pagar este cobro.";

export type PendingChargesResult =
  | { ok: true; page: PendingChargesPage }
  | { ok: false; message: string };

export type ChargeMemberSearchResult =
  | { ok: true; members: MemberSummary[] }
  | { ok: false; message: string };

/** H11 · Búsqueda de miembros por nombre o carné para el filtro del listado. */
export async function searchChargeMembersAction(
  query: string
): Promise<ChargeMemberSearchResult> {
  if (!(await hasAnyRole(["RECEPCION_ADMIN"]))) {
    return { ok: false, message: PENDING_FORBIDDEN };
  }

  try {
    return { ok: true, members: await searchMembers(query) };
  } catch (cause) {
    logActionError("payments.searchMembers", cause);
    return {
      ok: false,
      message: describeApiError(cause, "La búsqueda de miembros no está disponible."),
    };
  }
}

/** H11 · Listado filtrado y paginado, para refrescar la tabla sin recargar. */
export async function listPendingChargesAction(
  query: PendingChargesQuery
): Promise<PendingChargesResult> {
  if (!(await hasAnyRole(["RECEPCION_ADMIN"]))) {
    return { ok: false, message: PENDING_FORBIDDEN };
  }
  if (query.startDate && query.endDate && query.startDate > query.endDate) {
    return { ok: false, message: "El rango de fechas está invertido." };
  }

  try {
    return { ok: true, page: await listPendingCharges(query) };
  } catch (cause) {
    logActionError("payments.pendingCharges", cause);
    return {
      ok: false,
      message: describeApiError(cause, "No pudimos cargar los cobros pendientes."),
    };
  }
}

export interface PaymentFormInput {
  chargeId: string;
  holder: string;
  cardNumber: string;
  /** Vencimiento tal como se escribe en el formulario: `MM/YY`. */
  expiry: string;
  cvv: string;
}

export type ProcessPaymentActionResult =
  | { ok: true; receipt: PaymentReceipt }
  | {
      ok: false;
      message: string;
      fieldErrors?: Record<string, string>;
      code?: ActionErrorCode;
    };

/**
 * H10 · Procesa el cobro.
 * Las reglas se repiten aquí (además del formulario) porque la acción es
 * alcanzable por POST directo.
 */
export async function processPaymentAction(
  input: PaymentFormInput
): Promise<ProcessPaymentActionResult> {
  if (!(await hasAnyRole(["MIEMBRO"]))) {
    return { ok: false, message: PAY_FORBIDDEN, code: "forbidden" };
  }

  const chargeId = input.chargeId.trim();
  const fieldErrors: Record<string, string> = {};

  if (!chargeId) fieldErrors.chargeId = "No se indicó el cobro.";
  const holderError = validateHolder(input.holder);
  if (holderError) fieldErrors.holder = holderError;
  const cardError = validateCardNumber(input.cardNumber);
  if (cardError) fieldErrors.cardNumber = cardError;
  const expiryError = validateExpiry(input.expiry);
  if (expiryError) fieldErrors.expiry = expiryError;
  const cvvError = validateCvv(input.cvv);
  if (cvvError) fieldErrors.cvv = cvvError;

  if (Object.keys(fieldErrors).length > 0) {
    return { ok: false, message: "Revisa los datos de la tarjeta.", fieldErrors };
  }

  const expiry = parseExpiry(input.expiry);
  if (!expiry) {
    return {
      ok: false,
      message: "Revisa los datos de la tarjeta.",
      fieldErrors: { expiry: "Usa el formato MM/YY." },
    };
  }

  try {
    const receipt = await processPayment({
      chargeId,
      cardNumber: digitsOnly(input.cardNumber),
      expMonth: expiry.month,
      expYear: expiry.year,
      cvv: digitsOnly(input.cvv),
    });

    revalidatePath("/admin/pending-charges");
    return { ok: true, receipt };
  } catch (cause) {
    logActionError("payments.process", cause);
    return {
      ok: false,
      message: describeApiError(cause, "No pudimos procesar el cobro."),
      code: errorCode(cause),
    };
  }
}
