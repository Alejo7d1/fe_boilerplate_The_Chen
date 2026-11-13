// lib/types/memberships.ts
// H1 · Consulta del estado de membresía.
// H2 · Registro de compra o renovación de membresía.
// Contrato pendiente de confirmar con Backend: ver docs/api-contracts.md.

import type { EntityId, IsoDate } from "@/lib/types/common";
import type { MembershipPlan } from "@/lib/types/plans";

/**
 * Membresía del miembro autenticado.
 * Campos tomados de FE-1.1: plan, estado, vencimiento y clases restantes.
 */
export interface Membership {
  id: EntityId;
  plan: Pick<MembershipPlan, "id" | "name">;
  /** TODO(contract): el backend aún no documenta los valores de estado. */
  status: string;
  /** Fecha de vencimiento de la membresía. TODO(contract): nombre del campo. */
  expiresAt: IsoDate;
  /** Clases restantes; `null` cuando el plan es ilimitado. */
  remainingClasses: number | null;
}

/** Solicitud de compra o renovación. El endpoint es exclusivo de `RECEPCION_ADMIN`. */
export interface PurchaseMembershipRequest {
  memberId: EntityId;
  planId: EntityId;
}
