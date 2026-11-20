"use server";

import { revalidatePath } from "next/cache";

import { hasAnyRole } from "@/lib/auth-guard";
import { purchaseMembership } from "@/lib/api/memberships";
import { searchMembers } from "@/lib/api/members";
import { describeApiError, logActionError } from "@/lib/actions/errors";
import type { FormState } from "@/lib/actions/form-state";
import type { MemberSummary } from "@/lib/types/members";

const FORBIDDEN = "Solo recepción/administración puede registrar compras de membresía.";

export type MemberSearchResult =
  | { members: MemberSummary[] }
  | { error: string };

/** Búsqueda de miembros para el selector de la compra. */
export async function searchMembersAction(query: string): Promise<MemberSearchResult> {
  if (!(await hasAnyRole(["RECEPCION_ADMIN"]))) {
    return { error: FORBIDDEN };
  }

  try {
    return { members: await searchMembers(query) };
  } catch (cause) {
    logActionError("GET /api/users", cause);
    return {
      error: describeApiError(
        cause,
        "La búsqueda de miembros no está disponible. Ingresa el identificador manualmente."
      ),
    };
  }
}

/** H2 · Registra la compra o renovación de una membresía. */
export async function purchaseMembershipAction(
  _prevState: FormState,
  formData: FormData
): Promise<FormState> {
  if (!(await hasAnyRole(["RECEPCION_ADMIN"]))) return { error: FORBIDDEN };

  const memberId = String(formData.get("memberId") ?? "").trim();
  const planId = String(formData.get("planId") ?? "").trim();

  const fieldErrors: Record<string, string> = {};
  if (!memberId) fieldErrors.memberId = "Selecciona o ingresa el miembro.";
  if (!planId) fieldErrors.planId = "Selecciona un plan.";

  if (Object.keys(fieldErrors).length > 0) {
    return { error: "Completa los datos de la compra.", fieldErrors };
  }

  try {
    await purchaseMembership({ memberId, planId });
  } catch (cause) {
    logActionError("POST /api/memberships/purchase", cause);
    return {
      error: describeApiError(cause, "No pudimos registrar la compra de la membresía."),
    };
  }

  revalidatePath("/membership");
  revalidatePath("/admin/plans");
  return { success: true };
}
