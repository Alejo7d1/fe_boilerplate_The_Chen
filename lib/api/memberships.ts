// lib/api/memberships.ts
// H1 · Estado de membresía del miembro autenticado.
// H2 · Registro de compra o renovación (admin).

import { apiFetch } from "@/lib/api";
import { API_ROUTES } from "@/lib/api-routes";
import {
  asRecord,
  readIsoDate,
  readNullableNumber,
  readOptionalString,
  readString,
} from "@/lib/api/normalize";
import type { Membership, PurchaseMembershipRequest } from "@/lib/types/memberships";

/**
 * `GET /api/memberships/me` devuelve la membresía plana (`planId` + `planName`).
 * Cuando el miembro no tiene membresía, responde `{ id: null, status: 'Sin Membresía', ... }`;
 * eso se representa como `null`, no como error de contrato.
 */
export function normalizeMembership(
  raw: unknown,
  context = "membresía"
): Membership | null {
  const record = asRecord(raw, context);

  const id = readOptionalString(record, ["id", "_id", "membershipId"]);
  const status = readOptionalString(record, ["status", "estado"]);
  if (!id || !status) return null;

  return {
    id,
    status,
    planId: readString(record, context, ["planId", "plan_id"]),
    planName: readString(record, context, ["planName", "nombrePlan", "name"]),
    endDate: readIsoDate(record, context, [
      "endDate",
      "expiresAt",
      "fechaVencimiento",
    ]),
    remainingClasses: readNullableNumber(record, context, [
      "remainingClasses",
      "classesRemaining",
      "clasesRestantes",
    ]),
  };
}

export async function getMyMembership(): Promise<Membership | null> {
  const payload = await apiFetch<unknown>(API_ROUTES.memberships.me);
  return normalizeMembership(payload, "GET /api/memberships/me");
}

/**
 * TODO(contract): el cuerpo y la respuesta de la compra no están documentados.
 * No se leen campos de la respuesta; el estado se obtiene refrescando `/membership`.
 */
export async function purchaseMembership(
  input: PurchaseMembershipRequest
): Promise<void> {
  await apiFetch<unknown>(API_ROUTES.memberships.purchase, {
    method: "POST",
    body: JSON.stringify({
      memberId: input.memberId,
      planId: input.planId,
    } satisfies PurchaseMembershipRequest),
  });
}
